import { useState } from "react";
import { api, eurosToCents } from "@/api/client";
import { PoolDetail } from "@/components/business/cagnotte/types";

export function BuyInEditor({ pool, onChange }: { pool: PoolDetail; onChange: () => void }) {
  const [val, setVal] = useState(String(pool.buyInAmount / 100));
  const [busy, setBusy] = useState(false);
  const saved = eurosToCents(val) === pool.buyInAmount;
  const canInit = pool.buyInAmount > 0 && saved;

  async function saveMise() {
    setBusy(true);
    try {
      await api(`/api/cagnotte/${pool.id}`, {
        method: "PUT",
        body: JSON.stringify({ buyInAmount: eurosToCents(val) }),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  }
  async function initParticipants() {
    setBusy(true);
    try {
      await api(`/api/cagnotte/${pool.id}/init-participants`, { method: "POST" });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-base-100 rounded-box shadow p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
      <label className="text-sm">
        <span className="opacity-70">Mise par joueur (€)</span>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="input input-bordered input-sm mt-1 block w-full sm:w-32"
        />
      </label>
      <div className="flex gap-2">
        <button
          onClick={saveMise}
          disabled={busy || saved}
          className="btn btn-sm flex-1 sm:flex-none"
        >
          Enregistrer la mise
        </button>
        <button
          onClick={initParticipants}
          disabled={busy || !canInit}
          className="btn btn-sm btn-primary flex-1 sm:flex-none"
          title={
            canInit ? "Crée une ligne par membre actif de la saison" : "Enregistre d'abord la mise"
          }
        >
          Initialiser les participants
        </button>
      </div>
    </div>
  );
}
