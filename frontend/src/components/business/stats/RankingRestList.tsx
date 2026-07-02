import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { type Chip, cupChips, divChips, initials, playerGradient } from "./playerStyle";
import type { RankingEntry } from "./types";

const COLS = "grid-cols-[60px_minmax(160px,1.1fr)_minmax(250px,1.7fr)_minmax(150px,1fr)_70px]";

function Chips({ chips }: { chips: Chip[] }) {
    if (!chips.length) return <span className="text-texte-2/50">—</span>;
    return (
        <div className="flex flex-wrap gap-1.5">
            {chips.map((c, i) => (
                <span
                    key={i}
                    className="inline-flex items-center gap-0.5 rounded-lg border px-2.5 py-1 font-display text-[13px] font-black"
                    style={{ background: c.bg, borderColor: c.bd, color: c.c }}
                >
                    {c.label} {c.count}
                </span>
            ))}
        </div>
    );
}

/** Suite du classement all-time (rangs 4+) : cartes en mobile, tableau en desktop. */
export function RankingRestList({ entries, meId }: { entries: RankingEntry[]; meId?: string }) {
    if (!entries.length) return null;

    return (
        <>
            {/* Mobile : cartes */}
            <div className="flex flex-col gap-2 lg:hidden">
                {entries.map((e) => {
                    const g = playerGradient(e.managerId || e.manager);
                    const chips = [...divChips(e.titles), ...cupChips(e.cups)];
                    return (
                        <div
                            key={e.managerId}
                            className={cn(
                                "lhm-trow flex flex-col gap-[9px] rounded-[13px] border border-bord bg-carte px-[13px] py-[11px]",
                                e.managerId === meId && "ring-2 ring-rose",
                            )}
                        >
                            <div className="flex items-center gap-[11px]">
                                <div className="w-[22px] shrink-0 text-center font-display text-sm font-black text-texte-2">
                                    {e.rank}
                                </div>
                                <div
                                    className="grid size-9 shrink-0 place-items-center rounded-[11px] font-display text-[13px] font-black"
                                    style={{ background: g.grad, color: g.txt }}
                                >
                                    {initials(e.manager)}
                                </div>
                                <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                                    <Link
                                        to={`/profil/${e.managerId}`}
                                        className="truncate font-display text-sm font-extrabold text-white hover:underline"
                                    >
                                        {e.manager}
                                    </Link>
                                    {e.username && (
                                        <span className="shrink-0 text-[11px] font-medium text-texte-2">
                                            {e.username}
                                        </span>
                                    )}
                                </div>
                                <div className="shrink-0 text-right">
                                    <div className="font-display text-base font-black leading-none text-white">
                                        {e.total}
                                    </div>
                                    <div className="text-[7px] font-bold uppercase tracking-[0.5px] text-texte-2">
                                        Trophées
                                    </div>
                                </div>
                            </div>
                            {chips.length > 0 && (
                                <div className="flex flex-wrap gap-[5px] pl-[33px]">
                                    {chips.map((c, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-0.5 rounded-[7px] border px-[7px] py-0.5 font-display text-[10px] font-black"
                                            style={{ background: c.bg, borderColor: c.bd, color: c.c }}
                                        >
                                            {c.label} {c.count}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden overflow-hidden rounded-[18px] border border-bord bg-carte lg:block">
                <div
                    className={`grid ${COLS} items-center gap-4 border-b border-bord bg-nuit px-6 py-3.5 text-[10px] font-bold uppercase tracking-[1.5px] text-texte-2`}
                >
                    <div>Rang</div>
                    <div>Joueur</div>
                    <div>Titres par division</div>
                    <div>Coupes</div>
                    <div className="text-center">Total</div>
                </div>
                {entries.map((e) => {
                    const g = playerGradient(e.managerId || e.manager);
                    return (
                        <div
                            key={e.managerId}
                            className={cn(
                                `grid ${COLS} items-center gap-4 border-b border-carte-2 px-6 py-3.5 transition hover:bg-carte-2/40`,
                                e.managerId === meId && "bg-rose/5",
                            )}
                        >
                            <div className="font-display text-lg font-black text-texte-2">{e.rank}</div>
                            <div className="flex min-w-0 items-center gap-[13px]">
                                <div
                                    className="grid size-[42px] shrink-0 place-items-center rounded-xl font-display text-[15px] font-black"
                                    style={{ background: g.grad, color: g.txt }}
                                >
                                    {initials(e.manager)}
                                </div>
                                <div className="flex min-w-0 items-baseline gap-1.5">
                                    <Link
                                        to={`/profil/${e.managerId}`}
                                        className="truncate font-display text-base font-extrabold text-white hover:underline"
                                    >
                                        {e.manager}
                                    </Link>
                                    {e.username && (
                                        <span className="shrink-0 text-xs font-medium text-texte-2">{e.username}</span>
                                    )}
                                </div>
                            </div>
                            <Chips chips={divChips(e.titles)} />
                            <Chips chips={cupChips(e.cups)} />
                            <div className="text-center font-display text-xl font-black text-white">{e.total}</div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
