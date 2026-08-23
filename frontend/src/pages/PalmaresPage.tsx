import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api/client";
import { CupCompetitionCard } from "@/components/business/palmares/CupCompetitionCard";
import { PalmaresRankingCard } from "@/components/business/palmares/PalmaresRankingCard";
import { SeasonChampionsView } from "@/components/business/palmares/SeasonChampionsView";
import type { CupCount, CupRow, DivisionWinner } from "@/components/business/palmares/types";
import { Empty } from "@/components/ui/Empty";
import { PillTabs } from "@/components/ui/PillTabs";

type Tab = "coupes" | "saisons";

export default function PalmaresPage() {
    const winners = useQuery({
        queryKey: ["winners"],
        queryFn: () => api<{ divisionWinners: DivisionWinner[] }>("/api/palmares/winners"),
    });
    const cups = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ list: CupRow[]; ranking: CupCount[] }>("/api/palmares/tournaments"),
    });

    const [tab, setTab] = useState<Tab>("coupes");
    const allWinners = winners.data?.divisionWinners ?? [];
    const list = cups.data?.list ?? [];
    const ranking = cups.data?.ranking ?? [];

    return (
        <div className="space-y-6">
            {/* En-tête : titre (mobile) + sous-titre + onglets */}
            <header className="space-y-3.5">
                <div>
                    <h1 className="font-display text-[34px] font-black uppercase leading-[0.95] tracking-[-1.2px] text-white lg:hidden">
                        Palmarès
                    </h1>
                    <p className="mt-1.5 text-xs text-texte-2 lg:text-sm">
                        Le mur des trophées de la ligue depuis 2023.
                    </p>
                </div>
                <PillTabs
                    value={tab}
                    onChange={setTab}
                    items={[
                        { key: "coupes", label: "🏆 Coupes" },
                        { key: "saisons", label: "📅 Ligues" },
                    ]}
                />
            </header>

            {tab === "coupes" ? (
                <div className="space-y-4 lg:space-y-6">
                    {ranking.length > 0 && <PalmaresRankingCard rows={ranking} />}
                    <div className="grid gap-3.5 lg:gap-5 lg:grid-cols-3">
                        <CupCompetitionCard
                            competition="LDC"
                            title="Ligue des Crampons"
                            rows={list.filter((c) => c.competition === "LDC")}
                        />
                        <CupCompetitionCard
                            competition="UEFA"
                            title="Heureux papa's League"
                            rows={list.filter((c) => c.competition === "UEFA")}
                        />
                        <CupCompetitionCard
                            competition="CONFERENCE"
                            title="Heureux papa's Conférence"
                            rows={list.filter((c) => c.competition === "CONFERENCE")}
                        />
                    </div>
                </div>
            ) : allWinners.length ? (
                <SeasonChampionsView winners={allWinners} />
            ) : (
                <Empty />
            )}
        </div>
    );
}
