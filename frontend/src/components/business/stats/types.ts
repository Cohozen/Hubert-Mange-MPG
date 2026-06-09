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
export interface H2H {
  overall: { played: number; w: number; d: number; l: number; gf: number; ga: number };
  opponents: OppRow[];
  beteNoire: OppRow | null;
  victimePreferee: OppRow | null;
  biggestWin: BigMatch | null;
  biggestLoss: BigMatch | null;
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
export interface Movement {
  managerId: string;
  manager: string;
  username: string | null;
  avatarUrl: string | null;
  count: number;
}
