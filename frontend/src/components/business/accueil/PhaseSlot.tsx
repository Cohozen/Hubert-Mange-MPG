import type { Dashboard } from "@/components/business/accueil/types";
import { InterSeasonCard } from "./InterSeasonCard";
import { LastMatchCard } from "./LastMatchCard";
import { SummerBreakCard } from "./SummerBreakCard";

/** Bloc dépendant de la phase de saison (dernière journée / inter-saison / trêve). */
export function PhaseSlot({
    data,
    me,
    meId,
    meUsername,
}: {
    data: Dashboard;
    me: string;
    meId: string;
    meUsername: string | null;
}) {
    if (data.phase === "inter") return <InterSeasonCard season={data.season} rank={data.rank} />;
    if (data.phase === "estivale") return <SummerBreakCard season={data.season} />;
    return (
        <LastMatchCard
            last={data.last}
            live={data.live}
            form={data.form}
            next={data.next}
            me={me}
            meId={meId}
            meUsername={meUsername}
        />
    );
}
