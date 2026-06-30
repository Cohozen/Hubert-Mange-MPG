import { useAuth } from "@/auth/useAuth";
import { CagnotteEstimateCard } from "@/components/business/accueil/CagnotteEstimateCard";
import { MercatoCard } from "@/components/business/accueil/MercatoCard";
import { accueilMock, PHASE } from "@/components/business/accueil/mockData";
import { PalmaresSummaryCard } from "@/components/business/accueil/PalmaresSummaryCard";
import { PhaseSlot } from "@/components/business/accueil/PhaseSlot";
import { SeasonHeroCard } from "@/components/business/accueil/SeasonHeroCard";

/**
 * Dashboard « Accueil ».
 * NB : les chiffres affichés sont factices (voir accueil/mockData.ts) — seuls le
 * prénom et l'identité viennent de l'auth. À brancher sur de vrais endpoints plus tard.
 */
export default function AccueilPage() {
    const { data: me } = useAuth();
    const first = me?.displayName?.split(" ")[0] ?? "";
    const phase = PHASE;

    return (
        <div className="space-y-4">
            {/* Salutation + contexte */}
            <div>
                <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white lg:text-4xl">
                    Salut {first} 👋
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-3 py-1 font-display text-[10px] font-black uppercase tracking-wider text-white grad-banner">
                        {accueilMock.division}
                    </span>
                    <span className="text-xs text-texte-2">{accueilMock.context[phase]}</span>
                </div>
            </div>

            {/* Ligne du haut : rang + mercato + cagnotte */}
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
                <SeasonHeroCard />
                <MercatoCard />
                <CagnotteEstimateCard />
            </div>

            {/* Ligne du bas : phase de saison + palmarès */}
            <div className="grid items-start gap-4 lg:grid-cols-[1.3fr_1fr]">
                <PhaseSlot phase={phase} />
                <PalmaresSummaryCard />
            </div>
        </div>
    );
}
