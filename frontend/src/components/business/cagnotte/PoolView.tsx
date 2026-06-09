import { api, formatMoney } from "@/api/client";
import { Stat } from "@/components/business/cagnotte/Stat";
import { BuyInEditor } from "@/components/business/cagnotte/BuyInEditor";
import { ContributionsPanel } from "@/components/business/cagnotte/ContributionsPanel";
import { RulesEditor } from "@/components/business/cagnotte/RulesEditor";
import { PayoutsPanel } from "@/components/business/cagnotte/PayoutsPanel";
import { PoolDetail } from "@/components/business/cagnotte/types";

export function PoolView({
  pool,
  editor,
  onChange,
}: {
  pool: PoolDetail;
  editor: boolean;
  onChange: () => void;
}) {
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
        <div className="flex items-center justify-between gap-2 text-sm bg-warning/20 text-warning border border-warning/30 rounded-lg px-4 py-2">
          <span>🔒 Cagnotte clôturée — consultation seule.</span>
          {editor && (
            <button onClick={() => setClosed(false)} className="btn btn-xs">
              Rouvrir
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Mise / joueur" value={formatMoney(pool.buyInAmount)} />
        <Stat
          label="Collecté"
          value={formatMoney(pool.totalCollected)}
          sub={`/ ${formatMoney(pool.totalExpected)} attendu`}
        />
        <Stat label="Reversé" value={formatMoney(pool.totalPaidOut)} />
        <Stat label="Solde" value={formatMoney(pool.balance)} />
      </div>

      {canEdit && <BuyInEditor pool={pool} onChange={onChange} />}
      <ContributionsPanel pool={pool} canEdit={canEdit} onChange={onChange} />
      {canEdit && <RulesEditor poolId={pool.id} onChange={onChange} />}
      <PayoutsPanel pool={pool} canEdit={canEdit} onChange={onChange} />

      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => setClosed(true)} className="btn btn-sm btn-outline btn-warning">
            🔒 Clôturer la cagnotte
          </button>
        </div>
      )}
    </div>
  );
}
