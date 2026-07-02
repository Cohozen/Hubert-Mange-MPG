import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { RankRow } from "@/components/business/stats/types";
import { initials, playerGradient } from "./playerStyle";

/** Carte « mouvement » (Montées / Descentes / Yo-yo). Réutilisée 3×. */
export function MovementCard({
    title,
    icon,
    accentColor,
    accentRgb,
    headerRight,
    rows,
    formatValue,
}: {
    title: string;
    icon: ReactNode;
    accentColor: string;
    accentRgb: string;
    headerRight?: ReactNode;
    rows: RankRow[];
    formatValue: (value: number) => string;
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-bord bg-carte">
            <div className="flex items-center gap-2.5 border-b border-bord px-4 py-3 lg:px-5 lg:py-[15px]">
                <span className="text-[15px] leading-none lg:text-lg" style={{ color: accentColor }}>
                    {icon}
                </span>
                <span className="flex-1 font-display text-xs font-black uppercase tracking-[0.5px] text-white lg:text-sm">
                    {title}
                </span>
                {headerRight}
            </div>
            <div className="flex flex-col gap-[7px] p-[11px] lg:gap-[9px] lg:p-3.5">
                {rows.length ? (
                    rows.map((r) => {
                        const g = playerGradient(r.managerId || r.manager);
                        return (
                            <div
                                key={r.managerId}
                                className="flex items-center gap-2.5 rounded-xl border border-bord bg-nuit px-[11px] py-2 lg:gap-3 lg:px-3.5 lg:py-[11px]"
                            >
                                <div
                                    className="grid size-[30px] shrink-0 place-items-center rounded-[9px] font-display text-[11px] font-black lg:size-9 lg:rounded-[10px] lg:text-[13px]"
                                    style={{ background: g.grad, color: g.txt }}
                                >
                                    {initials(r.manager)}
                                </div>
                                <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                                    <Link
                                        to={`/profil/${r.managerId}`}
                                        className="truncate font-display text-[13px] font-extrabold text-white hover:underline lg:text-sm"
                                    >
                                        {r.manager}
                                    </Link>
                                    {r.username && (
                                        <span className="shrink-0 text-[11px] font-medium text-texte-2">
                                            {r.username}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className="shrink-0 rounded-lg border px-[9px] py-1 font-display text-[11px] font-black lg:py-[5px] lg:text-xs"
                                    style={{
                                        color: accentColor,
                                        background: `rgba(${accentRgb},.12)`,
                                        borderColor: `rgba(${accentRgb},.4)`,
                                    }}
                                >
                                    {formatValue(r.value)}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <p className="px-1 py-2 text-sm text-texte-2">Aucun mouvement.</p>
                )}
            </div>
        </div>
    );
}
