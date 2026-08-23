import { Router } from "express";
import { prisma } from "../../db/client.js";
import { requireAuth } from "../../http/middleware.js";
import { nextMatchOf, playedMatchesOf, summarizeForm } from "../palmares/form.js";

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
          }
        : null;

    // Forme récente (tous matchs joués confondus) + prochain rendez-vous.
    const { timeline, lastMatch } = summarizeForm(await playedMatchesOf(managerId), managerId);
    const upcoming = phase === "enCours" ? await nextMatchOf(managerId) : null;
    const next = upcoming
        ? (() => {
              const isHome = upcoming.homeManagerId === managerId;
              const opp = isHome ? upcoming.awayManager : upcoming.homeManager;
              const oppId = isHome ? upcoming.awayManagerId : upcoming.homeManagerId;
              return {
                  gameWeek: upcoming.gameWeek,
                  opponent: opp?.displayName ?? null,
                  opponentId: oppId,
                  opponentRank: oppId ? (rankByManager.get(oppId) ?? null) : null,
                  kickoffAt: upcoming.kickoffAt,
              };
          })()
        : null;

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
        last: lastMatch,
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
