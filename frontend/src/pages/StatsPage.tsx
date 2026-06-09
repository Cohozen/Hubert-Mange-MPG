import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { ManagerLabel } from "../components/Manager";
import { useAuth } from "../auth/useAuth";

interface OppRow {
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
interface BigMatch {
  score: string;
  opponent: string;
  opponentId: string;
  username: string | null;
  avatarUrl: string | null;
  context: string;
}
interface H2H {
  overall: { played: number; w: number; d: number; l: number; gf: number; ga: number };
  opponents: OppRow[];
  beteNoire: OppRow | null;
  victimePreferee: OppRow | null;
  biggestWin: BigMatch | null;
  biggestLoss: BigMatch | null;
}

interface AllTimeRow {
  managerId: string;
  manager: string;
  username: string | null;
  avatarUrl: string | null;
  seasonsPlayed: number;
  titles: number[]; // index 0 = titres D1, 1 = D2, ...
  totalTitles: number;
  rank: number;
}
interface RankRow {
  managerId: string;
  manager: string;
  username: string | null;
  avatarUrl: string | null;
  value: number;
}
interface FunStats {
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
interface Movement {
  managerId: string;
  manager: string;
  username: string | null;
  avatarUrl: string | null;
  count: number;
}

// Médaille pour le top 3 (uniquement si le manager a au moins un titre), sinon le rang.
const rankLabel = (rank: number, hasTitles: boolean) =>
  hasTitles && rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `${rank}.`;

export default function StatsPage() {
  const allTime = useQuery({
    queryKey: ["all-time"],
    queryFn: () => api<{ ranking: AllTimeRow[]; maxLevel: number }>("/api/palmares/all-time"),
  });
  const fun = useQuery({
    queryKey: ["fun-stats"],
    queryFn: () => api<FunStats>("/api/palmares/fun-stats"),
  });
  const movements = useQuery({
    queryKey: ["movements"],
    queryFn: () =>
      api<{ promotions: Movement[]; relegations: Movement[]; yoyo: Movement[] }>("/api/palmares/movements"),
  });

  const moveRows = (m?: Movement[]): RankRow[] =>
    (m ?? []).map((x) => ({
      managerId: x.managerId,
      manager: x.manager,
      username: x.username,
      avatarUrl: x.avatarUrl,
      value: x.count,
    }));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-1">Classement all-time</h2>
        <p className="text-xs opacity-60 mb-3">
          Façon Jeux Olympiques : on compte les titres (1re place) par division. On départage
          d'abord sur les titres de D1, puis de D2, et ainsi de suite.
        </p>
        {allTime.data?.ranking.length ? (
          <>
            <div className="sm:hidden space-y-2">
              {allTime.data.ranking.map((r) => (
                <div key={r.managerId} className="card bg-base-100 shadow">
                  <div className="card-body p-3 flex-row items-center gap-3">
                    <div className="text-lg w-8 text-center">{rankLabel(r.rank, r.totalTitles > 0)}</div>
                    <div className="flex-1 min-w-0">
                      <ManagerLabel name={r.manager} username={r.username} avatarUrl={r.avatarUrl} size={26} />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.titles.map((c, lvl) =>
                          c > 0 ? (
                            <span
                              key={lvl}
                              className={`badge badge-sm ${lvl === 0 ? "badge-primary" : "badge-ghost"}`}
                            >
                              D{lvl + 1} ×{c}
                            </span>
                          ) : null
                        )}
                        {r.totalTitles === 0 && (
                          <span className="badge badge-sm badge-ghost opacity-60">aucun titre</span>
                        )}
                        <span className="badge badge-sm badge-ghost">{r.seasonsPlayed} saisons</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{r.totalTitles}</div>
                      <div className="text-[10px] opacity-60">titres</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block card bg-base-100 shadow overflow-x-auto">
              <table className="table table-md">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Manager</th>
                    {Array.from({ length: allTime.data.maxLevel }, (_, lvl) => (
                      <th key={lvl} className="text-center">
                        {lvl === 0 ? "🥇 D1" : `D${lvl + 1}`}
                      </th>
                    ))}
                    <th className="text-center">Total</th>
                    <th className="text-center">Saisons</th>
                  </tr>
                </thead>
                <tbody>
                  {allTime.data.ranking.map((r) => (
                    <tr key={r.managerId}>
                      <td>{rankLabel(r.rank, r.totalTitles > 0)}</td>
                      <td>
                        <ManagerLabel name={r.manager} username={r.username} avatarUrl={r.avatarUrl} size={26} />
                      </td>
                      {r.titles.map((c, lvl) => (
                        <td key={lvl} className={`text-center ${c > 0 ? "font-semibold" : "opacity-30"}`}>
                          {c || "—"}
                        </td>
                      ))}
                      <td className="text-center font-bold text-primary">{r.totalTitles}</td>
                      <td className="text-center">{r.seasonsPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="card bg-base-100 shadow">
            <div className="card-body text-sm opacity-60">Pas encore de données.</div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Stats fun</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <RankCard title="🐐 Bouc émissaire" subtitle="le plus de malus subis" rows={fun.data?.scapeGoat} unit=" malus" accent="text-warning" />
          <RankCard title="🥅 La passoire" subtitle="le plus de buts encaissés" rows={fun.data?.worstDefense} unit=" BC" accent="text-error" />
          <RankCard title="⚽ Meilleure attaque" subtitle="le plus de buts marqués" rows={fun.data?.bestAttack} unit=" BP" accent="text-success" />
          <RankCard title="🎯 Machine à points" subtitle="le plus de points cumulés" rows={fun.data?.mostPoints} unit=" pts" accent="text-primary" />
          <RankCard title="🏅 Rotaldo d'Or" subtitle="a possédé le meilleur joueur" rows={fun.data?.rotaldo} unit="×" accent="text-primary" />
          <RankCard title="🌟 La révélation" subtitle="a possédé la plus grosse hausse de cote" rows={fun.data?.raisingStar} unit="×" accent="text-primary" />
          <RankCard title="🏆 Roi des podiums" subtitle="le plus de podiums (top 3)" rows={fun.data?.podiums} unit="" accent="text-warning" />
          <RankCard title="🔥 Série de titres" subtitle="titres consécutifs" rows={fun.data?.titleStreak} unit="" accent="text-primary" />
          <RankCard title="🍸 Le Jean-Claude Duss" subtitle="le plus de 2es places (du mal à conclure)" rows={fun.data?.jeanClaudeDuss} unit="×" accent="text-secondary" />
          <RankCard title="🏛️ Pilier de l'élite" subtitle="le plus de saisons en D1" rows={fun.data?.d1Seasons} unit="" accent="text-primary" />
          <RankCard title="🔒 Indéboulonnable" subtitle="saisons consécutives en D1" rows={fun.data?.d1Streak} unit="" accent="text-primary" />
          <RankCard title="📈 Montées" subtitle="le plus de promotions" rows={moveRows(movements.data?.promotions)} unit="" accent="text-success" />
          <RankCard title="📉 Descentes" subtitle="le plus de relégations" rows={moveRows(movements.data?.relegations)} unit="" accent="text-error" />
          <RankCard title="🎢 Yo-yo" subtitle="le plus de montées + descentes" rows={moveRows(movements.data?.yoyo)} unit="" accent="text-secondary" />
        </div>
      </section>

      <MyStats />
    </div>
  );
}

function MyStats() {
  const { data: me } = useAuth();
  const { data: h } = useQuery({
    queryKey: ["h2h", me?.id],
    queryFn: () => api<H2H>(`/api/palmares/h2h/${me!.id}`),
    enabled: !!me?.id,
  });

  if (!h) return null;

  return (
    <section>
      <h2 className="text-xl font-bold mb-1">Mes stats</h2>
      <p className="text-xs opacity-60 mb-3">Tes confrontations directes (head-to-head).</p>

      {h.overall.played === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-sm opacity-60">Pas encore de match enregistré.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bilan global */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <MiniStat label="Matchs" value={h.overall.played} />
            <MiniStat label="Victoires" value={h.overall.w} accent="text-success" />
            <MiniStat label="Nuls" value={h.overall.d} />
            <MiniStat label="Défaites" value={h.overall.l} accent="text-error" />
            <MiniStat label="Buts pour" value={h.overall.gf} />
            <MiniStat label="Buts contre" value={h.overall.ga} />
          </div>

          {/* Cartes fun perso */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DuelCard title="🐉 Bête noire" subtitle="te bat le plus" opp={h.beteNoire} />
            <DuelCard title="🎯 Victime préférée" subtitle="tu la bats le plus" opp={h.victimePreferee} />
            <BigMatchCard title="💥 Plus large victoire" m={h.biggestWin} />
            <BigMatchCard title="🩹 Plus large défaite" m={h.biggestLoss} />
          </div>

          {/* Tous les adversaires (repliable) */}
          <div className="collapse collapse-arrow bg-base-100 rounded-box shadow">
            <input type="checkbox" />
            <div className="collapse-title font-semibold bg-base-200 min-h-0 py-3">
              Tous mes adversaires ({h.opponents.length})
            </div>
            <div className="collapse-content !p-0">
              <ul className="divide-y divide-base-200">
                {h.opponents.map((o) => (
                  <li key={o.opponentId} className="flex items-center gap-2 p-3 text-sm">
                    <span className="flex-1 min-w-0">
                      <ManagerLabel name={o.manager} username={o.username} avatarUrl={o.avatarUrl} size={24} />
                    </span>
                    <span className="shrink-0 tabular-nums">
                      <span className="text-success">{o.w}</span>
                      <span className="opacity-40">–</span>
                      <span>{o.d}</span>
                      <span className="opacity-40">–</span>
                      <span className="text-error">{o.l}</span>
                    </span>
                    <span className="shrink-0 opacity-50 text-xs w-16 text-right">
                      {o.gf}:{o.ga}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-base-100 rounded-box shadow p-3 text-center">
      <div className={`text-lg font-bold ${accent ?? "text-base-content"}`}>{value}</div>
      <div className="text-[11px] opacity-60">{label}</div>
    </div>
  );
}

function DuelCard({ title, subtitle, opp }: { title: string; subtitle: string; opp: OppRow | null }) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs opacity-60 -mt-1 mb-1">{subtitle}</p>
        {opp ? (
          <div className="space-y-1">
            <ManagerLabel name={opp.manager} username={opp.username} avatarUrl={opp.avatarUrl} size={24} />
            <div className="text-sm">
              <span className="text-success font-bold">{opp.w}V</span>{" "}
              <span className="opacity-70">{opp.d}N</span>{" "}
              <span className="text-error font-bold">{opp.l}D</span>
            </div>
          </div>
        ) : (
          <p className="text-sm opacity-60">Pas assez de matchs.</p>
        )}
      </div>
    </div>
  );
}

function BigMatchCard({ title, m }: { title: string; m: BigMatch | null }) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4">
        <h3 className="font-semibold mb-1">{title}</h3>
        {m ? (
          <div className="space-y-1">
            <div className="text-2xl font-bold">{m.score}</div>
            <ManagerLabel name={m.opponent} username={m.username} avatarUrl={m.avatarUrl} size={24} />
            <div className="text-xs opacity-60">{m.context}</div>
          </div>
        ) : (
          <p className="text-sm opacity-60">—</p>
        )}
      </div>
    </div>
  );
}

function RankCard({
  title,
  subtitle,
  rows,
  unit,
  accent,
}: {
  title: string;
  subtitle: string;
  rows?: RankRow[];
  unit: string;
  accent: string;
}) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs opacity-60 -mt-1 mb-1">{subtitle}</p>
        {rows?.length ? (
          <ul className="space-y-1.5">
            {rows.slice(0, 6).map((r, i) => (
              <li key={r.managerId} className="flex items-center justify-between gap-2 text-sm">
                <span className={`flex items-center gap-1 min-w-0 ${i === 0 ? "font-semibold" : ""}`}>
                  {i === 0 && <span>👑</span>}
                  <ManagerLabel name={r.manager} username={r.username} avatarUrl={r.avatarUrl} size={20} />
                </span>
                <span className={`font-bold shrink-0 ${accent}`}>
                  {r.value}
                  {unit}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-60">Pas encore de données.</p>
        )}
      </div>
    </div>
  );
}
