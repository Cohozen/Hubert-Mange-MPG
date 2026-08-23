import { MpgConnector } from "../connector/index.js";
import { prisma } from "../db/client.js";

/**
 * Sync admin : authentifie l'admin auprès de MPG et remplit la base à partir des endpoints
 * réels de api.mpg.football (découverts via HAR + crawler `npm run discover`).
 *
 * Pour chaque ligue visible du dashboard, on parcourt les saisons MPG de 1 à la saison
 * courante. Les IDs encodant la saison (mpg_division_{shortId}_{saison}_{division}), on peut
 * rapatrier l'historique des saisons passées tant que MPG les expose encore.
 *
 * Source par division : /division/{id}/ranking/standings — contient à la fois le classement
 * (rank, points, V/N/D, buts) ET l'identité des managers (teamsUsers).
 */
export interface SyncResult {
    authenticated: boolean;
    leagues: number;
    gameSeasons: number;
    divisions: number;
    managers: number;
    participations: number;
    awards: number;
    tournaments: number;
    matches: number;
    notes: string[];
}

/**
 * Détermine la compétition d'après le nom du tournoi. 3 niveaux comme en vrai :
 * LDC (Ligue des Crampons), UEFA (Europa, "Heureux papa's League"), CONFERENCE.
 * Ordre important : un nom Conference contient aussi "papa"/"heureu".
 */
export function competitionFromName(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("crampons")) return "LDC";
    if (n.includes("conference") || n.includes("conférence")) return "CONFERENCE";
    if (n.includes("heureu") || n.includes("papa")) return "UEFA";
    return "OTHER";
}

/**
 * Année de la coupe = année de création MPG (`createdAt`), car elle n'est pas toujours dans le nom.
 * Replis : année du nom (ex. "... 2026"), puis année courante.
 */
function tournamentYear(t: any, fallbackName: string): number {
    if (t?.createdAt) {
        const y = new Date(t.createdAt).getFullYear();
        if (y) return y;
    }
    const m = String(fallbackName).match(/(20\d{2})/);
    return m ? Number(m[1]) : new Date().getFullYear();
}

/**
 * Année du championnat réel actuellement en cours, par championshipId (1 = Ligue 1).
 *
 * Indispensable pour une saison EN COURS : `/league/{id}/winners?season=N` renvoie 404 tant que
 * la saison n'est pas terminée, donc `championshipSeason` est introuvable par ce biais. Sans ce
 * repli, on crée une RealSeason bâtarde ("<ligue> — saison N", year = N) qu'un sync ultérieur ne
 * corrige jamais (la clé `name` est unique et diffère de la bonne).
 */
interface ActiveChampionship {
    season: number;
    startDate: Date | null;
    endDate: Date | null;
}

async function activeChampionshipSeasons(mpg: MpgConnector): Promise<Map<string, ActiveChampionship>> {
    const seasons = new Map<string, ActiveChampionship>();
    try {
        const active = await mpg.apiGet<any>("/championships/active");
        for (const [id, c] of Object.entries<any>(active?.championships ?? {})) {
            if (typeof c?.season === "number") {
                seasons.set(String(id), {
                    season: c.season,
                    startDate: parseDate(c.startDate),
                    endDate: parseDate(c.endDate),
                });
            }
        }
    } catch {
        // Repli assuré par la logique appelante (on laissera la saison sans année).
    }
    return seasons;
}

