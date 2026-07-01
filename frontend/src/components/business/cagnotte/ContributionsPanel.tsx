import { ChevronDown } from "lucide-react";
import { api, formatMoney } from "@/api/client";
import type { Contribution, PoolDetail } from "@/components/business/cagnotte/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { cn } from "@/lib/utils";

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
    return (
        <details open className="group overflow-hidden rounded-2xl border border-bord bg-carte">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-display text-sm font-black text-white [&::-webkit-details-marker]:hidden">
                <span>
                    Mises ({pool.contributions.filter((c) => c.paid).length}/{pool.contributions.length} payées)
                </span>
                <ChevronDown size={16} className="text-texte-2 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-bord">
                {pool.contributions.length ? (
                    <ul className="divide-y divide-bord">
                        {pool.contributions.map((c) => (
                            <li key={c.id} className="flex items-center gap-2 p-3 text-sm">
                                <span className="min-w-0 flex-1 text-white">
                                    <ManagerLabel
                                        name={c.manager}
                                        username={c.username}
                                        avatarUrl={c.avatarUrl}
                                        size={26}
                                    />
                                </span>
                                <span className="shrink-0 text-texte-2">{formatMoney(c.amount)}</span>
                                {canEdit ? (
                                    <button
                                        type="button"
                                        onClick={() => togglePaid(c)}
                                        className={cn(
                                            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition",
                                            c.paid
                                                ? "bg-menthe/20 text-menthe"
                                                : "bg-carte-2 text-texte-2 hover:text-white",
                                        )}
                                    >
                                        {c.paid ? "✓ payé" : "à payer"}
                                    </button>
                                ) : (
                                    <span className={cn("shrink-0", c.paid ? "text-menthe" : "text-texte-2/40")}>
                                        {c.paid ? "✓" : "—"}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-3 text-sm text-texte-2">
                        Aucun participant. {canEdit && "Définis la mise puis « initialiser les participants »."}
                    </p>
                )}
            </div>
        </details>
    );
}
