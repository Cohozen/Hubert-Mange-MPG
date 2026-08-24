import type { FormMatch } from "@/components/business/stats/types";

export type SeasonPhase = "enCours" | "inter" | "estivale";

export interface DashboardSeason {
    realSeason: string;
    gameSeason: string;
    gameSeasonIndex: number;
    division: string | null;
    level: number | null;
    currentGameWeek: number | null;
    totalGameWeeks: number | null;
    startDate: string | null;
    endDate: string | null;
    finished: boolean;
}
export interface DashboardRank {
    position: number | null;
    delta: number | null;
    points: number;
    played: number;
    leaderPoints: number;
    gap: number;
    progressPct: number | null;
    gameWeeksLeft: number | null;
    zone: Zone | null;
    zoneGap: number | null; // points d'écart avec l'objectif
    zoneTarget: string | null; // « promotion », « maintien », « titre », « 3e »…
}

/** Enjeu de la place occupée dans la division. */
export type Zone = "titre" | "promotion" | "maintien" | "relegation";
export interface DashboardNext {
    gameWeek: number;
    opponent: string | null;
    opponentId: string | null;
    opponentRank: number | null;
    kickoffAt: string | null;
}
export interface DashboardMercato {
    budget: number | null;
    closed: boolean | null;
    nextTurnAt: string | null;
}
export interface DashboardCagnotte {
    currency: string;
    buyIn: number; // centimes
    paid: boolean;
    gains: number; // centimes
}
export interface CupSummary {
    count: number;
    years: number[];
}
export interface DashboardPalmares {
    trophies: number;
    titlesByLevel: { level: number; count: number; years: string[] }[];
    cups: { ldc: CupSummary; uefa: CupSummary; conference: CupSummary };
    firstLevel: number | null;
    firstYear: number | null;
}

/** Réponse de GET /api/dashboard : tout l'Accueil du manager connecté. */
export interface Dashboard {
    phase: SeasonPhase;
    season: DashboardSeason | null;
    rank: DashboardRank | null;
    next: DashboardNext | null;
    upcoming: DashboardNext[]; // les 3 prochains rendez-vous (le 1er = `next`)
    last: FormMatch | null;
    live: FormMatch | null; // journée en direct : score provisoire, exclu des stats
    form: FormMatch[];
    mercato: DashboardMercato | null;
    cagnotte: DashboardCagnotte | null;
    palmares: DashboardPalmares;
}

/** « 1er », « 2e »… */
export const ordinal = (n: number) => (n === 1 ? "er" : "e");

/** Années d'une coupe façon maquette : « 2024 » ou « 2023 · 25 ». */
export function shortYears(years: number[]): string {
    const sorted = [...years].sort((a, b) => a - b);
    if (!sorted.length) return "—";
    return sorted.map((y, i) => (i === 0 ? String(y) : String(y).slice(2))).join(" · ");
}

/** Jours entiers jusqu'à une date ISO (null si absente ou passée). */
export function daysUntil(iso: string | null): number | null {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    return diff > 0 ? Math.ceil(diff / 86_400_000) : null;
}

/** « dim. 14 sept. » — date courte d'un rendez-vous à venir (null si le match n'est pas daté). */
export function shortDate(iso: string | null): string | null {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}
