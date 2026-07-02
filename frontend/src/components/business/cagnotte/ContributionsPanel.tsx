import { Link } from "react-router-dom";
import { api, formatMoney } from "@/api/client";
import type { Contribution, PoolDetail } from "@/components/business/cagnotte/types";
import { cn } from "@/lib/utils";

function initials(name?: string | null) {
    if (!name) return "—";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

export function ContributionsPanel({
    pool,
    canEdit,
    onChange,
}: {
    pool: PoolDetail;
    canEdit: boolean;
    onChange: () => void;
}) {
    async function togglePaid(c: Contribution) {
        await api(`/api/cagnotte/${pool.id}/contributions/${c.managerId}`, {
            method: "PUT",
            body: JSON.stringify({ paid: !c.paid }),
        });
        onChange();
    }
    const paidCount = pool.contributions.filter((c) => c.paid).length;

    return (
        <section>
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <span className="h-[18px] w-[5px] rounded-[3px]" style={{ background: "var(--grad-energy)" }} />
                    <h2 className="font-display text-[15px] font-black uppercase tracking-[0.3px] text-white">
                        Contributions
                    </h2>
                </div>
                <span className="text-[11px] font-bold text-texte-2">
                    {paidCount}/{pool.contributions.length} payé
                </span>
            </div>

            {pool.contributions.length ? (
                <div className="flex flex-col gap-2">
                    {pool.contributions.map((c) => (
                        <div
                            key={c.id}
                            className="lhm-row flex items-center gap-3 rounded-[13px] border bg-carte px-3 py-[11px]"
                            style={{ borderColor: c.paid ? "rgba(0,229,160,.28)" : "var(--color-bord)" }}
                        >
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-bord bg-carte-2 font-display text-[13px] font-black text-[#9aa3d4]">
                                {initials(c.manager)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-1.5">
                                    <Link
                                        to={`/profil/${c.managerId}`}
                                        className="truncate font-display text-sm font-extrabold text-white hover:underline"
                                    >
                                        {c.manager}
                                    </Link>
                                    {c.username && (
                                        <span className="shrink-0 text-[11px] font-medium text-texte-2">
                                            {c.username}
                                        </span>
                                    )}
                                </div>
                                {canEdit ? (
                                    <button
                                        type="button"
                                        onClick={() => togglePaid(c)}
                                        className={cn(
                                            "mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[10px] font-bold transition",
                                            c.paid
                                                ? "border-menthe/50 bg-menthe/[0.15] text-menthe"
                                                : "border-orange/50 bg-orange/[0.12] text-orange hover:brightness-110",
                                        )}
                                    >
                                        {c.paid ? "✓ Payé" : "⏳ En attente"}
                                    </button>
                                ) : (
                                    <span
                                        className={cn(
                                            "mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[10px] font-bold",
                                            c.paid
                                                ? "border-menthe/50 bg-menthe/[0.15] text-menthe"
                                                : "border-orange/50 bg-orange/[0.12] text-orange",
                                        )}
                                    >
                                        {c.paid ? "✓ Payé" : "⏳ En attente"}
                                    </span>
                                )}
                            </div>
                            <div
                                className={cn(
                                    "shrink-0 text-right font-display text-base font-black tabular-nums",
                                    c.paid ? "text-menthe" : "text-orange",
                                )}
                            >
                                {formatMoney(c.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="rounded-[13px] border border-bord bg-carte p-3 text-sm text-texte-2">
                    Aucun participant. {canEdit && "Définis la mise puis « initialiser les participants »."}
                </p>
            )}
        </section>
    );
}
