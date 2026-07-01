import { useState } from "react";
import { api, eurosToCents } from "@/api/client";
import type { SeasonRow } from "@/components/business/cagnotte/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <div className="space-y-3 rounded-2xl border border-bord bg-carte p-6">
            <h3 className="font-display text-base font-black text-white">Démarrer la cagnotte {season.name}</h3>
            <p className="text-sm text-texte-2">Indique la mise par joueur pour créer la cagnotte.</p>
            <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm">
                    <span className="text-texte-2">Mise par joueur (€)</span>
                    <Input value={val} onChange={(e) => setVal(e.target.value)} className="mt-1 block w-32 bg-nuit" />
                </label>
                <Button onClick={create} disabled={busy || !val} variant="energy">
                    Enregistrer la mise
                </Button>
            </div>
        </div>
    );
}
