import { prisma } from "../../db/client.js";

/** Un match vu du manager : résultat, score dans son sens, adversaire et contexte. */
export interface FormMatch {
    result: "W" | "D" | "L";
    score: string;
    opponent: string | null;
    opponentId: string | null;
    gameWeek: number;
    gameSeason: string;
    realSeason: string;
    context: string;
}

/** Forme récente et séries de victoires d'un manager. */
export interface FormSummary {
    timeline: FormMatch[]; // tous les matchs joués, du plus ancien au plus récent
    currentWinStreak: number; // 0 dès que le dernier match n'est pas une victoire
    streakSince: FormMatch | null; // 1er match de la série en cours
    lastMatch: FormMatch | null;
    lastWin: FormMatch | null;
    bestWinStreak: number;
}

const matchInclude = {
    homeManager: true,
    awayManager: true,
    division: { include: { gameSeason: { include: { realSeason: true } } } },
} as const;

type MatchWithContext = Awaited<ReturnType<typeof playedMatchesOf>>[number];

/**
 * Matchs JOUÉS d'un manager, en ordre chronologique.
 *
 * `Match` n'a pas de date de jeu : on rejoue la convention du /timeline (année réelle → saison
 * MPG → journée). Surtout PAS de groupement par ligue MPG — les IDs de ligue changent au fil des
 * migrations séquentielles et couperaient toutes les séries. Le filtre `played` est indispensable
 * depuis que les matchs à venir sont eux aussi en base.
 */
export async function playedMatchesOf(managerId: string) {
    const matches = await prisma.match.findMany({
        where: { played: true, OR: [{ homeManagerId: managerId }, { awayManagerId: managerId }] },
        include: matchInclude,
    });
    return matches.sort(
        (a, b) =>
            a.division.gameSeason.realSeason.year - b.division.gameSeason.realSeason.year ||
            a.division.gameSeason.index - b.division.gameSeason.index ||
            a.gameWeek - b.gameWeek,
    );
}

/** Prochain match à venir d'un manager (le plus proche), ou null. */
export async function nextMatchOf(managerId: string) {
    const upcoming = await prisma.match.findMany({
        where: { played: false, OR: [{ homeManagerId: managerId }, { awayManagerId: managerId }] },
        include: matchInclude,
    });
    return (
        upcoming.sort(
            (a, b) =>
                a.division.gameSeason.realSeason.year - b.division.gameSeason.realSeason.year ||
                a.division.gameSeason.index - b.division.gameSeason.index ||
                a.gameWeek - b.gameWeek,
        )[0] ?? null
    );
}

/** Transforme un match en ligne de forme, vue du manager. */
export function toFormMatch(m: MatchWithContext, managerId: string): FormMatch {
    const isHome = m.homeManagerId === managerId;
    const oppMgr = isHome ? m.awayManager : m.homeManager;
    const mine = (isHome ? m.homeScore : m.awayScore) ?? 0;
    const theirs = (isHome ? m.awayScore : m.homeScore) ?? 0;
    return {
        result: mine > theirs ? "W" : mine < theirs ? "L" : "D",
        score: `${mine}-${theirs}`,
        opponent: oppMgr?.displayName ?? null,
        opponentId: (isHome ? m.awayManagerId : m.homeManagerId) ?? null,
        gameWeek: m.gameWeek,
        gameSeason: m.division.gameSeason.name,
        realSeason: m.division.gameSeason.realSeason.name,
        context: `${m.division.name} · ${m.division.gameSeason.name}`,
    };
}

/**
 * Séries de victoires d'un manager sur ses matchs joués (déjà triés chronologiquement).
 * `currentWinStreak` retombe à 0 sur un nul ou une défaite ; on remonte alors le dernier match
 * et la dernière victoire pour situer la série.
 */
export function summarizeForm(chrono: MatchWithContext[], managerId: string): FormSummary {
    const timeline = chrono.map((m) => toFormMatch(m, managerId));

    let bestWinStreak = 0;
    let winRun = 0;
    for (const t of timeline) {
        winRun = t.result === "W" ? winRun + 1 : 0;
        if (winRun > bestWinStreak) bestWinStreak = winRun;
    }

    let currentWinStreak = 0;
    for (let i = timeline.length - 1; i >= 0 && timeline[i].result === "W"; i--) currentWinStreak++;

    let lastWin: FormMatch | null = null;
    for (let i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].result === "W") {
            lastWin = timeline[i];
            break;
        }
    }

    return {
        timeline,
        currentWinStreak,
        streakSince: currentWinStreak > 0 ? timeline[timeline.length - currentWinStreak] : null,
        lastMatch: timeline.at(-1) ?? null,
        lastWin,
        bestWinStreak,
    };
}
