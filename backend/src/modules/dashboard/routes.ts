import { Router } from "express";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../http/middleware.js";
import { liveMatchOf, nextMatchesOf, playedMatchesOf, summarizeForm, toFormMatch } from "../palmares/form.js";

/**
 * Dashboard d'accueil : tout ce qui concerne le manager connecté « ici et maintenant ».
 *
 * C'est le seul endroit de l'API qui parle de la saison EN COURS (le palmarès, lui, ne compte
 * que les saisons terminées). Une seule route pour éviter au front d'enchaîner cinq requêtes.
 */
export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

/** Phase de vie de la ligue, déduite du statut des saisons et des dates du championnat réel. */
type Phase = "enCours" | "inter" | "estivale";

/** Enjeu de la place occupée dans la division. */
type Zone = "titre" | "promotion" | "maintien" | "relegation";

/**
 * Zone occupée et écart de points avec l'objectif suivant.
 *
 * MPG configure le nombre de montées/descentes par ligue
 * (`gameSettings.numberUpAndDownPreference`, 2 chez nous) ; on garde 2 en repli. Les extrêmes n'ont
 * pas toutes les zones : pas de promotion depuis la D1, pas de relégation depuis la dernière.
 */
function computeZone(
    rank: number,
    points: number,
    level: number,
    totalDivisions: number,
    rows: { finalRank: number | null; points: number | null }[],
    upAndDown: number,
): { zone: Zone; gap: number | null; target: string | null } {
    const teams = rows.length;
    const isTop = level === 1;
    const isBottom = level >= totalDivisions;
    const pointsAt = (r: number) => rows.find((x) => x.finalRank === r)?.points ?? null;
    // Écart avec la place visée : positif = ce qu'il manque, négatif = l'avance sur le poursuivant.
    const gapTo = (r: number) => {
        const p = pointsAt(r);
        return p == null ? null : Math.abs(p - points);
    };

    if (isTop && rank === 1) return { zone: "titre", gap: gapTo(2), target: "2e" };
    if (!isTop && rank <= upAndDown) {
        return { zone: "promotion", gap: gapTo(upAndDown + 1), target: `${upAndDown + 1}e` };
    }
    if (!isBottom && rank > teams - upAndDown) {
        return { zone: "relegation", gap: gapTo(teams - upAndDown), target: "maintien" };
    }
    // Maintien : l'objectif est la montée, ou le titre quand on est déjà dans l'élite.
    return isTop
        ? { zone: "maintien", gap: gapTo(1), target: "titre" }
        : { zone: "maintien", gap: gapTo(upAndDown), target: "promotion" };
}

