import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, eurosToCents } from "@/api/client";

export function RulesEditor({ poolId, onChange }: { poolId: string; onChange: () => void }) {
    const qc = useQueryClient();
    const { data } = useQuery({
        queryKey: ["rules", poolId],
        queryFn: () =>
            api<{
                rules: { scope: string; divisionLevel: number | null; amount: number }[];
                divisionLevels: number[];
                competitions: string[];
            }>(`/api/cagnotte/${poolId}/rules`),
    });
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const [ldc, setLdc] = useState("");
    const [uefa, setUefa] = useState("");
    const [conference, setConference] = useState("");
    const [busy, setBusy] = useState(false);
    const [genMsg, setGenMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!data) return;
        const m: Record<number, string> = {};
        for (const r of data.rules) {
            if (r.scope === "DIVISION" && r.divisionLevel) m[r.divisionLevel] = String(r.amount / 100);
            if (r.scope === "LDC") setLdc(String(r.amount / 100));
            if (r.scope === "UEFA") setUefa(String(r.amount / 100));
            if (r.scope === "CONFERENCE") setConference(String(r.amount / 100));
        }
        setAmounts(m);
    }, [data]);

    async function saveRules() {
        setBusy(true);
        try {
            const rules: any[] = (data?.divisionLevels ?? []).map((l) => ({
                scope: "DIVISION",
                divisionLevel: l,
                amount: eurosToCents(amounts[l] || "0"),
                label: `Vainqueur D${l}`,
            }));
            if (ldc)
                rules.push({
                    scope: "LDC",
                    amount: eurosToCents(ldc),
                    label: "Vainqueur Ligue des Crampons",
                });
            if (uefa)
                rules.push({
                    scope: "UEFA",
                    amount: eurosToCents(uefa),
                    label: "Vainqueur Heureux papa's League",
                });
            if (conference)
                rules.push({
                    scope: "CONFERENCE",
                    amount: eurosToCents(conference),
                    label: "Vainqueur Heureux papa's League Conference",
                });
            await api(`/api/cagnotte/${poolId}/rules`, {
                method: "PUT",
                body: JSON.stringify({ rules }),
            });
            qc.invalidateQueries({ queryKey: ["rules", poolId] });
        } finally {
            setBusy(false);
        }
    }
    async function generate() {
        setBusy(true);
        setGenMsg(null);
        try {
            const r = await api<{ created: number; updated: number }>(`/api/cagnotte/${poolId}/generate-payouts`, {
                method: "POST",
            });
            setGenMsg(`${r.created} créé(s), ${r.updated} mis à jour.`);
            onChange();
        } catch (e: any) {
            setGenMsg(e.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="bg-base-100 rounded-box shadow p-4 space-y-3">
            <h3 className="font-semibold">Grille de gains (montants fixes)</h3>
            <p className="text-xs opacity-60">
                Montant en € du vainqueur de chaque division et de chaque coupe. « Générer » crée les reversements des
                gagnants une fois les saisons et coupes terminées (sans toucher aux gains déjà versés).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data?.divisionLevels.map((l) => (
                    <label key={l} className="text-sm">
                        <span className="opacity-70">Vainqueur D{l}</span>
                        <input
                            value={amounts[l] ?? ""}
                            onChange={(e) => setAmounts((a) => ({ ...a, [l]: e.target.value }))}
                            className="input input-bordered input-sm w-full mt-1"
                        />
                    </label>
                ))}
                <label className="text-sm">
                    <span className="opacity-70">⭐ Ligue des Crampons</span>
                    <input
                        value={ldc}
                        onChange={(e) => setLdc(e.target.value)}
                        className="input input-bordered input-sm w-full mt-1"
                    />
                </label>
                <label className="text-sm">
                    <span className="opacity-70">🎖️ Heureux papa's League</span>
                    <input
                        value={uefa}
                        onChange={(e) => setUefa(e.target.value)}
                        className="input input-bordered input-sm w-full mt-1"
                    />
                </label>
                <label className="text-sm">
                    <span className="opacity-70">🍐 Heureux papa's League Conference</span>
                    <input
                        value={conference}
                        onChange={(e) => setConference(e.target.value)}
                        className="input input-bordered input-sm w-full mt-1"
                    />
                </label>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                <button onClick={saveRules} disabled={busy} className="btn btn-sm">
                    Enregistrer la grille
                </button>
                <button onClick={generate} disabled={busy} className="btn btn-sm btn-primary">
                    Générer les reversements
                </button>
                {genMsg && <span className="text-sm opacity-70">{genMsg}</span>}
            </div>
        </div>
    );
}
