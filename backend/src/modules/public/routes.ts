import { Router } from "express";
import { prisma } from "../../db/client.js";

/**
 * Module PUBLIC : les seules routes accessibles sans être connecté.
 * Elles ne renvoient que des agrégats (des compteurs) — jamais de nom, d'email ou de donnée perso,
 * puisque la réponse est lisible par n'importe qui.
 */
export const publicRouter = Router();

/**
 * Chiffres d'ambiance du hero de la page de connexion (affiché AVANT authentification, donc
 * incapable de taper les endpoints protégés).
 *
 * - `saison`   : saison réelle la plus récente, au format "2026/2027".
 * - `equipes`  : nombre d'équipes de la saison jeu en cours (= participations de cette saison).
 * - `divisions`: nombre de divisions de cette même saison jeu.
 * - `editions` : nombre de ligues MPG successives qui composent le palmarès (une ligue = une
 *                édition ; l'ID de ligue MPG change à chaque nouvelle formule).
 */
publicRouter.get("/teaser", async (_req, res) => {
    // Saison en cours = saison réelle la plus récente ; sa dernière saison jeu porte la structure
    // actuelle (nombre de divisions et d'équipes).
    const realSeason = await prisma.realSeason.findFirst({
        orderBy: { year: "desc" },
        include: {
            gameSeasons: {
                orderBy: { index: "desc" },
                take: 1,
                include: {
                    divisions: { include: { _count: { select: { participations: true } } } },
                },
            },
        },
    });

    const gameSeason = realSeason?.gameSeasons[0];
    const divisions = gameSeason?.divisions ?? [];
    const equipes = divisions.reduce((total, d) => total + d._count.participations, 0);

    // Une édition = une ligue MPG. On compte les ligues réellement synchronisées (pas les ligues
    // suivies) pour ne jamais annoncer une édition dont le palmarès est vide.
    const leagues = await prisma.gameSeason.findMany({
        where: { mpgLeagueId: { not: null } },
        distinct: ["mpgLeagueId"],
        select: { mpgLeagueId: true },
    });

    res.json({
        saison: realSeason ? `${realSeason.year}/${realSeason.year + 1}` : null,
        equipes,
        editions: leagues.length,
        divisions: divisions.length,
    });
});
