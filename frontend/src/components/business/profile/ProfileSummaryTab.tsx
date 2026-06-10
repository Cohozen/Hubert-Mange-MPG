import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { MiniStat } from "@/components/business/stats/MiniStat";
import { DuelCard } from "@/components/business/stats/DuelCard";
import { BigMatchCard } from "@/components/business/stats/BigMatchCard";
import { H2H } from "@/components/business/stats/types";

export function ProfileSummaryTab({ managerId }: { managerId: string }) {
    const { data: h } = useQuery({
        queryKey: ["h2h", managerId],
        queryFn: () => api<H2H>(`/api/palmares/h2h/${managerId}`),
    });

    if (!h) return null;

    if (h.overall.played === 0) {
        return (
            <div className="card bg-base-100 shadow">
                <div className="card-body text-sm opacity-60">Pas encore de match enregistré.</div>
            </div>
        );
    }

    return (
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
