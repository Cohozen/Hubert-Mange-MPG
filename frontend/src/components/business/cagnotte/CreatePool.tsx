import { useState } from "react";
import { api, eurosToCents } from "@/api/client";
import { SeasonRow } from "@/components/business/cagnotte/types";

// Démarrage d'une cagnotte : on enregistre la mise (crée la cagnotte au passage).
export function CreatePool({ season, onCreated }: { season: SeasonRow; onCreated: () => void }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    try {
      await api("/api/cagnotte", {
        method: "POST",
        body: JSON.stringify({ realSeasonId: season.id, buyInAmount: eurosToCents(val) }),
      });
      onCreated();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="bg-base-100 rounded-box shadow p-6 space-y-3">
      <h3 className="font-semibold">Démarrer la cagnotte {season.name}</h3>
      <p className="text-sm opacity-60">Indique la mise par joueur pour créer la cagnotte.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="opacity-70">Mise par joueur (€)</span>
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="input input-bordered input-sm mt-1 block w-32"
          />
        </label>
        <button onClick={create} disabled={busy || !val} className="btn btn-sm btn-primary">
          Enregistrer la mise
        </button>
      </div>
    </div>
  );
}
