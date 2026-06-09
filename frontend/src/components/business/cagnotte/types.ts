export interface SeasonRow {
  id: string;
  name: string;
  year: number;
  closed: boolean;
  poolId: string | null;
}
export interface Contribution {
  id: string;
  managerId: string;
  manager: string;
  username: string | null;
  avatarUrl: string | null;
  amount: number;
  paid: boolean;
}
export interface Payout {
  id: string;
  managerId: string;
  manager: string;
  username: string | null;
  avatarUrl: string | null;
  amount: number;
  reason: string;
  paid: boolean;
}
export interface PoolDetail {
  id: string;
  season: string;
  closed: boolean;
  buyInAmount: number;
  totalExpected: number;
  totalCollected: number;
  totalPaidOut: number;
  balance: number;
  contributions: Contribution[];
  payouts: Payout[];
}
