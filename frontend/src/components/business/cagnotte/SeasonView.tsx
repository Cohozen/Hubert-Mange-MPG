import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { CreatePool } from "@/components/business/cagnotte/CreatePool";
import { PoolView } from "@/components/business/cagnotte/PoolView";
import type { PoolDetail, SeasonRow } from "@/components/business/cagnotte/types";
import { Empty } from "@/components/ui/Empty";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loader } from "@/components/ui/Loader";

export function SeasonView({ season, editor }: { season: SeasonRow; editor: boolean }) {
    const qc = useQueryClient();
    const detail = useQuery({
        queryKey: ["pool", season.poolId],
        queryFn: () => api<PoolDetail>(`/api/cagnotte/${season.poolId}`),
        enabled: !!season.poolId,
    });

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ["cagnotte-seasons"] });
        if (season.poolId) qc.invalidateQueries({ queryKey: ["pool", season.poolId] });
    };

    if (!season.poolId) {
        if (!editor) {
            return <Empty>Pas encore de cagnotte pour cette saison.</Empty>;
        }
        return <CreatePool season={season} onCreated={refresh} />;
    }

    if (detail.isError || detail.isPaused) {
        return <ErrorState onRetry={() => detail.refetch()}>Impossible de charger cette cagnotte.</ErrorState>;
    }
    if (!detail.data) return <Loader />;
    return <PoolView pool={detail.data} editor={editor} onChange={refresh} />;
}
