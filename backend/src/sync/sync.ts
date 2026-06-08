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

/** Détermine la compétition d'après le nom du tournoi. */
function competitionFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("crampons")) return "LDC";
  if (n.includes("heureu") || n.includes("papa")) return "UEFA";
  return "OTHER";
}

/** Année du nom (ex. "... 2026"). Défaut 2025 si absente. */
function yearFromName(name: string): number {
  const m = name.match(/(20\d{2})/);
  return m ? Number(m[1]) : 2025;
}

export async function runSync(
  mpg: MpgConnector,
  opts?: { leagueId?: string }
): Promise<SyncResult> {
  const notes: string[] = [];
  const counters = {
    gameSeasons: 0,
    divisions: 0,
    participations: 0,
    awards: 0,
    tournaments: 0,
    matches: 0,
  };
  const managerIds = new Set<string>();

  // Soit une ligue explicite (resync ponctuel d'une ligue masquée), soit les ligues SUIVIES
  // (TrackedLeague active) — on ne synchronise pas les autres ligues de l'utilisateur.
  let leagueTiles: { leagueId: string }[];
  if (opts?.leagueId) {
    leagueTiles = [{ leagueId: opts.leagueId }];
  } else {
    const tracked = await prisma.trackedLeague.findMany({ where: { active: true } });
    leagueTiles = tracked.map((t) => ({ leagueId: t.mpgLeagueId }));
    if (leagueTiles.length === 0) {
      notes.push(
        "Aucune ligue suivie. Ajoute des ligues à synchroniser depuis la page Admin."
      );
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
        const winners = await mpg.apiGet<any>(
          `/league/${tile.leagueId}/winners?season=${season}`
        );
        championshipSeason = winners?.championshipSeason;
      } catch {
        // saison passée non exposée : on tentera quand même les standings.
      }

      // Saison réelle (adossée au championnat Ligue 1). Repli si l'année est inconnue.
      const year = championshipSeason;
      const realName = year ? `${year}-${year + 1}` : `${league.name} — saison ${season}`;
      const realSeason = await prisma.realSeason.upsert({
        where: { name: realName },
        update: { championshipSeason: year ?? undefined, year: year ?? season },
        create: { name: realName, year: year ?? season, championshipSeason: year ?? undefined },
      });

      const isFinished = season < currentSeason || league.status === 5;
      const gameSeason = await prisma.gameSeason.upsert({
        where: { mpgLeagueId_mpgSeason: { mpgLeagueId: tile.leagueId, mpgSeason: season } },
        update: {
          realSeasonId: realSeason.id,
          name: `Saison ${season}`,
          index: season,
          mpgChampionshipId: championshipId,
          status: isFinished ? "finished" : "active",
        },
        create: {
          realSeasonId: realSeason.id,
          index: season,
          name: `Saison ${season}`,
          mpgLeagueId: tile.leagueId,
          mpgSeason: season,
          mpgChampionshipId: championshipId,
          status: isFinished ? "finished" : "active",
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

        // Map userId MPG → managerId (pour les matchs H2H).
        const userToManager = new Map<string, string>();

        // Noms d'équipe (teamId → {name, abbr}) pour cette division.
        const teamInfo = new Map<string, { name?: string; abbr?: string }>();
        try {
          const teams = await mpg.apiGet<any>(`/teams/division/${divId}`);
          for (const t of Array.isArray(teams) ? teams : []) {
            teamInfo.set(t.id, { name: t.name, abbr: t.abbreviation });
          }
        } catch {
          // équipes indisponibles
        }
        const division = await prisma.division.upsert({
          where: { gameSeasonId_level: { gameSeasonId: gameSeason.id, level: d } },
          update: { name: divName, mpgDivisionId: divId },
          create: { gameSeasonId: gameSeason.id, level: d, name: divName, mpgDivisionId: divId },
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
            const playerName = p
              ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || null
              : null;
            const playerClub = club?.name?.["fr-FR"] ?? club?.name?.["en-GB"] ?? null;
            const owner = bp.ownerId
              ? await prisma.manager.findUnique({ where: { mpgUserId: bp.ownerId } })
              : null;
            await prisma.divisionAward.upsert({
              where: { divisionId_kind: { divisionId: division.id, kind: "BEST_PLAYER" } },
              update: { managerId: owner?.id ?? null, playerName, playerClub, averageRating: bp.averageRating, goals: bp.goals },
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
              0
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
            const mgr = uid
              ? await prisma.manager.findUnique({ where: { mpgUserId: uid } })
              : null;
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

        // Matchs (head-to-head) : aller-retour → (nb équipes - 1) * 2 journées.
        const teamCount = standings.standings.length;
        const totalGameWeeks = Math.max(0, (teamCount - 1) * 2);
        for (let gw = 1; gw <= totalGameWeeks; gw++) {
          let matchesData: any;
          try {
            matchesData = await mpg.apiGet<any>(`/division/${divId}/game-week/${gw}/matches`);
          } catch {
            break; // journée non disponible → on arrête
          }
          const dms: any[] = matchesData?.divisionMatches ?? [];
          if (dms.length === 0) break;
          for (const m of dms) {
            if (!m?.finalResult) continue; // match non joué
            const homeId = m.home?.userId ? userToManager.get(m.home.userId) : null;
            const awayId = m.away?.userId ? userToManager.get(m.away.userId) : null;
            const data = {
              divisionId: division.id,
              gameWeek: gw,
              homeManagerId: homeId ?? null,
              awayManagerId: awayId ?? null,
              homeScore: m.home?.score ?? 0,
              awayScore: m.away?.score ?? 0,
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
        const year = yearFromName(t.name ?? tt.name);
        // Coupe "année N" ↔ saison réelle (N-1) (convention MPG : année = fin de saison).
        const realSeason = await prisma.realSeason.findFirst({ where: { year: year - 1 } });
        const data = {
          name: t.name ?? tt.name,
          competition: competitionFromName(t.name ?? tt.name),
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
