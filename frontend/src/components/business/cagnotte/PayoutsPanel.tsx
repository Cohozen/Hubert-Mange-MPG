import { Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatMoney } from "@/api/client";
import { PayQr } from "@/components/business/cagnotte/PayQr";
import type { Payout, PoolDetail } from "@/components/business/cagnotte/types";
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
        await api(`/api/cagnotte/payouts/${p.id}`, { method: "PUT", body: JSON.stringify({ paid: !p.paid }) });
        onChange();
    }
    async function remove(p: Payout) {
        await api(`/api/cagnotte/payouts/${p.id}`, { method: "DELETE" });
        onChange();
    }

    const total = pool.payouts.reduce((s, p) => s + p.amount, 0);

    return (
        <section>
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <span className="h-[18px] w-[5px] rounded-[3px]" style={{ background: "var(--grad-lime)" }} />
                    <h2 className="font-display text-[15px] font-black uppercase tracking-[0.3px] text-white">
                        Reversements
                    </h2>
                </div>
                <span className="text-[11px] font-bold text-texte-2">{formatMoney(total)} redistribué</span>
            </div>

            {pool.payouts.length ? (
                <div className="flex flex-col gap-2">
                    {pool.payouts.map((p) => (
                        <Fragment key={p.id}>
                            <div
                                className="lhm-row relative flex flex-wrap items-center gap-3 overflow-hidden rounded-[13px] border border-bord bg-carte px-3 py-3 pl-4"
                                style={{ borderColor: p.paid ? "rgba(0,229,160,.28)" : "var(--color-bord)" }}
                            >
                                <span
                                    className="absolute inset-y-0 left-0 w-1"
                                    style={{ background: p.paid ? "var(--color-menthe)" : "var(--color-bord)" }}
                                />
                                <div className="grid size-[42px] shrink-0 place-items-center rounded-xl text-xl grad-lime">
                                    🏆
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-display text-sm font-extrabold text-white">{p.reason}</div>
                                    <div className="mt-0.5 flex items-baseline gap-1.5">
                                        <Link
                                            to={`/profil/${p.managerId}`}
                                            className="truncate text-xs text-texte-2 hover:text-white hover:underline"
                                        >
                                            {p.manager}
                                        </Link>
                                        {p.username && (
                                            <span className="shrink-0 text-[11px] text-texte-2">{p.username}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0 font-display text-base font-black tabular-nums text-menthe">
                                    {formatMoney(p.amount)}
                                </div>
                                {canEdit ? (
                                    <div className="flex shrink-0 items-center gap-1">
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
                                    </div>
                                ) : (
                                    <span
                                        className={cn(
                                            "shrink-0 text-xs font-semibold",
                                            p.paid ? "text-menthe" : "text-texte-2/50",
                                        )}
                                    >
                                        {p.paid ? "✓ versé" : "en attente"}
                                    </span>
                                )}
                            </div>
                            {qrFor === p.id && (
                                <div className="rounded-[13px] border border-bord bg-nuit p-3">
                                    <PayQr managerId={p.managerId} />
                                </div>
                            )}
                        </Fragment>
                    ))}
                </div>
            ) : (
                <p className="rounded-[13px] border border-bord bg-carte p-3 text-sm text-texte-2">
                    Aucun reversement. {canEdit && "Règle la grille de gains puis « Générer les reversements »."}
                </p>
            )}
        </section>
    );
}