function parseDate(value: unknown): Date | null {
    if (typeof value !== "string") return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Dates de coup d'envoi des journées du championnat réel (1 = Ligue 1), par numéro de journée.
 *
 * `/division/{id}/game-week/{n}/matches` ne porte AUCUNE date : la seule façon de dater un match
 * est de passer par la journée L1 correspondante (`/division/{id}/calendar` → `realGameWeek`) puis
 * par ce calendrier. ⚠️ L'endpoint ne renvoie que la saison en cours — on ne date donc que les
 * matchs d'une saison active. Mis en cache par championnat pour la durée du sync.
 */
async function championshipGameWeekDates(mpg: MpgConnector, championshipId: string): Promise<Map<number, Date>> {
    const dates = new Map<number, Date>();
    try {
        const cal = await mpg.apiGet<any>(`/championship-calendar/${championshipId}`);
        for (const gw of Object.values<any>(cal?.gameWeeks ?? {})) {
            const start = parseDate(gw?.startDate);
            if (typeof gw?.gameWeekNumber === "number" && start) dates.set(gw.gameWeekNumber, start);
        }
    } catch {
        // Calendrier indisponible : les matchs resteront sans date (dashboard sans compte à rebours).
    }
    return dates;
}

export async function runSync(mpg: MpgConnector, opts?: { leagueId?: string }): Promise<SyncResult> {
    const notes: string[] = [];
    // Un seul appel au calendrier par championnat pour tout le run.
    const calendarCache = new Map<string, Map<number, Date>>();
    const championshipDates = async (championshipId: string) => {
        let dates = calendarCache.get(championshipId);
        if (!dates) {
            dates = await championshipGameWeekDates(mpg, championshipId);
            calendarCache.set(championshipId, dates);
        }
        return dates;
    };
    const counters = {
        gameSeasons: 0,
        divisions: 0,
        participations: 0,
        awards: 0,
        tournaments: 0,
        matches: 0,
    };
    const managerIds = new Set<string>();
    const activeSeasons = await activeChampionshipSeasons(mpg);

    // Soit une ligue explicite (resync ponctuel d'une ligue masquée), soit les ligues SUIVIES
    // (TrackedLeague active) — on ne synchronise pas les autres ligues de l'utilisateur.
    let leagueTiles: { leagueId: string }[];
    if (opts?.leagueId) {
        leagueTiles = [{ leagueId: opts.leagueId }];
    } else {
        const tracked = await prisma.trackedLeague.findMany({ where: { active: true } });
        leagueTiles = tracked.map((t) => ({ leagueId: t.mpgLeagueId }));
        if (leagueTiles.length === 0) {
            notes.push("Aucune ligue suivie. Ajoute des ligues à synchroniser depuis la page Admin.");
        }
    }

    for (const tile of leagueTiles) {
        // Le token courant (admin connecté pour un sync manuel) ne voit pas forcément toutes les
        // ligues suivies : certaines ont pu être ajoutées par un autre admin. On ignore alors la
        // ligue avec une note, au lieu de planter tout le sync.
        let league: any;
        try {
            league = await mpg.apiGet<any>(`/league/${tile.leagueId}`);
        } catch {
            notes.push(`Ligue ${tile.leagueId} : non accessible avec ce compte, ignorée.`);
            continue;
        }
        const shortId: string = league.shortId;
        const currentSeason: number = league.season ?? 1;
        const totalDivisions: number = Object.keys(league.divisions ?? {}).length || 1;
        const championshipId = String(league.gameSettings?.championshipId ?? "");

        for (let season = 1; season <= currentSeason; season++) {
            // Vainqueurs : donne l'année Ligue 1 réelle (championshipSeason) + structure finale.
            let championshipSeason: number | undefined;
            try {
                const winners = await mpg.apiGet<any>(`/league/${tile.leagueId}/winners?season=${season}`);
                championshipSeason = winners?.championshipSeason;
            } catch {
                // saison passée non exposée : on tentera quand même les standings.
            }

            // Saison réelle (adossée au championnat Ligue 1). Pour la saison en cours, /winners
            // n'existe pas encore : on prend l'année du championnat actif.
            const active = season === currentSeason ? activeSeasons.get(championshipId) : undefined;
            const year = championshipSeason ?? active?.season;
            const realName = year ? `${year}-${year + 1}` : `${league.name} — saison ${season}`;
            const realSeason = await prisma.realSeason.upsert({
                where: { name: realName },
                update: { championshipSeason: year ?? undefined, year: year ?? season },
                create: { name: realName, year: year ?? season, championshipSeason: year ?? undefined },
            });

            const isFinished = season < currentSeason || league.status === 5;
            const seasonDates = { startDate: active?.startDate ?? undefined, endDate: active?.endDate ?? undefined };
            const gameSeason = await prisma.gameSeason.upsert({
                where: { mpgLeagueId_mpgSeason: { mpgLeagueId: tile.leagueId, mpgSeason: season } },
                update: {
                    realSeasonId: realSeason.id,
                    name: `Saison ${season}`,
                    index: season,
                    mpgChampionshipId: championshipId,
                    status: isFinished ? "finished" : "active",
                    ...seasonDates,
                },
                create: {
                    realSeasonId: realSeason.id,
                    index: season,
                    name: `Saison ${season}`,
                    mpgLeagueId: tile.leagueId,
                    mpgSeason: season,
                    mpgChampionshipId: championshipId,
                    status: isFinished ? "finished" : "active",
                    ...seasonDates,
                },
            });
            counters.gameSeasons++;

            let seasonHadData = false;
            for (let d = 1; d <= totalDivisions; d++) {
                const divId = `mpg_division_${shortId}_${season}_${d}`;
                let standings: any;
                try {
                    standings = await mpg.apiGet<any>(`/division/${divId}/ranking/standings`);
                } catch {
                    continue; // division/saison non exposée
                }
                if (!standings?.standings?.length) continue;
                seasonHadData = true;

                // On normalise toujours le nom (les noms MPG varient d'une année à l'autre).
                const divName = `Division ${d}`;

                // Map userId MPG → managerId (pour les matchs joués) et teamId → managerId (un
                // match À VENIR ne porte que le teamId, MPG n'y expose pas encore les userId).
                const userToManager = new Map<string, string>();
                const teamToManager = new Map<string, string>();

                // Équipes de la division : nom, abréviation et budget mercato restant.
                const teamInfo = new Map<string, { name?: string; abbr?: string; budget?: number }>();
                try {
                    const teams = await mpg.apiGet<any>(`/teams/division/${divId}`);
                    for (const t of Array.isArray(teams) ? teams : []) {
                        teamInfo.set(t.id, { name: t.name, abbr: t.abbreviation, budget: t.budget });
                    }
                } catch {
                    // équipes indisponibles
                }
                // État live (journée en cours, mercato) : n'a de sens que pour une saison en cours,
                // et c'est ce qui alimente le dashboard d'accueil. `/division/{id}` donne aussi le
                // vrai nombre de journées, plus fiable que le calcul (nbÉquipes - 1) × 2.
                let live: { currentGameWeek?: number; totalGameWeeks?: number } = {};
                let mercato: { mercatoClosed?: boolean; nextMercatoTurn?: Date | null } = {};
                if (!isFinished) {
                    try {
                        const detail = await mpg.apiGet<any>(`/division/${divId}`);
                        live = {
                            currentGameWeek: detail?.liveState?.currentGameWeek,
                            totalGameWeeks: detail?.liveState?.totalGameWeeks,
                        };
                        mercato = {
                            mercatoClosed: detail?.mercatoState?.mercatoClosed,
                            nextMercatoTurn: parseDate(detail?.mercatoState?.nextMercatoTurn),
                        };
                    } catch {
                        // détail de division indisponible : le dashboard se rabattra sur les standings
                    }
                }
                const divisionState = {
                    currentGameWeek: live.currentGameWeek ?? null,
                    totalGameWeeks: live.totalGameWeeks ?? null,
                    mercatoClosed: mercato.mercatoClosed ?? null,
                    nextMercatoTurn: mercato.nextMercatoTurn ?? null,
                };
                const division = await prisma.division.upsert({
                    where: { gameSeasonId_level: { gameSeasonId: gameSeason.id, level: d } },
                    update: { name: divName, mpgDivisionId: divId, ...divisionState },
                    create: {
                        gameSeasonId: gameSeason.id,
                        level: d,
                        name: divName,
                        mpgDivisionId: divId,
                        ...divisionState,
                    },
                });
                counters.divisions++;

                for (const row of standings.standings) {
                    const u = standings.teamsUsers?.[row.teamId];
                    if (!u?.id) continue;
                    const manager = await prisma.manager.upsert({
                        where: { mpgUserId: u.id },
                        update: {
                            displayName: u.firstName || u.username || u.id,
                            username: u.username,
                            avatarUrl: u.avatarUrl,
                        },
                        create: {
                            mpgUserId: u.id,
                            displayName: u.firstName || u.username || u.id,
                            username: u.username,
                            avatarUrl: u.avatarUrl,
                        },
                    });
                    managerIds.add(manager.id);
                    userToManager.set(u.id, manager.id);
                    teamToManager.set(row.teamId, manager.id);

                    const team = teamInfo.get(row.teamId);
                    const stats = {
                        finalRank: row.rank,
                        points: row.points,
                        played: row.played,
                        won: row.won,
                        drawn: row.drawn,
                        lost: row.lost,
                        goalsFor: row.goals,
                        goalsAgainst: row.goalsConceded,
                        mpgTeamId: row.teamId,
                        teamName: team?.name ?? null,
                        teamAbbr: team?.abbr ?? null,
                        rankVariation: row.variation ?? null,
                        budget: team?.budget ?? null,
                    };
                    await prisma.participation.upsert({
                        where: { managerId_divisionId: { managerId: manager.id, divisionId: division.id } },
                        update: stats,
                        create: { managerId: manager.id, divisionId: division.id, ...stats },
                    });
                    counters.participations++;
                }

                // Rotaldo d'Or : meilleur joueur de la division (depuis division-season-stats).
                try {
                    const stats = await mpg.apiGet<any>(`/division-season-stats/${divId}`);
                    const bp = stats?.bestPlayer;
                    if (bp?.playerId) {
                        const p = stats.playersData?.relatedPlayers?.[bp.playerId];
                        const club = p?.clubId ? stats.playersData?.relatedClubs?.[p.clubId] : null;
                        const playerName = p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || null : null;
                        const playerClub = club?.name?.["fr-FR"] ?? club?.name?.["en-GB"] ?? null;
                        const owner = bp.ownerId
                            ? await prisma.manager.findUnique({ where: { mpgUserId: bp.ownerId } })
                            : null;
                        await prisma.divisionAward.upsert({
                            where: { divisionId_kind: { divisionId: division.id, kind: "BEST_PLAYER" } },
                            update: {
                                managerId: owner?.id ?? null,
                                playerName,
                                playerClub,
                                averageRating: bp.averageRating,
                                goals: bp.goals,
                            },
                            create: {
                                divisionId: division.id,
                                kind: "BEST_PLAYER",
                                managerId: owner?.id ?? null,
                                playerName,
                                playerClub,
                                averageRating: bp.averageRating,
                                goals: bp.goals,
                            },
                        });
                        counters.awards++;
                    }

                    // Bouc émissaire : le plus de malus (bonus adverses) subis.
                    const sg = stats?.scapeGoat;
                    if (sg?.teamId) {
                        const userId = standings.teamsUsers?.[sg.teamId]?.id;
                        const victim = userId
                            ? await prisma.manager.findUnique({ where: { mpgUserId: userId } })
                            : null;
                        const totalMalus = Object.values(sg.bonusesSuffered ?? {}).reduce(
                            (a: number, v: any) => a + (Number(v) || 0),
                            0,
                        );
                        await prisma.divisionAward.upsert({
                            where: { divisionId_kind: { divisionId: division.id, kind: "SCAPEGOAT" } },
                            update: { managerId: victim?.id ?? null, value: totalMalus },
                            create: {
                                divisionId: division.id,
                                kind: "SCAPEGOAT",
                                managerId: victim?.id ?? null,
                                value: totalMalus,
                            },
                        });
                        counters.awards++;
                    }

                    // Révélation : joueur à la plus forte hausse de cote (crédité au propriétaire).
                    const rstar = stats?.raisingStar;
                    if (rstar?.teamId) {
                        const uid = standings.teamsUsers?.[rstar.teamId]?.id;
                        const mgr = uid ? await prisma.manager.findUnique({ where: { mpgUserId: uid } }) : null;
                        const gain = (rstar.lastQuotation?.value ?? 0) - (rstar.firstQuotation?.value ?? 0);
                        await prisma.divisionAward.upsert({
                            where: { divisionId_kind: { divisionId: division.id, kind: "RAISING_STAR" } },
                            update: { managerId: mgr?.id ?? null, value: gain },
                            create: {
                                divisionId: division.id,
                                kind: "RAISING_STAR",
                                managerId: mgr?.id ?? null,
                                value: gain,
                            },
                        });
                        counters.awards++;
                    }
                } catch {
                    // stats de saison indisponibles pour cette division
                }

                // Calendrier de la division : journée MPG → journée L1 réelle. Sert à dater les
                // matchs (via le calendrier du championnat), donc inutile sur une saison finie.
                const realGameWeeks = new Map<number, number>();
                if (!isFinished) {
                    try {
                        const cal = await mpg.apiGet<any>(`/division/${divId}/calendar`);
                        for (const f of cal?.fixtures ?? []) {
                            if (typeof f?.gameWeek === "number" && typeof f?.realGameWeek === "number") {
                                realGameWeeks.set(f.gameWeek, f.realGameWeek);
                            }
                        }
                    } catch {
                        // calendrier indisponible : matchs sans date
                    }
                }
                const gameWeekDates = realGameWeeks.size ? await championshipDates(championshipId) : null;

                // Matchs : les journées à venir sont stockées elles aussi (played = false), elles
                // alimentent le « prochain rendez-vous » du dashboard. Repli sur aller-retour
                // (nb équipes - 1) × 2 quand MPG ne donne pas le nombre de journées.
                const teamCount = standings.standings.length;
                const totalGameWeeks = live.totalGameWeeks ?? Math.max(0, (teamCount - 1) * 2);
                for (let gw = 1; gw <= totalGameWeeks; gw++) {
                    let matchesData: any;
                    try {
                        matchesData = await mpg.apiGet<any>(`/division/${divId}/game-week/${gw}/matches`);
                    } catch {
                        break; // journée non disponible → on arrête
                    }
                    const dms: any[] = matchesData?.divisionMatches ?? [];
                    if (dms.length === 0) break;
                    const realGw = realGameWeeks.get(gw);
                    const kickoffAt = realGw ? (gameWeekDates?.get(realGw) ?? null) : null;
                    for (const m of dms) {
                        // « Joué » = MPG a posé un score. `finalResult` n'apparaît qu'une fois la
                        // journée close (absent pendant le live), et `status` vaut 1 ou 2 selon
                        // l'âge du match : la présence des scores est le seul critère fiable.
                        const played = m.home?.score != null && m.away?.score != null;
                        // Un match à venir n'expose que le teamId, pas le userId du manager.
                        const homeId =
                            (m.home?.userId ? userToManager.get(m.home.userId) : null) ??
                            (m.home?.teamId ? teamToManager.get(m.home.teamId) : null);
                        const awayId =
                            (m.away?.userId ? userToManager.get(m.away.userId) : null) ??
                            (m.away?.teamId ? teamToManager.get(m.away.teamId) : null);
                        const data = {
                            divisionId: division.id,
                            gameWeek: gw,
                            homeManagerId: homeId ?? null,
                            awayManagerId: awayId ?? null,
                            homeScore: played ? m.home.score : null,
                            awayScore: played ? m.away.score : null,
                            played,
                            kickoffAt,
                        };
                        await prisma.match.upsert({
                            where: { mpgMatchId: m.id },
                            update: data,
                            create: { mpgMatchId: m.id, ...data },
                        });
                        counters.matches++;
                    }
                }
            }

            if (!seasonHadData) {
                notes.push(`Saison ${season} de ${league.name} : aucun classement exposé (ignorée).`);
            }
        }
    }

    // Tournois (coupes) SUIVIS uniquement (sauf en resync d'une ligue précise).
    if (!opts?.leagueId) {
        const tracked = await prisma.trackedTournament.findMany({ where: { active: true } });
        for (const tt of tracked) {
            try {
                const t = await mpg.apiGet<any>(`/tournament/${tt.mpgTournamentId}`);
                const winner = t.finishedState?.winner;
                const owner = winner?.userId
                    ? await prisma.manager.findUnique({ where: { mpgUserId: winner.userId } })
                    : null;
                const year = tournamentYear(t, t.name ?? tt.name);
                // Coupe "année N" ↔ saison réelle (N-1) (convention MPG : année = fin de saison).
                const realSeason = await prisma.realSeason.findFirst({ where: { year: year - 1 } });
                const data = {
                    name: t.name ?? tt.name,
                    competition: tt.competitionOverride ?? competitionFromName(t.name ?? tt.name),
                    year,
                    realSeasonId: realSeason?.id ?? null,
                    winnerManagerId: owner?.id ?? null,
                    winnerName: winner?.firstName ?? winner?.username ?? null,
                    status: String(t.status ?? ""),
                };
                await prisma.tournament.upsert({
                    where: { mpgTournamentId: tt.mpgTournamentId },
                    update: data,
                    create: { mpgTournamentId: tt.mpgTournamentId, ...data },
                });
                counters.tournaments++;
            } catch {
                notes.push(`Tournoi ${tt.name} : lecture échouée.`);
            }
        }
    }

    return {
        authenticated: true,
        leagues: leagueTiles.length,
        gameSeasons: counters.gameSeasons,
        divisions: counters.divisions,
        managers: managerIds.size,
        participations: counters.participations,
        awards: counters.awards,
        tournaments: counters.tournaments,
        matches: counters.matches,
        notes,
    };
}
