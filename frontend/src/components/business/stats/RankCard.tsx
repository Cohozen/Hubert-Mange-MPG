import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { RankRow } from "@/components/business/stats/types";

export function RankCard({
    title,
    subtitle,
    rows,
    unit,
    accent,
}: {
    title: string;
    subtitle: string;
    rows?: RankRow[];
    unit: string;
    accent: string;
}) {
    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body p-4">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-xs opacity-60 -mt-1 mb-1">{subtitle.charAt(0).toUpperCase() + subtitle.slice(1)}</p>
                {rows?.length ? (
                    <ul className="space-y-1.5">
                        {rows.slice(0, 6).map((r, i) => (
                            <li key={r.managerId} className="flex items-center justify-between gap-2 text-sm">
                                <span className={`flex items-center gap-1 min-w-0 ${i === 0 ? "font-semibold" : ""}`}>
                                    {i === 0 && <span>👑</span>}
                                    <ManagerLabel
                                        name={r.manager}
                                        username={r.username}
                                        avatarUrl={r.avatarUrl}
                                        size={20}
                                    />
                                </span>
                                <span className={`font-bold shrink-0 ${accent}`}>
                                    {r.value}
                                    {unit}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm opacity-60">Pas encore de données.</p>
                )}
            </div>
        </div>
    );
}
