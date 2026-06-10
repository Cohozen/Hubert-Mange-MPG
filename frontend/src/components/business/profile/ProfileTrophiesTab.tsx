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
                <h3 className="font-semibold mb-2">🏆 Championnat ({titles.length})</h3>
                {titles.length ? (
                    <ul className="list bg-base-100 rounded-box shadow">
                        {titles.map((t, i) => (
                            <li key={i} className="list-row items-center">
                                <span className="text-2xl">{t.level === 1 ? "🥇" : "🏆"}</span>
                                <span className="list-col-grow font-medium">{t.division}</span>
                                <span className="text-xs opacity-60 text-right">{t.season}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm opacity-50">Aucun titre de division.</p>
                )}
            </section>

            <section>
                <h3 className="font-semibold mb-2">Coupes ({cupWins.length})</h3>
                {cupWins.length ? (
                    <ul className="list bg-base-100 rounded-box shadow">
                        {cupWins.map((c) => (
                            <li key={c.id} className="list-row items-center">
                                <span className="text-2xl">{CUP_ICON[c.competition] ?? "🏆"}</span>
                                <span className="list-col-grow min-w-0 font-medium truncate">{c.name}</span>
                                <span className="text-xs opacity-60">{c.year}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm opacity-50">Aucune coupe.</p>
                )}
            </section>
        </div>
    );
}
