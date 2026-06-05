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
  score: number;
  divisionTitles: number;
  eliteTitles: number;
  podiums: number;
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

const medal = (i: number) => ["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`;

export default function StatsPage() {
  const allTime = useQuery({
    queryKey: ["all-time"],
    queryFn: () => api<{ ranking: AllTimeRow[] }>("/api/palmares/all-time"),
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
          Score pondéré : gagner une division supérieure rapporte plus (1er = 3× le poids de la division, 2e = 1×).
        </p>
        {allTime.data?.ranking.length ? (
          <>
            <div className="sm:hidden space-y-2">
              {allTime.data.ranking.map((r, i) => (
                <div key={r.managerId} className="card bg-base-100 shadow">
                  <div className="card-body p-3 flex-row items-center gap-3">
                    <div className="text-lg w-8 text-center">{medal(i)}</div>
                    <div className="flex-1 min-w-0">
                      <ManagerLabel name={r.manager} username={r.username} avatarUrl={r.avatarUrl} size={26} />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.eliteTitles > 0 && <span className="badge badge-sm badge-primary">🏆 {r.eliteTitles}</span>}
                        <span className="badge badge-sm badge-ghost">{r.divisionTitles} titres</span>
                        <span className="badge badge-sm badge-ghost">{r.podiums} podiums</span>
                        <span className="badge badge-sm badge-ghost">{r.seasonsPlayed} saisons</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{r.score}</div>
                      <div className="text-[10px] opacity-60">pts</div>
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
                    <th className="text-center">Score</th>
                    <th className="text-center">🏆 Élite</th>
                    <th className="text-center">Titres</th>
                    <th className="text-center">Podiums</th>
                    <th className="text-center">Saisons</th>
                  </tr>
                </thead>
                <tbody>
                  {allTime.data.ranking.map((r, i) => (
                    <tr key={r.managerId}>
                      <td>{medal(i)}</td>
                      <td>
                        <ManagerLabel name={r.manager} username={r.username} avatarUrl={r.avatarUrl} size={26} />
                      </td>
                      <td className="text-center font-bold text-primary">{r.score}</td>
                      <td className="text-center">{r.eliteTitles}</td>
                      <td className="text-center">{r.divisionTitles}</td>
                      <td className="text-center">{r.podiums}</td>
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
          <div>
            <div className="text-2xl font-bold">{m.score}</div>
            <div className="text-sm">vs {m.opponent}</div>
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
