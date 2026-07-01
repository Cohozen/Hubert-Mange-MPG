import { useState } from "react";
import { api, eurosToCents } from "@/api/client";
import type { PoolDetail } from "@/components/business/cagnotte/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <div className="flex flex-col gap-3 rounded-2xl border border-bord bg-carte p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="text-sm">
                <span className="text-texte-2">Mise par joueur (€)</span>
                <Input
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="mt-1 block w-full bg-nuit sm:w-32"
                />
            </label>
            <div className="flex gap-2">
                <Button onClick={saveMise} disabled={busy || saved} variant="soft" className="flex-1 sm:flex-none">
                    Enregistrer la mise
                </Button>
                <Button
                    onClick={initParticipants}
                    disabled={busy || !canInit}
                    variant="energy"
                    className="flex-1 sm:flex-none"
                    title={canInit ? "Crée une ligne par membre actif de la saison" : "Enregistre d'abord la mise"}
                >
                    Initialiser les participants
                </Button>
            </div>
        </div>
    );
}
