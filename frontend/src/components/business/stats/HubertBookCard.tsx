import { Link } from "react-router-dom";
import type { RankRow } from "@/components/business/stats/types";
import { initials, playerGradient } from "./playerStyle";

function Value({ value, unit, color }: { value: number | string; unit: string; color: string }) {
    return (
        <div className="flex shrink-0 items-baseline gap-1">
            <span className="font-display text-[17px] font-black leading-none lg:text-lg" style={{ color }}>
                {value}
            </span>
            {unit && <span className="text-[9px] font-bold text-texte-2 lg:text-[10px]">{unit}</span>}
        </div>
    );
}

function Name({ name, pseudo, size }: { name: string; pseudo: string | null; size: "leader" | "rest" }) {
    return (
        <div className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
            <span
                className={
                    size === "leader"
                        ? "truncate font-display text-sm font-black text-white lg:text-[14px]"
                        : "truncate font-display text-[13px] font-extrabold text-white"
                }
            >
                {name}
            </span>
            {pseudo && <span className="truncate text-[10px] text-texte-2">{pseudo}</span>}
        </div>
    );
}

/** Carte « record » du Hubert Book : leader mis en avant + suite du top 5. */
export function HubertBookCard({
    icon,
    title,
    subtitle,
    unit,
    color,
    rows,
}: {
    icon: string;
    title: string;
    subtitle: string;
    unit: string;
    color: string;
    rows?: RankRow[];
}) {
    const list = rows ?? [];
    const leader = list[0];
    const rest = list.slice(1, 5);

    return (
        <div className="lhm-card relative overflow-hidden rounded-2xl border border-bord bg-carte">
            <div className="h-1" style={{ background: color }} />
            <div className="p-4 lg:p-5">
                <div className="flex items-center gap-2.5 lg:gap-[11px]">
                    <div className="shrink-0 text-[21px] leading-none lg:text-[22px]">{icon}</div>
                    <div className="min-w-0 flex-1">
                        <div className="font-display text-[15px] font-black tracking-[-0.2px] text-white lg:text-base">
                            {title}
                        </div>
                        <div className="mt-px text-[10px] text-texte-2 lg:text-[11px]">{subtitle}</div>
                    </div>
                </div>

                {leader ? (
                    <>
                        <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-bord bg-nuit px-3 py-[9px] lg:gap-[11px]">
                            <span className="shrink-0 text-sm leading-none lg:text-[15px]">🔥</span>
                            <LeaderTile row={leader} />
                            <Name name={leader.manager} pseudo={leader.username} size="leader" />
                            <Value value={leader.value} unit={unit} color={color} />
                        </div>
                        <div className="mt-1 flex flex-col">
                            {rest.map((r, i) => {
                                const g = playerGradient(r.managerId || r.manager);
                                return (
                                    <Link
                                        key={r.managerId}
                                        to={`/profil/${r.managerId}`}
                                        className="flex items-center gap-2.5 rounded-lg px-2 py-[7px] transition hover:bg-carte-2/40 lg:gap-[11px]"
                                    >
                                        <span className="w-[13px] shrink-0 text-center font-display text-xs font-black text-texte-2 lg:w-3.5">
                                            {i + 2}
                                        </span>
                                        <div
                                            className="grid size-[26px] shrink-0 place-items-center rounded-lg font-display text-[10px] font-black lg:size-7 lg:text-[11px]"
                                            style={{ background: g.grad, color: g.txt }}
                                        >
                                            {initials(r.manager)}
                                        </div>
                                        <Name name={r.manager} pseudo={r.username} size="rest" />
                                        <Value value={r.value} unit={unit} color={color} />
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <p className="mt-3 text-sm text-texte-2">Pas encore de données.</p>
                )}
            </div>
        </div>
    );
}

function LeaderTile({ row }: { row: RankRow }) {
    const g = playerGradient(row.managerId || row.manager);
    return (
        <Link
            to={`/profil/${row.managerId}`}
            className="grid size-8 shrink-0 place-items-center rounded-[10px] font-display text-[11px] font-black lg:size-[34px] lg:text-xs"
            style={{ background: g.grad, color: g.txt }}
        >
            {initials(row.manager)}
        </Link>
    );
}
