import { ChevronDown, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { api, formatMoney } from "@/api/client";
import { PayQr } from "@/components/business/cagnotte/PayQr";
import type { Payout, PoolDetail } from "@/components/business/cagnotte/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { cn } from "@/lib/utils";

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
        <details open className="group overflow-hidden rounded-2xl border border-bord bg-carte">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-display text-sm font-black text-white [&::-webkit-details-marker]:hidden">
                <span>
                    Reversements ({pool.payouts.filter((p) => p.paid).length}/{pool.payouts.length} versés)
                </span>
                <ChevronDown size={16} className="text-texte-2 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-bord">
                {pool.payouts.length ? (
                    <ul className="divide-y divide-bord">
                        {pool.payouts.map((p) => (
                            <Fragment key={p.id}>
                                <li className="flex flex-wrap items-center gap-2 p-3 text-sm">
                                    <span className="min-w-0 flex-1 text-white">
                                        <ManagerLabel
                                            name={p.manager}
                                            username={p.username}
                                            avatarUrl={p.avatarUrl}
                                            size={26}
                                        />
                                        <span className="-mt-0.5 ml-8 block text-xs text-texte-2">{p.reason}</span>
                                    </span>
                                    <span className="shrink-0 font-medium text-white">{formatMoney(p.amount)}</span>
                                    {canEdit ? (
                                        <span className="flex shrink-0 gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setQrFor(qrFor === p.id ? null : p.id)}
                                                className="rounded-full bg-carte-2 px-3 py-1 text-xs font-semibold text-texte-2 transition hover:text-white"
                                            >
                                                💳 Payer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => togglePaid(p)}
                                                className={cn(
                                                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                                                    p.paid
                                                        ? "bg-menthe/20 text-menthe"
                                                        : "bg-carte-2 text-texte-2 hover:text-white",
                                                )}
                                            >
                                                {p.paid ? "✓ versé" : "à verser"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => remove(p)}
                                                aria-label="Supprimer"
                                                className="grid size-7 place-items-center rounded-full text-rouge transition hover:bg-rouge/10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </span>
                                    ) : (
                                        <span className={cn("shrink-0", p.paid ? "text-menthe" : "text-texte-2/40")}>
                                            {p.paid ? "✓ versé" : "—"}
                                        </span>
                                    )}
                                </li>
                                {qrFor === p.id && (
                                    <li className="bg-nuit p-3">
                                        <PayQr managerId={p.managerId} />
                                    </li>
                                )}
                            </Fragment>
                        ))}
                    </ul>
                ) : (
                    <p className="p-3 text-sm text-texte-2">
                        Aucun reversement. {canEdit && "Règle la grille de gains puis « Générer les reversements »."}
                    </p>
                )}
            </div>
        </details>
    );
}
