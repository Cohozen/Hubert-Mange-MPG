import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { WinRateDonut } from "@/components/business/profile/WinRateDonut";
import { BigMatchCard } from "@/components/business/stats/BigMatchCard";
import { DuelCard } from "@/components/business/stats/DuelCard";
import { MiniStat } from "@/components/business/stats/MiniStat";
import type { H2H } from "@/components/business/stats/types";
import { Empty } from "@/components/ui/Empty";

export function ProfileSummaryTab({ managerId }: { managerId: string }) {
    const { data: h } = useQuery({
        queryKey: ["h2h", managerId],
        queryFn: () => api<H2H>(`/api/palmares/h2h/${managerId}`),
    });

    if (!h) return null;

    if (h.overall.played === 0) {
        return <Empty>Pas encore de match enregistré.</Empty>;
    }

    return (
        <div className="space-y-4">
            {/* Bilan global : donut V/N/D + chiffres */}
            <div className="grid sm:grid-cols-2 gap-4 items-center">
                <WinRateDonut w={h.overall.w} d={h.overall.d} l={h.overall.l} />
                <div className="grid grid-cols-2 gap-3">
                    <MiniStat label="Matchs" value={h.overall.played} />
                    <MiniStat label="Victoires" value={h.overall.w} accent="text-menthe" />
                    <MiniStat label="Nuls" value={h.overall.d} />
                    <MiniStat label="Défaites" value={h.overall.l} accent="text-rouge" />
                </div>
            </div>

            {/* Cartes fun */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DuelCard title="🐉 Bête noire" opp={h.beteNoire} />
                <DuelCard title="🎯 Victime préférée" opp={h.victimePreferee} />
                <BigMatchCard title="💥 Plus large victoire" m={h.biggestWin} />
                <BigMatchCard title="🩹 Plus large défaite" m={h.biggestLoss} />
            </div>
        </div>
    );
}