dashboardRouter.get("/", async (req, res) => {
    const managerId = req.auth!.managerId;

    // Dernière participation du manager, du plus récent au plus ancien.
    const participations = await prisma.participation.findMany({
        where: { managerId },
        include: { division: { include: { gameSeason: { include: { realSeason: true } } } } },
    });
    const chrono = participations.sort(
        (a, b) =>
            a.division.gameSeason.realSeason.year - b.division.gameSeason.realSeason.year ||
            a.division.gameSeason.index - b.division.gameSeason.index,
    );
    const current = chrono.at(-1) ?? null;
    const first = chrono[0] ?? null;

    // Phase : saison ouverte → en cours ; sinon on regarde si le championnat réel court encore
    // (une nouvelle saison MPG va démarrer) ou s'il est terminé (trêve estivale).
    let phase: Phase = "estivale";
    if (current?.division.gameSeason.status === "active") {
        phase = "enCours";
    } else {
        const end = current?.division.gameSeason.endDate ?? null;
        phase = end && end.getTime() > Date.now() ? "inter" : "estivale";
    }

    const division = current?.division ?? null;
    const gameSeason = current?.division.gameSeason ?? null;

    // Classement de la division en cours : leader et rang de chaque équipe.
    const divisionRows = division
        ? await prisma.participation.findMany({
              where: { divisionId: division.id },
              include: { manager: true },
          })
        : [];
    const leaderPoints = divisionRows.reduce((max, r) => Math.max(max, r.points ?? 0), 0);
    const rankByManager = new Map(divisionRows.map((r) => [r.managerId, r.finalRank]));

    const totalDivisions = gameSeason ? await prisma.division.count({ where: { gameSeasonId: gameSeason.id } }) : 0;
    const zone =
        current?.finalRank && division && phase === "enCours"
            ? computeZone(
                  current.finalRank,
                  current.points ?? 0,
                  division.level,
                  totalDivisions,
                  divisionRows,
                  division.numberUpAndDown ?? 2,
              )
            : null;

    const totalGameWeeks = division?.totalGameWeeks ?? null;
    const playedWeeks = current?.played ?? 0;
    const rank = current
        ? {
              position: current.finalRank,
              delta: current.rankVariation,
              points: current.points ?? 0,
              played: playedWeeks,
              leaderPoints,
              gap: Math.max(0, leaderPoints - (current.points ?? 0)),
              progressPct: totalGameWeeks ? Math.round((playedWeeks / totalGameWeeks) * 100) : null,
              gameWeeksLeft: totalGameWeeks ? Math.max(0, totalGameWeeks - playedWeeks) : null,
              zone: zone?.zone ?? null,
              zoneGap: zone?.gap ?? null,
              zoneTarget: zone?.target ?? null,
          }
        : null;

    // Forme récente (matchs terminés uniquement) + match en direct + prochain rendez-vous.
    const { timeline, lastMatch } = summarizeForm(await playedMatchesOf(managerId), managerId);
    const liveMatch = phase === "enCours" ? await liveMatchOf(managerId) : null;
    // Les trois prochains rendez-vous : le premier nourrit le hero, la liste remplit la carte de
    // la dernière journée (qui, seule, laissait un vide à côté du palmarès en desktop).
    const upcoming = phase === "enCours" ? await nextMatchesOf(managerId, 3) : [];
    const nextList = upcoming.map((m) => {
        const isHome = m.homeManagerId === managerId;
        const opp = isHome ? m.awayManager : m.homeManager;
        const oppId = isHome ? m.awayManagerId : m.homeManagerId;
        return {
            gameWeek: m.gameWeek,
            opponent: opp?.displayName ?? null,
            opponentId: oppId,
            opponentRank: oppId ? (rankByManager.get(oppId) ?? null) : null,
            kickoffAt: m.kickoffAt,
        };
    });
    const next = nextList[0] ?? null;

    const mercato =
        phase === "enCours" && division
            ? {
                  budget: current?.budget ?? null,
                  closed: division.mercatoClosed,
                  nextTurnAt: division.nextMercatoTurn,
              }
            : null;

    // Cagnotte de la saison réelle en cours : ma mise et mes gains déjà attribués.
    const pool = gameSeason
        ? await prisma.prizePool.findUnique({
              where: { realSeasonId: gameSeason.realSeasonId },
              include: {
                  contributions: { where: { managerId } },
                  payouts: { where: { managerId } },
              },
          })
        : null;
    const contribution = pool?.contributions[0] ?? null;
    const cagnotte = pool
        ? {
              currency: pool.currency,
              buyIn: contribution?.amount ?? pool.buyInAmount,
              paid: contribution?.paid ?? false,
              gains: (pool.payouts ?? []).reduce((sum, p) => sum + p.amount, 0),
          }
        : null;

    // Palmarès personnel : titres de division (saisons terminées) et coupes.
    const titles = chrono.filter((p) => p.finalRank === 1 && p.division.gameSeason.status === "finished");
    const titlesByLevel = [...new Set(titles.map((t) => t.division.level))]
        .sort((a, b) => a - b)
        .map((level) => ({
            level,
            count: titles.filter((t) => t.division.level === level).length,
            years: titles.filter((t) => t.division.level === level).map((t) => t.division.gameSeason.realSeason.name),
        }));
    const cupWins = await prisma.tournament.findMany({
        where: { winnerManagerId: managerId },
        select: { competition: true, year: true },
    });
    const cupsOf = (code: string) => cupWins.filter((c) => c.competition === code);
    const cups = {
        ldc: { count: cupsOf("LDC").length, years: cupsOf("LDC").map((c) => c.year) },
        uefa: { count: cupsOf("UEFA").length, years: cupsOf("UEFA").map((c) => c.year) },
        conference: { count: cupsOf("CONFERENCE").length, years: cupsOf("CONFERENCE").map((c) => c.year) },
    };

    res.json({
        phase,
        season: gameSeason
            ? {
                  realSeason: gameSeason.realSeason.name,
                  gameSeason: gameSeason.name,
                  gameSeasonIndex: gameSeason.index,
                  division: division?.name ?? null,
                  level: division?.level ?? null,
                  currentGameWeek: division?.currentGameWeek ?? null,
                  totalGameWeeks,
                  startDate: gameSeason.startDate,
                  endDate: gameSeason.endDate,
                  finished: gameSeason.status === "finished",
              }
            : null,
        rank,
        next,
        upcoming: nextList,
        last: lastMatch,
        live: liveMatch ? toFormMatch(liveMatch, managerId) : null, // score provisoire, hors stats
        form: timeline.slice(-5),
        mercato,
        cagnotte,
        palmares: {
            trophies: titles.length + cupWins.length,
            titlesByLevel,
            cups,
            firstLevel: first?.division.level ?? null,
            firstYear: first?.division.gameSeason.realSeason.year ?? null,
        },
    });
});
