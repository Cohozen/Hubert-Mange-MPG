import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { RankCard } from "@/components/business/stats/RankCard";
import { MyStats } from "@/components/business/stats/MyStats";
import { AllTimeRow, CupCount, FunStats, Movement, RankRow } from "@/components/business/stats/types";

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
    const cups = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ ranking: CupCount[] }>("/api/palmares/tournaments"),
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

    // Coupes par manager (affichage indicatif, hors calcul du classement).
    const cupsByManager = new Map((cups.data?.ranking ?? []).map((c) => [c.managerId, c]));

    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-xl font-bold mb-1">Classement all-time</h2>
                <p className="text-xs opacity-60 mb-3">
                    Façon Jeux Olympiques : on compte les titres (1re place) par division. On départage d'abord sur les
                    titres de D1, puis de D2, et ainsi de suite. Les coupes (⭐ Crampons · 🎖️ Europa · 🏵️ Conference) sont
                    affichées à titre indicatif, hors calcul.
                </p>
                {allTime.data?.ranking.length ? (
                    <>
                        <div className="sm:hidden space-y-2">
                            {allTime.data.ranking.map((r) => (
                                <div key={r.managerId} className="card bg-base-100 shadow">
                                    <div className="card-body p-3 flex-row items-center gap-3">
                                        <div className="text-lg w-8 text-center">
                                            {rankLabel(r.rank, r.totalTitles > 0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <ManagerLabel
                                                name={r.manager}
                                                username={r.username}
                                                avatarUrl={r.avatarUrl}
                                                size={26}
                                            />
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {r.titles.map((c, lvl) =>
                                                    c > 0 ? (
                                                        <span
                                                            key={lvl}
                                                            className={`badge badge-sm ${lvl === 0 ? "badge-primary" : "badge-ghost"}`}
                                                        >
                                                            D{lvl + 1} ×{c}
                                                        </span>
                                                    ) : null,
                                                )}
                                                {r.totalTitles === 0 && (
                                                    <span className="badge badge-sm badge-ghost opacity-60">
                                                        aucun titre
                                                    </span>
                                                )}
                                                {(() => {
                                                    const c = cupsByManager.get(r.managerId);
                                                    return c ? (
                                                        <>
                                                            {c.ldc > 0 && (
                                                                <span className="badge badge-sm badge-ghost">
                                                                    ⭐ ×{c.ldc}
                                                                </span>
                                                            )}
                                                            {c.uefa > 0 && (
                                                                <span className="badge badge-sm badge-ghost">
                                                                    🎖️ ×{c.uefa}
                                                                </span>
                                                            )}
                                                            {c.conference > 0 && (
                                                                <span className="badge badge-sm badge-ghost">
                                                                    🏵️ ×{c.conference}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : null;
                                                })()}
                                                <span className="badge badge-sm badge-ghost">
                                                    {r.seasonsPlayed} saisons
                                                </span>
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
                                        <th className="text-center" title="Ligue des Crampons">
                                            ⭐
                                        </th>
                                        <th className="text-center" title="Europa (Heureux papa's)">
                                            🎖️
                                        </th>
                                        <th className="text-center" title="Conference">
                                            🏵️
                                        </th>
                                        <th className="text-center">Saisons</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTime.data.ranking.map((r) => (
                                        <tr key={r.managerId}>
                                            <td>{rankLabel(r.rank, r.totalTitles > 0)}</td>
                                            <td>
                                                <ManagerLabel
                                                    name={r.manager}
                                                    username={r.username}
                                                    avatarUrl={r.avatarUrl}
                                                    size={26}
                                                />
                                            </td>
                                            {r.titles.map((c, lvl) => (
                                                <td
                                                    key={lvl}
                                                    className={`text-center ${c > 0 ? "font-semibold" : "opacity-30"}`}
                                                >
                                                    {c || "—"}
                                                </td>
                                            ))}
                                            <td className="text-center font-bold text-primary">{r.totalTitles}</td>
                                            {(() => {
                                                const c = cupsByManager.get(r.managerId);
                                                const cell = (n: number) => (
                                                    <td
                                                        className={`text-center ${n > 0 ? "font-semibold" : "opacity-30"}`}
                                                    >
                                                        {n || "—"}
                                                    </td>
                                                );
                                                return (
                                                    <>
                                                        {cell(c?.ldc ?? 0)}
                                                        {cell(c?.uefa ?? 0)}
                                                        {cell(c?.conference ?? 0)}
                                                    </>
                                                );
                                            })()}
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
                    <RankCard
                        title="🐐 Bouc émissaire"
                        subtitle="le plus de malus subis"
                        rows={fun.data?.scapeGoat}
                        unit=" malus"
                        accent="text-warning"
                    />
                    <RankCard
                        title="🥅 La passoire"
                        subtitle="le plus de buts encaissés"
                        rows={fun.data?.worstDefense}
                        unit=" BC"
                        accent="text-error"
                    />
                    <RankCard
                        title="⚽ Meilleure attaque"
                        subtitle="le plus de buts marqués"
                        rows={fun.data?.bestAttack}
                        unit=" BP"
                        accent="text-success"
                    />
                    <RankCard
                        title="🎯 Machine à points"
                        subtitle="le plus de points cumulés"
                        rows={fun.data?.mostPoints}
                        unit=" pts"
                        accent="text-primary"
                    />
                    <RankCard
                        title="🏅 Rotaldo d'Or"
                        subtitle="a possédé le meilleur joueur"
                        rows={fun.data?.rotaldo}
                        unit="×"
                        accent="text-primary"
                    />
                    <RankCard
                        title="🌟 La révélation"
                        subtitle="a possédé la plus grosse hausse de cote"
                        rows={fun.data?.raisingStar}
                        unit="×"
                        accent="text-primary"
                    />
                    <RankCard
                        title="🏆 Roi des podiums"
                        subtitle="le plus de podiums (top 3)"
                        rows={fun.data?.podiums}
                        unit=""
                        accent="text-warning"
                    />
                    <RankCard
                        title="🔥 Série de titres"
                        subtitle="titres consécutifs"
                        rows={fun.data?.titleStreak}
                        unit=""
                        accent="text-primary"
                    />
                    <RankCard
                        title="🍸 Le Jean-Claude Duss"
                        subtitle="le plus de 2es places (du mal à conclure)"
                        rows={fun.data?.jeanClaudeDuss}
                        unit="×"
                        accent="text-secondary"
                    />
                    <RankCard
                        title="🏛️ Pilier de l'élite"
                        subtitle="le plus de saisons en D1"
                        rows={fun.data?.d1Seasons}
                        unit=""
                        accent="text-primary"
                    />
                    <RankCard
                        title="🔒 Indéboulonnable"
                        subtitle="saisons consécutives en D1"
                        rows={fun.data?.d1Streak}
                        unit=""
                        accent="text-primary"
                    />
                    <RankCard
                        title="📈 Montées"
                        subtitle="le plus de promotions"
                        rows={moveRows(movements.data?.promotions)}
                        unit=""
                        accent="text-success"
                    />
                    <RankCard
                        title="📉 Descentes"
                        subtitle="le plus de relégations"
                        rows={moveRows(movements.data?.relegations)}
                        unit=""
                        accent="text-error"
                    />
                    <RankCard
                        title="🎢 Yo-yo"
                        subtitle="le plus de montées + descentes"
                        rows={moveRows(movements.data?.yoyo)}
                        unit=""
                        accent="text-secondary"
                    />
                </div>
            </section>

            <MyStats />
        </div>
    );
}
