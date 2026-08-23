import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { CagnotteEstimateCard } from "@/components/business/accueil/CagnotteEstimateCard";
import { MercatoCard } from "@/components/business/accueil/MercatoCard";
import { PalmaresSummaryCard } from "@/components/business/accueil/PalmaresSummaryCard";
import { PhaseSlot } from "@/components/business/accueil/PhaseSlot";
import { SeasonHeroCard } from "@/components/business/accueil/SeasonHeroCard";
import type { Dashboard } from "@/components/business/accueil/types";
import { Empty } from "@/components/ui/Empty";

/** Contexte affiché sous la salutation, selon la phase de vie de la ligue. */
function contextLabel(d: Dashboard): string {
    if (!d.season) return "En attente de la première saison";
    const { realSeason, gameSeason, currentGameWeek } = d.season;
    if (d.phase === "enCours") {
        return `Saison ${realSeason} · ${gameSeason}${currentGameWeek ? ` · Journée ${currentGameWeek}` : ""}`;
    }
    if (d.phase === "inter") return `${gameSeason} terminée · la suivante arrive`;
    return `Trêve estivale · ${realSeason} en préparation`;
}

/** Dashboard « Accueil » : la saison en cours du manager connecté. */
export default function AccueilPage() {
    const { data: me } = useAuth();
    const { data, isLoading } = useQuery({
        queryKey: ["dashboard"],
        queryFn: () => api<Dashboard>("/api/dashboard"),
    });

    const first = me?.displayName?.split(" ")[0] ?? "";
    if (isLoading || !data || !me) return null;
    if (!data.season) return <Empty>Aucune saison synchronisée pour le moment.</Empty>;

    return (
        <div className="space-y-4">
            {/* Salutation + contexte */}
            <div>
                <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white lg:text-4xl">
                    Salut {first} 👋
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-3 py-1 font-display text-[10px] font-black uppercase tracking-wider text-white grad-banner">
                        {data.season.division ?? "—"}
                    </span>
                    <span className="text-xs text-texte-2">{contextLabel(data)}</span>
                </div>
            </div>

            {/* Ligne du haut : rang + mercato + cagnotte */}
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
                <SeasonHeroCard
                    season={data.season}
                    rank={data.rank}
                    next={data.next}
                    live={data.phase === "enCours"}
                />
                <MercatoCard mercato={data.mercato} />
                <CagnotteEstimateCard cagnotte={data.cagnotte} />
            </div>

            {/* Ligne du bas : phase de saison + palmarès */}
            <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
                <PhaseSlot data={data} me={me.displayName} meId={me.id} />
                <PalmaresSummaryCard palmares={data.palmares} />
            </div>
        </div>
    );
}
