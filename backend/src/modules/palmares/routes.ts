import { Router } from "express";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../http/middleware.js";

/**
 * Module palmarès / historique (lecture). Calcule vainqueurs, classement all-time « façon JO »
 * (tableau des médailles par division), et classements "fun" (montées / descentes).
 */
export const palmaresRouter = Router();

palmaresRouter.use(requireAuth);

// Vainqueurs par saison jeu (1er de chaque division) + vainqueurs de coupe.
palmaresRouter.get("/winners", async (_req, res) => {
    const divisions = await prisma.division.findMany({
        include: {
            gameSeason: { include: { realSeason: true } },
            participations: { where: { finalRank: 1 }, include: { manager: true } },
        },
        orderBy: [
            { gameSeason: { realSeason: { year: "desc" } } },
            { gameSeason: { mpgSeason: "desc" } }, // saison MPG la plus récente d'abord (3 → 2 → 1)
            { level: "asc" },
        ],
    });

    const divisionWinners = divisions
        .filter((d) => d.participations.length > 0)
        .map((d) => {
            const p = d.participations[0];
            const leagueId = d.gameSeason.mpgLeagueId;
            // Saison terminée → le site utilise /winner/{league}/{division}/ranking.
            const mpgUrl =
                leagueId && d.mpgDivisionId
                    ? `https://mpg.football/winner/${leagueId}/${d.mpgDivisionId}/ranking`
                    : null;
            return {
                season: `${d.gameSeason.realSeason.name} — ${d.gameSeason.name}`,
                realSeason: d.gameSeason.realSeason.name,
                gameSeasonIndex: d.gameSeason.index,
                division: d.name,
                level: d.level,
                winner: p?.manager.displayName ?? null,
                username: p?.manager.username ?? null,
                avatarUrl: p?.manager.avatarUrl ?? null,
                managerId: p?.managerId ?? null,
                team: p?.teamName ?? null,
                mpgUrl,
            };
        });

    res.json({ divisionWinners });
});

// Classement all-time « façon Jeux Olympiques » : on compte les titres (1re place) par niveau de
// division. On classe d'abord sur le nombre de titres de D1, puis D2, etc. (ordre lexicographique).
// Pas de notion de podium ici (un classement dédié existe dans /fun-stats).
palmaresRouter.get("/all-time", async (_req, res) => {
    const managers = await prisma.manager.findMany({
        include: { participations: { include: { division: true } } },
    });

    // Coupes par manager : départagent le classement APRÈS les championnats (cf. comparateur plus bas).
    const cupRows = await prisma.tournament.findMany({
        where: { winnerManagerId: { not: null } },
        select: { winnerManagerId: true },
    });
    const cupTotals = new Map<string, number>();
    for (const t of cupRows) {
        cupTotals.set(t.winnerManagerId!, (cupTotals.get(t.winnerManagerId!) ?? 0) + 1);
    }

    let maxLevel = 1;
    const rows = managers
        .map((m) => {
            const titlesByLevel = new Map<number, number>();
            for (const p of m.participations) {
                if (p.finalRank === 1) {
                    const lvl = p.division.level;
                    titlesByLevel.set(lvl, (titlesByLevel.get(lvl) ?? 0) + 1);
                    if (lvl > maxLevel) maxLevel = lvl;
                }
            }
            return {
                managerId: m.id,
                manager: m.displayName,
                username: m.username,
                avatarUrl: m.avatarUrl,
                seasonsPlayed: m.participations.length,
                titlesByLevel,
            };
        })
        .filter((r) => r.seasonsPlayed > 0);

    // Vecteur des titres par niveau (index 0 = D1) + total, longueur normalisée à maxLevel.
    const withTitles = rows.map((r) => {
        const titles = Array.from({ length: maxLevel }, (_, i) => r.titlesByLevel.get(i + 1) ?? 0);
        return {
            managerId: r.managerId,
            manager: r.manager,
            username: r.username,
            avatarUrl: r.avatarUrl,
            seasonsPlayed: r.seasonsPlayed,
            titles,
            totalTitles: titles.reduce((a, b) => a + b, 0),
            // Total des coupes (toutes compétitions) : sert uniquement au départage, pas à `totalTitles`.
            cupTitles: cupTotals.get(r.managerId) ?? 0,
        };
    });

    // Tri médailles : plus de titres D1, puis D2, ... ; à vecteur égal on départage par le nombre de
    // coupes, PUIS par moins de saisons jouées, puis le nom.
    const sameRank = (a: { titles: number[]; cupTitles: number }, b: { titles: number[]; cupTitles: number }) =>
        a.cupTitles === b.cupTitles && a.titles.every((v, i) => v === b.titles[i]);
    withTitles.sort((a, b) => {
        for (let i = 0; i < maxLevel; i++) {
            if (b.titles[i] !== a.titles[i]) return b.titles[i] - a.titles[i];
        }
        return b.cupTitles - a.cupTitles || a.seasonsPlayed - b.seasonsPlayed || a.manager.localeCompare(b.manager);
    });

    // Rang avec ex æquo : mêmes titres de division ET même nombre de coupes → même rang.
    const ranking = withTitles.map((r, i) => ({ ...r, rank: i + 1 }));
    for (let i = 1; i < ranking.length; i++) {
        if (sameRank(ranking[i], ranking[i - 1])) ranking[i].rank = ranking[i - 1].rank;
    }

    res.json({ ranking, maxLevel });
});

