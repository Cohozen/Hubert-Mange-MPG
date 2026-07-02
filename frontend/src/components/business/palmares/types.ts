export interface DivisionWinner {
    season: string;
    realSeason: string;
    division: string;
    level: number;
    winner: string | null;
    username: string | null;
    avatarUrl: string | null;
    managerId: string | null;
    team: string | null;
    mpgUrl: string | null;
}
export interface CupRow {
    id: string;
    name: string;
    competition: string;
    year: number;
    winner: string | null;
    username: string | null;
    avatarUrl: string | null;
    winnerManagerId: string | null;
    mpgUrl: string | null;
}
export interface CupCount {
    managerId: string;
    manager: string;
    username: string | null;
    ldc: number;
    uefa: number;
    conference: number;
    total: number;
}
