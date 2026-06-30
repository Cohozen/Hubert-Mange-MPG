import { InterSeasonCard } from "./InterSeasonCard";
import { LastMatchCard } from "./LastMatchCard";
import type { SeasonPhase } from "./mockData";
import { SummerBreakCard } from "./SummerBreakCard";

/** Bloc dépendant de la phase de saison (dernière journée / inter-saison / trêve). */
export function PhaseSlot({ phase }: { phase: SeasonPhase }) {
    if (phase === "inter") return <InterSeasonCard />;
    if (phase === "estivale") return <SummerBreakCard />;
    return <LastMatchCard />;
}
