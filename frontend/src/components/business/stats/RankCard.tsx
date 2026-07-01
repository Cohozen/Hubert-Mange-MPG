import type { RankRow } from "@/components/business/stats/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { cn } from "@/lib/utils";

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
        <div className="lhm-card rounded-2xl border border-bord bg-carte p-4">
            <h3 className="font-display text-sm font-black text-white">{title}</h3>
            <p className="mb-2 mt-0.5 text-xs text-texte-2">{subtitle.charAt(0).toUpperCase() + subtitle.slice(1)}</p>
            {rows?.length ? (
                <ul className="space-y-1.5">
                    {rows.slice(0, 6).map((r, i) => (
                        <li key={r.managerId} className="flex items-center justify-between gap-2 text-sm">
                            <span
                                className={cn("flex min-w-0 items-center gap-1 text-white", i === 0 && "font-semibold")}
                            >
                                {i === 0 && <span>👑</span>}
                                <ManagerLabel
                                    name={r.manager}
                                    username={r.username}
                                    avatarUrl={r.avatarUrl}
                                    size={20}
                                />
                            </span>
                            <span className={cn("shrink-0 font-display font-black", accent)}>
                                {r.value}
                                {unit}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-texte-2">Pas encore de données.</p>
            )}
        </div>
    );
}
