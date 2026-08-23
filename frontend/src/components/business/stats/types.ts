export interface OppRow {
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
}
export interface BigMatch {
    score: string;
    opponent: string;
    opponentId: string;
    username: string | null;
    avatarUrl: string | null;
    context: string;
}
/** Un match de la forme récente, vu du manager (résultat + score dans son sens). */
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
export interface H2H {
    overall: { played: number; w: number; d: number; l: number; gf: number; ga: number };
    opponents: OppRow[];
    beteNoire: OppRow | null;
    victimePreferee: OppRow | null;
    biggestWin: BigMatch | null;
    biggestLoss: BigMatch | null;
    form: FormMatch[]; // 5 derniers matchs, du plus ancien au plus récent
    currentWinStreak: number; // 0 dès que le dernier match n'est pas une victoire
    streakSince: FormMatch | null; // 1er match de la série en cours
    lastMatch: FormMatch | null;
    lastWin: FormMatch | null;
    bestWinStreak: number;
}

export interface AllTimeRow {
    managerId: string;
    manager: string;
    username: string | null;
    avatarUrl: string | null;
    seasonsPlayed: number;
    titles: number[]; // index 0 = titres D1, 1 = D2, ...
    totalTitles: number;
    rank: number;
}
export interface RankRow {
    managerId: string;
    manager: string;
    username: string | null;
    avatarUrl: string | null;
    value: number;
}
export interface CupCount {
    managerId: string;
    manager: string;
    ldc: number;
    uefa: number;
    conference: number;
    total: number;
}

/** Ligne normalisée du classement all-time (podium + suite), maquette Rétro V2. */
export interface RankingEntry {
    managerId: string;
    manager: string;
    username: string | null;
    rank: number;
    titles: number[]; // index 0 = titres D1, 1 = D2, …
    cups: { ldc: number; uefa: number; conference: number };
    titres: number; // total titres de division
    coupes: number; // total coupes
    total: number; // titres + coupes
    seasonsPlayed: number;
}
export interface FunStats {
    scapeGoat: RankRow[];
    rotaldo: RankRow[];
    raisingStar: RankRow[];
    titleStreak: RankRow[];
    jeanClaudeDuss: RankRow[];
    d1Seasons: RankRow[];
    d1Streak: RankRow[];
    podiums: RankRow[];
    worstDefense: RankRow[];
    bestAttack: RankRow[];
    mostPoints: RankRow[];
}
