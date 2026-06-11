import { api, formatMoney } from "@/api/client";
import { Contribution, PoolDetail } from "@/components/business/cagnotte/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

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
        <div className="collapse collapse-arrow bg-base-100 rounded-box shadow">
            <input type="checkbox" defaultChecked />
            <div className="collapse-title font-semibold bg-base-200 min-h-0 py-3">
                Mises ({pool.contributions.filter((c) => c.paid).length}/{pool.contributions.length} payées)
            </div>
            <div className="collapse-content !p-0">
                {pool.contributions.length ? (
                    <ul className="divide-y divide-base-200">
                        {pool.contributions.map((c) => (
                            <li key={c.id} className="flex items-center gap-2 p-3 text-sm">
                                <span className="flex-1 min-w-0">
                                    <ManagerLabel
                                        name={c.manager}
                                        username={c.username}
                                        avatarUrl={c.avatarUrl}
                                        size={26}
                                    />
                                </span>
                                <span className="opacity-60 shrink-0">{formatMoney(c.amount)}</span>
                                {canEdit ? (
                                    <button
                                        onClick={() => togglePaid(c)}
                                        className={`shrink-0 text-xs rounded-full px-3 py-1 ${
                                            c.paid ? "bg-success text-success-content" : "bg-base-300"
                                        }`}
                                    >
                                        {c.paid ? "✓ payé" : "à payer"}
                                    </button>
                                ) : (
                                    <span className={`shrink-0 ${c.paid ? "text-success" : "opacity-40"}`}>
                                        {c.paid ? "✓" : "—"}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-3 text-sm opacity-60">
                        Aucun participant. {canEdit && "Définis la mise puis « initialiser les participants »."}
                    </p>
                )}
            </div>
        </div>
    );
}
