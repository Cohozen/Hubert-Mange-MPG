import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { CupRow, DivisionWinner } from "@/components/business/palmares/types";

const CUP_ICON: Record<string, string> = { LDC: "⭐", UEFA: "🎖️", CONFERENCE: "🍐" };

export function ProfileTrophiesTab({ managerId }: { managerId: string }) {
    const winners = useQuery({
        queryKey: ["winners"],
        queryFn: () => api<{ divisionWinners: DivisionWinner[] }>("/api/palmares/winners"),
    });
    const cups = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ list: CupRow[] }>("/api/palmares/tournaments"),
    });

    if (winners.isLoading || cups.isLoading) return null;

    const titles = (winners.data?.divisionWinners ?? []).filter((w) => w.managerId === managerId);
    const cupWins = (cups.data?.list ?? []).filter((c) => c.winnerManagerId === managerId);

    if (titles.length === 0 && cupWins.length === 0) {
        return (
            <div className="card bg-base-100 shadow">
                <div className="card-body text-sm opacity-60">Aucun trophée pour l'instant. 🥲</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section>
                <h3 className="font-semibold mb-2">🏆 Titres de division ({titles.length})</h3>
                {titles.length ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                        {titles.map((t, i) => (
                            <div key={i} className="card bg-base-100 shadow">
                                <div className="card-body p-3 flex-row items-center justify-between gap-2">
                                    <span className="font-medium">{t.division}</span>
                                    <span className="text-xs opacity-60 text-right">{t.season}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm opacity-50">Aucun titre de division.</p>
                )}
            </section>

            <section>
                <h3 className="font-semibold mb-2">Coupes ({cupWins.length})</h3>
                {cupWins.length ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                        {cupWins.map((c) => (
                            <div key={c.id} className="card bg-base-100 shadow">
                                <div className="card-body p-3 flex-row items-center gap-3">
                                    <span className="text-2xl">{CUP_ICON[c.competition] ?? "🏆"}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="font-medium block truncate">{c.name}</span>
                                        <span className="text-xs opacity-60">{c.year}</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm opacity-50">Aucune coupe.</p>
                )}
            </section>
        </div>
    );
}
