import { Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { api, formatMoney } from "@/api/client";
import { PayQr } from "@/components/business/cagnotte/PayQr";
import { Payout, PoolDetail } from "@/components/business/cagnotte/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

export function PayoutsPanel({
    pool,
    canEdit,
    onChange,
}: {
    pool: PoolDetail;
    canEdit: boolean;
    onChange: () => void;
}) {
    const [qrFor, setQrFor] = useState<string | null>(null);

    async function togglePaid(p: Payout) {
        await api(`/api/cagnotte/payouts/${p.id}`, {
            method: "PUT",
            body: JSON.stringify({ paid: !p.paid }),
        });
        onChange();
    }
    async function remove(p: Payout) {
        await api(`/api/cagnotte/payouts/${p.id}`, { method: "DELETE" });
        onChange();
    }

    return (
        <div className="collapse collapse-arrow bg-base-100 rounded-box shadow">
            <input type="checkbox" defaultChecked />
            <div className="collapse-title font-semibold bg-base-200 min-h-0 py-3">
                Reversements ({pool.payouts.filter((p) => p.paid).length}/{pool.payouts.length} versés)
            </div>
            <div className="collapse-content !p-0">
                {pool.payouts.length ? (
                    <ul className="divide-y divide-base-200">
                        {pool.payouts.map((p) => (
                            <Fragment key={p.id}>
                                <li className="flex flex-wrap items-center gap-2 p-3 text-sm">
                                    <span className="flex-1 min-w-0">
                                        <ManagerLabel
                                            name={p.manager}
                                            username={p.username}
                                            avatarUrl={p.avatarUrl}
                                            size={26}
                                        />
                                        <span className="block text-xs opacity-60 ml-8 -mt-0.5">{p.reason}</span>
                                    </span>
                                    <span className="font-medium shrink-0">{formatMoney(p.amount)}</span>
                                    {canEdit ? (
                                        <span className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => setQrFor(qrFor === p.id ? null : p.id)}
                                                className="btn btn-xs"
                                            >
                                                💳 Payer
                                            </button>
                                            <button
                                                onClick={() => togglePaid(p)}
                                                className={`btn btn-xs ${p.paid ? "btn-success" : "btn-ghost bg-base-300"}`}
                                            >
                                                {p.paid ? "✓ versé" : "à verser"}
                                            </button>
                                            <button
                                                onClick={() => remove(p)}
                                                className="btn btn-xs btn-ghost text-error"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </span>
                                    ) : (
                                        <span className={`shrink-0 ${p.paid ? "text-success" : "opacity-40"}`}>
                                            {p.paid ? "✓ versé" : "—"}
                                        </span>
                                    )}
                                </li>
                                {qrFor === p.id && (
                                    <li className="p-3 bg-base-200">
                                        <PayQr managerId={p.managerId} />
                                    </li>
                                )}
                            </Fragment>
                        ))}
                    </ul>
                ) : (
                    <p className="p-3 text-sm opacity-60">
                        Aucun reversement. {canEdit && "Règle la grille de gains puis « Générer les reversements »."}
                    </p>
                )}
            </div>
        </div>
    );
}