// Classements "fun" : montées et descentes entre saisons jeu consécutives (même ligue).
palmaresRouter.get("/movements", async (_req, res) => {
    const managers = await prisma.manager.findMany({
        include: {
            participations: {
                include: { division: { include: { gameSeason: true } } },
            },
        },
    });

    type Mv = {
        managerId: string;
        manager: string;
        username: string | null;
        avatarUrl: string | null;
        count: number;
    };
    const promotions: Mv[] = [];
    const relegations: Mv[] = [];

    for (const m of managers) {
        // Trie les participations par ligue puis n° de saison MPG.
        const sorted = m.participations
            .filter((p) => p.division.gameSeason.mpgSeason != null)
            .sort((a, b) => {
                const la = a.division.gameSeason.mpgLeagueId ?? "";
                const lb = b.division.gameSeason.mpgLeagueId ?? "";
                if (la !== lb) return la < lb ? -1 : 1;
                return (a.division.gameSeason.mpgSeason ?? 0) - (b.division.gameSeason.mpgSeason ?? 0);
            });

        let up = 0;
        let down = 0;
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const cur = sorted[i];
            if (prev.division.gameSeason.mpgLeagueId !== cur.division.gameSeason.mpgLeagueId) continue;
            // Niveau plus petit = division supérieure = montée.
            if (cur.division.level < prev.division.level) up++;
            else if (cur.division.level > prev.division.level) down++;
        }
        const base = {
            managerId: m.id,
            manager: m.displayName,
            username: m.username,
            avatarUrl: m.avatarUrl,
        };
        if (up > 0) promotions.push({ ...base, count: up });
        if (down > 0) relegations.push({ ...base, count: down });
    }

    promotions.sort((a, b) => b.count - a.count);
    relegations.sort((a, b) => b.count - a.count);

    // Yo-yo = total des mouvements (montées + descentes).
    const yoyoMap = new Map<string, Mv>();
    for (const p of promotions) yoyoMap.set(p.managerId, { ...p });
    for (const r of relegations) {
        const e = yoyoMap.get(r.managerId) ?? { ...r, count: 0 };
        e.count += r.count;
        yoyoMap.set(r.managerId, e);
    }
    const yoyo = [...yoyoMap.values()].sort((a, b) => b.count - a.count);

    res.json({ promotions, relegations, yoyo });
});

// Rotaldo d'Or : meilleur joueur par division/saison + classement all-time des managers.
palmaresRouter.get("/rotaldo", async (_req, res) => {
    const awards = await prisma.divisionAward.findMany({
        where: { kind: "BEST_PLAYER" },
        include: {
            manager: true,
            division: { include: { gameSeason: { include: { realSeason: true } } } },
        },
        orderBy: [{ division: { gameSeason: { realSeason: { year: "desc" } } } }, { division: { level: "asc" } }],
    });

    const bySeason = awards.map((a) => ({
        season: `${a.division.gameSeason.realSeason.name} — ${a.division.gameSeason.name}`,
        division: a.division.name,
        player: a.playerName,
        club: a.playerClub,
        averageRating: a.averageRating,
        goals: a.goals,
        manager: a.manager?.displayName ?? null,
        managerId: a.managerId,
    }));

    // Classement all-time : nombre de Rotaldo d'Or par manager (joueurs possédés élus).
    const counts = new Map<string, { manager: string; count: number }>();
    for (const a of awards) {
        if (!a.managerId || !a.manager) continue;
        const entry = counts.get(a.managerId) ?? { manager: a.manager.displayName, count: 0 };
        entry.count++;
        counts.set(a.managerId, entry);
    }
    const ranking = [...counts.entries()]
        .map(([managerId, v]) => ({ managerId, ...v }))
        .sort((a, b) => b.count - a.count);

    res.json({ bySeason, ranking });
});

