import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { CupRow, DivisionWinner } from "@/components/business/palmares/types";
import { Empty } from "@/components/ui/Empty";

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
        return <Empty>Aucun trophée pour l'instant. 🥲</Empty>;
    }

    return (
        <div className="space-y-6">
            <section>
                <h3 className="mb-2 font-display text-sm font-black uppercase tracking-wide text-white">
                    🏆 Championnats ({titles.length})
                </h3>
                {titles.length ? (
                    <ul className="divide-y divide-bord overflow-hidden rounded-2xl border border-bord bg-carte">
                        {titles.map((t, i) => (
                            <li key={i} className="flex items-center gap-3 p-3">
                                <span className="text-2xl">{t.level === 1 ? "🥇" : "🏆"}</span>
                                <span className="flex-1 font-medium text-white">{t.division}</span>
                                <span className="text-right text-xs text-texte-2">{t.season}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-texte-2">Aucun titre de division.</p>
                )}
            </section>

            <section>
                <h3 className="mb-2 font-display text-sm font-black uppercase tracking-wide text-white">
                    Coupes ({cupWins.length})
                </h3>
                {cupWins.length ? (
                    <ul className="divide-y divide-bord overflow-hidden rounded-2xl border border-bord bg-carte">
                        {cupWins.map((c) => (
                            <li key={c.id} className="flex items-center gap-3 p-3">
                                <span className="text-2xl">{CUP_ICON[c.competition] ?? "🏆"}</span>
                                <span className="min-w-0 flex-1 truncate font-medium text-white">{c.name}</span>
                                <span className="text-xs text-texte-2">{c.year}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-texte-2">Aucune coupe.</p>
                )}
            </section>
        </div>
    );
}
