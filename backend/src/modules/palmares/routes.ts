import { Router } from "express";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../http/middleware.js";

/**
 * Module palmarès / historique (lecture). Calcule vainqueurs, classement all-time pondéré
 * par la division, et classements "fun" (montées / descentes).
 */
export const palmaresRouter = Router();

palmaresRouter.use(requireAuth);

/**
 * Score de prestige : gagner une division supérieure vaut plus.
 * Poids d'une division = (nb de divisions de la saison) - niveau + 1.
 * Ex. en 6 divisions : gagner la D1 = poids 6, la D6 = poids 1.
 *  - 1er  → 3 × poids
 *  - 2e   → 1 × poids
 */
function rankPoints(rank: number | null, weight: number): number {
  if (rank === 1) return 3 * weight;
  if (rank === 2) return 1 * weight;
  return 0;
}

// Vainqueurs par saison jeu (1er de chaque division) + vainqueurs de coupe.
palmaresRouter.get("/winners", async (_req, res) => {
  const divisions = await prisma.division.findMany({
    include: {
      gameSeason: { include: { realSeason: true } },
      participations: { where: { finalRank: 1 }, include: { manager: true } },
    },
    orderBy: [{ gameSeason: { realSeason: { year: "desc" } } }, { level: "asc" }],
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

// Classement all-time pondéré par la division.
palmaresRouter.get("/all-time", async (_req, res) => {
  // Nb de divisions par saison jeu (pour le poids).
  const divisions = await prisma.division.groupBy({
    by: ["gameSeasonId"],
    _count: { _all: true },
  });
  const divCount = new Map(divisions.map((d) => [d.gameSeasonId, d._count._all]));

  const managers = await prisma.manager.findMany({
    include: { participations: { include: { division: true } } },
  });

  const ranking = managers
    .map((m) => {
      let score = 0;
      let divisionTitles = 0;
      let eliteTitles = 0;
      let podiums = 0;
      for (const p of m.participations) {
        const total = divCount.get(p.division.gameSeasonId) ?? p.division.level;
        const weight = Math.max(1, total - p.division.level + 1);
        score += rankPoints(p.finalRank, weight);
        if (p.finalRank === 1) {
          divisionTitles++;
          if (p.division.level === 1) eliteTitles++;
        }
        if (p.finalRank != null && p.finalRank <= 3) podiums++;
      }
      return {
        managerId: m.id,
        manager: m.displayName,
        username: m.username,
        avatarUrl: m.avatarUrl,
        seasonsPlayed: m.participations.length,
        score,
        divisionTitles,
        eliteTitles,
        podiums,
      };
    })
    .filter((r) => r.seasonsPlayed > 0)
    .sort((a, b) => b.score - a.score || b.eliteTitles - a.eliteTitles);

  res.json({ ranking });
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

  type Mv = { managerId: string; manager: string; username: string | null; avatarUrl: string | null; count: number };
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
    const base = { managerId: m.id, manager: m.displayName, username: m.username, avatarUrl: m.avatarUrl };
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
    orderBy: [
      { division: { gameSeason: { realSeason: { year: "desc" } } } },
      { division: { level: "asc" } },
    ],
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

  // Plus longue série de titres consécutifs (rang 1 sur saisons jeu consécutives, même ligue).
  const mgrsForStreak = await prisma.manager.findMany({
    include: { participations: { include: { division: { include: { gameSeason: true } } } } },
  });
  const streak = new Map<string, number>();
  for (const m of mgrsForStreak) {
    const sorted = m.participations
      .filter((p) => p.division.gameSeason.mpgSeason != null)
      .sort((a, b) => {
        const la = a.division.gameSeason.mpgLeagueId ?? "";
        const lb = b.division.gameSeason.mpgLeagueId ?? "";
        if (la !== lb) return la < lb ? -1 : 1;
        return (a.division.gameSeason.mpgSeason ?? 0) - (b.division.gameSeason.mpgSeason ?? 0);
      });
    let best = 0;
    let cur = 0;
    let prevLeague: string | null = null;
    for (const p of sorted) {
      const lg = p.division.gameSeason.mpgLeagueId ?? "";
      if (lg !== prevLeague) cur = 0;
      cur = p.finalRank === 1 ? cur + 1 : 0;
      if (cur > best) best = cur;
      prevLeague = lg;
    }
    if (best >= 2) streak.set(m.id, best);
  }

  const rank = (entries: [string, number][], min = 1) =>
    entries
      .filter(([id, v]) => infoOf.has(id) && v >= min)
      .map(([id, value]) => {
        const m = infoOf.get(id)!;
        return { managerId: id, manager: m.displayName, username: m.username, avatarUrl: m.avatarUrl, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

  res.json({
    scapeGoat: rank([...scape]),
    rotaldo: rank([...rotaldo]),
    raisingStar: rank([...raisingStar]),
    titleStreak: rank([...streak], 2),
    podiums: rank(podiumAgg.map((a) => [a.managerId, a._count._all])),
    worstDefense: rank(agg.map((a) => [a.managerId, a._sum.goalsAgainst ?? 0])),
    bestAttack: rank(agg.map((a) => [a.managerId, a._sum.goalsFor ?? 0])),
    mostPoints: rank(agg.map((a) => [a.managerId, a._sum.points ?? 0])),
  });
});

// Head-to-head d'un manager : bilan global, par adversaire, bête noire, victime préférée.
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

  for (const m of matches) {
    const isHome = m.homeManagerId === id;
    const oppMgr = isHome ? m.awayManager : m.homeManager;
    const oppId = isHome ? m.awayManagerId : m.homeManagerId;
    if (!oppId || !oppMgr) continue;
    const mine = isHome ? m.homeScore : m.awayScore;
    const theirs = isHome ? m.awayScore : m.homeScore;
    const won = mine > theirs;
    const lost = mine < theirs;

    const e =
      opp.get(oppId) ??
      {
        opponentId: oppId,
        manager: oppMgr.displayName,
        username: oppMgr.username,
        avatarUrl: oppMgr.avatarUrl,
        played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0,
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

    const ctx = `${m.division.name} · ${m.division.gameSeason.realSeason.name}`;
    if (won && (!biggestWin || mine - theirs > biggestWin.diff)) {
      biggestWin = { diff: mine - theirs, score: `${mine}-${theirs}`, opponent: oppMgr.displayName, context: ctx };
    }
    if (lost && (!biggestLoss || theirs - mine > biggestLoss.diff)) {
      biggestLoss = { diff: theirs - mine, score: `${mine}-${theirs}`, opponent: oppMgr.displayName, context: ctx };
    }
  }

  const opponents = [...opp.values()].sort((a, b) => b.played - a.played);
  const eligible = opponents.filter((o) => o.played >= 2);
  const beteNoire =
    [...eligible].sort((a, b) => b.l - b.w - (a.l - a.w) || b.l - a.l)[0] ?? null;
  const victimePreferee =
    [...eligible].sort((a, b) => b.w - b.l - (a.w - a.l) || b.w - a.w)[0] ?? null;

  res.json({
    overall,
    opponents,
    beteNoire: beteNoire && beteNoire.l > beteNoire.w ? beteNoire : null,
    victimePreferee: victimePreferee && victimePreferee.w > victimePreferee.l ? victimePreferee : null,
    biggestWin,
    biggestLoss,
  });
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
  const counts = new Map<string, { manager: string; ldc: number; uefa: number; total: number }>();
  for (const t of tournaments) {
    if (!t.winnerManagerId || !t.winnerManager) continue;
    const e =
      counts.get(t.winnerManagerId) ??
      { manager: t.winnerManager.displayName, ldc: 0, uefa: 0, total: 0 };
    if (t.competition === "LDC") e.ldc++;
    else if (t.competition === "UEFA") e.uefa++;
    e.total++;
    counts.set(t.winnerManagerId, e);
  }
  const ranking = [...counts.entries()]
    .map(([managerId, v]) => ({ managerId, ...v }))
    .sort((a, b) => b.ldc - a.ldc || b.total - a.total);

  res.json({ list, ranking });
});