// Stats fun (centrées managers) : bouc émissaire, passoire, attaque, Rotaldo, points.
palmaresRouter.get("/fun-stats", async (_req, res) => {
    const managers = await prisma.manager.findMany({
        select: { id: true, displayName: true, username: true, avatarUrl: true },
    });
    const infoOf = new Map(managers.map((m) => [m.id, m]));

    const agg = await prisma.participation.groupBy({
        by: ["managerId"],
        _sum: { goalsFor: true, goalsAgainst: true, points: true },
    });
    const podiumAgg = await prisma.participation.groupBy({
        by: ["managerId"],
        where: { finalRank: { lte: 3 } },
        _count: { _all: true },
    });
    // Jean-Claude Duss : le plus de fois 2e (« du mal à conclure »).
    const secondAgg = await prisma.participation.groupBy({
        by: ["managerId"],
        where: { finalRank: 2 },
        _count: { _all: true },
    });
    const awards = await prisma.divisionAward.findMany({
        where: { kind: { in: ["SCAPEGOAT", "BEST_PLAYER", "RAISING_STAR"] } },
    });

    // Bouc émissaire (malus subis), Rotaldo (meilleur joueur), Révélation (raising star).
    const scape = new Map<string, number>();
    const rotaldo = new Map<string, number>();
    const raisingStar = new Map<string, number>();
    for (const a of awards) {
        if (!a.managerId) continue;
        if (a.kind === "SCAPEGOAT") scape.set(a.managerId, (scape.get(a.managerId) ?? 0) + (a.value ?? 0));
        if (a.kind === "BEST_PLAYER") rotaldo.set(a.managerId, (rotaldo.get(a.managerId) ?? 0) + 1);
        if (a.kind === "RAISING_STAR") raisingStar.set(a.managerId, (raisingStar.get(a.managerId) ?? 0) + 1);
    }

    // Plus longue série de titres consécutifs (rang 1 sur saisons jeu consécutives).
    const mgrsForStreak = await prisma.manager.findMany({
        include: {
            participations: { include: { division: { include: { gameSeason: { include: { realSeason: true } } } } } },
        },
    });
    const streak = new Map<string, number>();
    // Saisons en D1 (level 1) : total cumulé et plus longue série consécutive.
    const d1Count = new Map<string, number>();
    const d1Streak = new Map<string, number>();
    for (const m of mgrsForStreak) {
        // Tri chronologique global (year → index MPG), comme le timeline du profil : on ne
        // groupe PAS par ligue, sinon une migration d'ID de ligue (séquentielle) casserait la série.
        const sorted = m.participations
            .slice()
            .sort(
                (a, b) =>
                    a.division.gameSeason.realSeason.year - b.division.gameSeason.realSeason.year ||
                    a.division.gameSeason.index - b.division.gameSeason.index,
            );
        let best = 0;
        let cur = 0;
        let bestD1 = 0;
        let curD1 = 0;
        let totalD1 = 0;
        for (const p of sorted) {
            cur = p.finalRank === 1 ? cur + 1 : 0;
            if (cur > best) best = cur;
            const isD1 = p.division.level === 1;
            if (isD1) totalD1 += 1;
            curD1 = isD1 ? curD1 + 1 : 0;
            if (curD1 > bestD1) bestD1 = curD1;
        }
        if (best >= 2) streak.set(m.id, best);
        if (totalD1 >= 1) d1Count.set(m.id, totalD1);
        if (bestD1 >= 2) d1Streak.set(m.id, bestD1);
    }

    const rank = (entries: [string, number][], min = 1) =>
        entries
            .filter(([id, v]) => infoOf.has(id) && v >= min)
            .map(([id, value]) => {
                const m = infoOf.get(id)!;
                return {
                    managerId: id,
                    manager: m.displayName,
                    username: m.username,
                    avatarUrl: m.avatarUrl,
                    value,
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

    res.json({
        scapeGoat: rank([...scape]),
        rotaldo: rank([...rotaldo]),
        raisingStar: rank([...raisingStar]),
        titleStreak: rank([...streak], 2),
        jeanClaudeDuss: rank(secondAgg.map((a) => [a.managerId, a._count._all])),
        d1Seasons: rank([...d1Count]),
        d1Streak: rank([...d1Streak], 2),
        podiums: rank(podiumAgg.map((a) => [a.managerId, a._count._all])),
        worstDefense: rank(agg.map((a) => [a.managerId, a._sum.goalsAgainst ?? 0])),
        bestAttack: rank(agg.map((a) => [a.managerId, a._sum.goalsFor ?? 0])),
        mostPoints: rank(agg.map((a) => [a.managerId, a._sum.points ?? 0])),
    });
});

// Head-to-head d'un manager : bilan global, par adversaire, bête noire, victime préférée,
// + la forme récente (5 derniers matchs) et les séries (en cours / meilleure série de victoires).
palmaresRouter.get("/h2h/:managerId", async (req, res) => {
    const id = req.params.managerId;
    const matches = await prisma.match.findMany({
        where: { OR: [{ homeManagerId: id }, { awayManagerId: id }] },
        include: {
            homeManager: true,
            awayManager: true,
            division: { include: { gameSeason: { include: { realSeason: true } } } },
        },
    });

    // Ordre chronologique : `Match` n'a pas de date, on rejoue la convention du /timeline
    // (année réelle → saison MPG → journée). Surtout PAS de groupement par ligue MPG : les IDs
    // de ligue changent au fil des migrations séquentielles et couperaient toutes les séries.
    const chrono = matches
        .slice()
        .sort(
            (a, b) =>
                a.division.gameSeason.realSeason.year - b.division.gameSeason.realSeason.year ||
                a.division.gameSeason.index - b.division.gameSeason.index ||
                a.gameWeek - b.gameWeek,
        );

    type FormMatch = {
        result: "W" | "D" | "L";
        score: string;
        opponent: string | null;
        opponentId: string | null;
        gameWeek: number;
        gameSeason: string;
        realSeason: string;
        context: string;
    };
    const timeline: FormMatch[] = [];
    let bestWinStreak = 0;
    let winRun = 0;

    type Opp = {
        opponentId: string;
        manager: string;
        username: string | null;
        avatarUrl: string | null;
        played: number;
        w: number;
        d: number;
        l: number;
        gf: number;
        ga: number;
    };
    const opp = new Map<string, Opp>();
    const overall = { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    let biggestWin: any = null;
    let biggestLoss: any = null;

    for (const m of chrono) {
        const isHome = m.homeManagerId === id;
        const oppMgr = isHome ? m.awayManager : m.homeManager;
        const oppId = isHome ? m.awayManagerId : m.homeManagerId;
        const mine = isHome ? m.homeScore : m.awayScore;
        const theirs = isHome ? m.awayScore : m.homeScore;
        const won = mine > theirs;
        const lost = mine < theirs;

        // Forme et séries : on compte le match même si l'adversaire n'a pas pu être résolu
        // (manager supprimé) — seuls les agrégats par adversaire l'ignorent, juste en dessous.
        timeline.push({
            result: won ? "W" : lost ? "L" : "D",
            score: `${mine}-${theirs}`,
            opponent: oppMgr?.displayName ?? null,
            opponentId: oppId ?? null,
            gameWeek: m.gameWeek,
            gameSeason: m.division.gameSeason.name,
            realSeason: m.division.gameSeason.realSeason.name,
            context: `${m.division.name} · ${m.division.gameSeason.name}`,
        });
        winRun = won ? winRun + 1 : 0;
        if (winRun > bestWinStreak) bestWinStreak = winRun;

        if (!oppId || !oppMgr) continue;

        const e = opp.get(oppId) ?? {
            opponentId: oppId,
            manager: oppMgr.displayName,
            username: oppMgr.username,
            avatarUrl: oppMgr.avatarUrl,
            played: 0,
            w: 0,
            d: 0,
            l: 0,
            gf: 0,
            ga: 0,
        };
        e.played++;
        e.gf += mine;
        e.ga += theirs;
        if (won) e.w++;
        else if (lost) e.l++;
        else e.d++;
        opp.set(oppId, e);

        overall.played++;
        overall.gf += mine;
        overall.ga += theirs;
        if (won) overall.w++;
        else if (lost) overall.l++;
        else overall.d++;

        const ctx = `${m.division.name} · ${m.division.gameSeason.realSeason.name} — ${m.division.gameSeason.name}`;
        const oppInfo = {
            opponent: oppMgr.displayName,
            opponentId: oppId,
            username: oppMgr.username,
            avatarUrl: oppMgr.avatarUrl,
        };
        if (won && (!biggestWin || mine - theirs > biggestWin.diff)) {
            biggestWin = { diff: mine - theirs, score: `${mine}-${theirs}`, context: ctx, ...oppInfo };
        }
        if (lost && (!biggestLoss || theirs - mine > biggestLoss.diff)) {
            biggestLoss = { diff: theirs - mine, score: `${mine}-${theirs}`, context: ctx, ...oppInfo };
        }
    }

    // Série de VICTOIRES en cours : retombe à 0 dès que le dernier match est un nul ou une défaite.
    // On remonte aussi le dernier match et la dernière victoire, pour situer une série à 0.
    let currentWinStreak = 0;
    for (let i = timeline.length - 1; i >= 0 && timeline[i].result === "W"; i--) currentWinStreak++;
    const lastMatch = timeline.at(-1) ?? null;
    const streakSince = currentWinStreak > 0 ? timeline[timeline.length - currentWinStreak] : null;
    let lastWin: FormMatch | null = null;
    for (let i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].result === "W") {
            lastWin = timeline[i];
            break;
        }
    }

    const opponents = [...opp.values()].sort((a, b) => b.played - a.played);
    const eligible = opponents.filter((o) => o.played >= 2);
    const beteNoire = [...eligible].sort((a, b) => b.l - b.w - (a.l - a.w) || b.l - a.l)[0] ?? null;
    const victimePreferee = [...eligible].sort((a, b) => b.w - b.l - (a.w - a.l) || b.w - a.w)[0] ?? null;

    res.json({
        overall,
        opponents,
        beteNoire: beteNoire && beteNoire.l > beteNoire.w ? beteNoire : null,
        victimePreferee: victimePreferee && victimePreferee.w > victimePreferee.l ? victimePreferee : null,
        biggestWin,
        biggestLoss,
        form: timeline.slice(-5), // 5 derniers matchs, du plus ancien au plus récent
        currentWinStreak,
        streakSince, // 1er match de la série en cours (null si série à 0)
        lastMatch,
        lastWin,
        bestWinStreak,
    });
});

// Chronologie de carrière d'un manager : une ligne par saison jouée (division, classement, bilan),
// triée du plus ancien au plus récent. Sert au graphique de trajectoire du profil.
palmaresRouter.get("/timeline/:managerId", async (req, res) => {
    const participations = await prisma.participation.findMany({
        where: { managerId: req.params.managerId },
        include: { division: { include: { gameSeason: { include: { realSeason: true } } } } },
    });

    const seasons = participations
        .map((p) => ({
            realSeason: p.division.gameSeason.realSeason.name,
            gameSeason: p.division.gameSeason.name,
            year: p.division.gameSeason.realSeason.year,
            mpgSeason: p.division.gameSeason.mpgSeason,
            index: p.division.gameSeason.index,
            division: p.division.name,
            level: p.division.level,
            finalRank: p.finalRank,
            points: p.points,
            played: p.played,
            won: p.won,
            drawn: p.drawn,
            lost: p.lost,
            goalsFor: p.goalsFor,
            goalsAgainst: p.goalsAgainst,
        }))
        .sort((a, b) => a.year - b.year || a.index - b.index)
        .map(({ index: _index, ...s }) => s);

    res.json({ seasons });
});

// Coupes (tournois) : palmarès par compétition/année + classement all-time.
palmaresRouter.get("/tournaments", async (_req, res) => {
    const tournaments = await prisma.tournament.findMany({
        include: { winnerManager: true },
        orderBy: [{ year: "desc" }, { competition: "asc" }],
    });

    const list = tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        competition: t.competition,
        year: t.year,
        winner: t.winnerManager?.displayName ?? t.winnerName ?? null,
        username: t.winnerManager?.username ?? null,
        avatarUrl: t.winnerManager?.avatarUrl ?? null,
        winnerManagerId: t.winnerManagerId,
        mpgUrl: `https://mpg.football/tournament/${t.mpgTournamentId}/bracket`,
    }));

    // All-time : nombre de coupes par manager (toutes compétitions).
    const counts = new Map<
        string,
        { manager: string; username: string | null; ldc: number; uefa: number; conference: number; total: number }
    >();
    for (const t of tournaments) {
        if (!t.winnerManagerId || !t.winnerManager) continue;
        const e = counts.get(t.winnerManagerId) ?? {
            manager: t.winnerManager.displayName,
            username: t.winnerManager.username,
            ldc: 0,
            uefa: 0,
            conference: 0,
            total: 0,
        };
        if (t.competition === "LDC") e.ldc++;
        else if (t.competition === "UEFA") e.uefa++;
        else if (t.competition === "CONFERENCE") e.conference++;
        e.total++;
        counts.set(t.winnerManagerId, e);
    }
    // Tri hiérarchique LDC > UEFA > CONFERENCE : la Conference ne passe jamais devant une UEFA.
    const ranking = [...counts.entries()]
        .map(([managerId, v]) => ({ managerId, ...v }))
        .sort(
            (a, b) =>
                b.ldc - a.ldc || b.uefa - a.uefa || b.conference - a.conference || a.manager.localeCompare(b.manager),
        );

    res.json({ list, ranking });
});
