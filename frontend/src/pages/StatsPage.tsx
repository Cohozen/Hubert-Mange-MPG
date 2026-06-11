import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { RankCard } from "@/components/business/stats/RankCard";
import { AllTimeRow, CupCount, FunStats, Movement, RankRow } from "@/components/business/stats/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

// Médaille pour le top 3 (uniquement si le manager a au moins un titre), sinon le rang.
const rankLabel = (rank: number, hasTitles: boolean) =>
    hasTitles && rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `${rank}.`;

export default function StatsPage() {
    const { data: me } = useAuth();
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

    // Coupes par manager : comptées dans le total de titres affiché, mais hors calcul du classement.
    const cupsByManager = new Map((cups.data?.ranking ?? []).map((c) => [c.managerId, c]));
    // Total de titres affiché = titres de division + coupes (n'influe pas sur l'ordre, géré par `rank`).
    const totalWithCups = (r: AllTimeRow) => r.totalTitles + (cupsByManager.get(r.managerId)?.total ?? 0);

    return (
        <div className="space-y-8">
            <img
                src="/stats-banner.jpg"
                alt="Mega Ligue — Hubert mange"
                className="w-full rounded-lg shadow object-cover"
                loading="lazy"
            />
            <section>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="text-xl font-bold">Classement all-time</h2>
                    <div className="dropdown dropdown-end">
                        <div
                            tabIndex={0}
                            role="button"
                            className="btn btn-ghost btn-circle btn-xs"
                            aria-label="À propos du classement"
                        >
                            ℹ️
                        </div>
                        <div
                            tabIndex={-1}
                            className="dropdown-content card card-sm bg-base-100 shadow-lg z-10 w-72 sm:w-80"
                        >
                            <div className="card-body text-xs opacity-80">
                                Façon Jeux Olympiques : on compte les titres (1re place) par division. On départage
                                d'abord sur les titres de D1, puis de D2, et ainsi de suite. Les coupes (⭐ Crampons · 🎖️
                                Europa · 🍐 Conference) comptent dans le total de titres mais pas dans le classement.
                            </div>
                        </div>
                    </div>
                </div>
                {allTime.data?.ranking.length ? (
                    <>
                        <div className="sm:hidden space-y-2">
                            {allTime.data.ranking.map((r) => (
                                <div
                                    key={r.managerId}
                                    className={`card bg-base-100 shadow ${
                                        r.managerId === me?.id ? "border border-primary" : ""
                                    }`}
                                >
                                    <div className="card-body p-3 flex-row items-center gap-3">
                                        <div className={`w-8 text-center ${r.rank > 3 ? "text-lg" : "text-3xl"}`}>
                                            {rankLabel(r.rank, r.totalTitles > 0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <ManagerLabel
                                                managerId={r.managerId}
                                                name={r.manager}
                                                username={r.username}
                                                avatarUrl={r.avatarUrl}
                                                size={26}
                                            />
                                            <div className="flex flex-wrap gap-2 mt-1">
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
                                                                <span className="badge badge-sm badge-warning font-semibold">
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
                                                                    🍐 ×{c.conference}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : null;
                                                })()}
                                                <span className="badge badge-sm badge-secondary badge-outline">
                                                    {r.seasonsPlayed} saisons
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-lg font-bold text-primary">{totalWithCups(r)}</div>
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
                                            🍐
                                        </th>
                                        <th className="text-center">Saisons</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTime.data.ranking.map((r) => {
                                        const isMe = r.managerId === me?.id;
                                        return (
                                            <tr key={r.managerId} className={isMe ? "bg-primary/5" : ""}>
                                                <td className={isMe ? "border-l-4 border-l-primary" : ""}>
                                                    {rankLabel(r.rank, r.totalTitles > 0)}
                                                </td>
                                                <td>
                                                    <ManagerLabel
                                                        managerId={r.managerId}
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
                                                <td className="text-center font-bold text-primary">
                                                    {totalWithCups(r)}
                                                </td>
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
                                        );
                                    })}
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
        </div>
    );
}
