import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { MiniStat } from "@/components/business/stats/MiniStat";
import { DuelCard } from "@/components/business/stats/DuelCard";
import { BigMatchCard } from "@/components/business/stats/BigMatchCard";
import { H2H } from "@/components/business/stats/types";

export function MyStats() {
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
                                            <ManagerLabel
                                                name={o.manager}
                                                username={o.username}
                                                avatarUrl={o.avatarUrl}
                                                size={24}
                                            />
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
