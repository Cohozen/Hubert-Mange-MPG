export interface TimelineSeason {
    realSeason: string;
    gameSeason: string;
    year: number;
    mpgSeason: number | null;
    division: string;
    level: number;
    finalRank: number | null;
    points: number | null;
    played: number | null;
    won: number | null;
    drawn: number | null;
    lost: number | null;
    goalsFor: number | null;
    goalsAgainst: number | null;
}
