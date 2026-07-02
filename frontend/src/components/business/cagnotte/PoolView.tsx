import { api } from "@/api/client";
import { BuyInEditor } from "@/components/business/cagnotte/BuyInEditor";
import { CagnotteRecapCard } from "@/components/business/cagnotte/CagnotteRecapCard";
import { ContributionsPanel } from "@/components/business/cagnotte/ContributionsPanel";
import { PayoutsPanel } from "@/components/business/cagnotte/PayoutsPanel";
import { RulesEditor } from "@/components/business/cagnotte/RulesEditor";
import type { PoolDetail } from "@/components/business/cagnotte/types";
import { Button } from "@/components/ui/button";

export function PoolView({ pool, editor, onChange }: { pool: PoolDetail; editor: boolean; onChange: () => void }) {
    const canEdit = editor && !pool.closed;

    async function setClosed(closed: boolean) {
        await api(`/api/cagnotte/${pool.id}/closed`, {
            method: "PUT",
            body: JSON.stringify({ closed }),
        });
        onChange();
    }

    return (
        <div className="space-y-6">
            {pool.closed && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-jaune/30 bg-jaune/10 px-4 py-2 text-sm text-jaune">
                    <span>🔒 Cagnotte clôturée — consultation seule.</span>
                    {editor && (
                        <Button onClick={() => setClosed(false)} variant="soft" size="sm">
                            Rouvrir
                        </Button>
                    )}
                </div>
            )}

            <CagnotteRecapCard pool={pool} />

            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <ContributionsPanel pool={pool} canEdit={canEdit} onChange={onChange} />
                <PayoutsPanel pool={pool} canEdit={canEdit} onChange={onChange} />
            </div>

            {canEdit && (
                <div className="space-y-6">
                    <BuyInEditor pool={pool} onChange={onChange} />
                    <RulesEditor poolId={pool.id} onChange={onChange} />
                </div>
            )}

            {canEdit && (
                <div className="flex justify-end">
                    <Button onClick={() => setClosed(true)} variant="soft" size="sm">
                        🔒 Clôturer la cagnotte
                    </Button>
                </div>
            )}
        </div>
    );
}
