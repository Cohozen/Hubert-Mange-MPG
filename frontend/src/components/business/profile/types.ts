export interface TimelineSeason {
    realSeason: string;
    gameSeason: string;
    year: number;
    mpgSeason: number | null;
    status: string; // active | finished — une saison en cours n'a pas encore de vainqueur
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
