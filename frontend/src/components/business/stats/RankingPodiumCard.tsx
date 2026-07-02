import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { type Chip, cupChips, divChips, initials, playerGradient } from "./playerStyle";
import type { RankingEntry } from "./types";

const RANKS = {
    1: { medal: "🥇", accent: "#FFD23F", rgb: "255,210,63", label: "Champion all-time" },
    2: { medal: "🥈", accent: "#C7CEEF", rgb: "199,206,239", label: "Vice-champion" },
    3: { medal: "🥉", accent: "#FF6B35", rgb: "255,107,53", label: "3e marche" },
} as const;

function StatBox({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex-1 rounded-[10px] border border-bord bg-nuit px-0.5 py-[7px] text-center lg:rounded-[11px] lg:py-[9px]">
            <div className="font-display text-base font-black leading-none text-white lg:text-lg">{value}</div>
            <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.5px] text-texte-2 lg:mt-[3px] lg:text-[8px]">
                {label}
            </div>
        </div>
    );
}

function ChipRow({ chips, center }: { chips: Chip[]; center?: boolean }) {
    if (!chips.length) return null;
    return (
        <div className={cn("flex flex-wrap gap-[5px]", center && "justify-center")}>
            {chips.map((c, i) => (
                <span
                    key={i}
                    className="inline-flex items-center gap-0.5 rounded-lg border px-2 py-[3px] font-display text-[11px] font-black"
                    style={{ background: c.bg, borderColor: c.bd, color: c.c }}
                >
                    {c.label} {c.count}
                </span>
            ))}
        </div>
    );
}

/** Carte de podium all-time (or / argent / bronze). `layout` : row (mobile) / column (desktop). */
export function RankingPodiumCard({
    entry,
    rank,
    layout,
    isMe,
}: {
    entry: RankingEntry;
    rank: 1 | 2 | 3;
    layout: "row" | "column";
    isMe?: boolean;
}) {
    const r = RANKS[rank];
    const g = playerGradient(entry.managerId || entry.manager);
    const chips = [...divChips(entry.titles), ...cupChips(entry.cups)];
    const glow = `0 0 0 1px rgba(${r.rgb},.4), 0 16px 44px rgba(${r.rgb},.26)`;
    const featured = rank === 1;

    if (layout === "row") {
        return (
            <div
                className={cn("lhm-card overflow-hidden rounded-[18px] border bg-carte", isMe && "ring-2 ring-rose")}
                style={{ borderColor: `rgba(${r.rgb},.4)`, boxShadow: glow }}
            >
                <div className="h-1" style={{ background: r.accent }} />
                <div className="flex items-center gap-3 px-4 pb-1 pt-[15px]">
                    <div className="text-[30px] leading-none">{r.medal}</div>
                    <div
                        className="grid size-[50px] shrink-0 place-items-center rounded-[14px] font-display text-[17px] font-black"
                        style={{ background: g.grad, color: g.txt }}
                    >
                        {initials(entry.manager)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[9px] font-bold uppercase tracking-[1px]" style={{ color: r.accent }}>
                            {r.label}
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <Link
                                to={`/profil/${entry.managerId}`}
                                className="truncate font-display text-lg font-black tracking-[-0.3px] text-white hover:underline"
                            >
                                {entry.manager}
                            </Link>
                            {entry.username && (
                                <span className="shrink-0 text-[11px] font-medium text-texte-2">{entry.username}</span>
                            )}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="font-display text-[32px] font-black leading-none" style={{ color: r.accent }}>
                            {entry.total}
                        </div>
                        <div className="text-[8px] font-bold uppercase tracking-[0.5px] text-texte-2">Trophées</div>
                    </div>
                </div>
                <div className="flex gap-1.5 px-4 pb-2 pt-[11px]">
                    <StatBox value={entry.titres} label="Titres ligue" />
                    <StatBox value={entry.coupes} label="Coupes" />
                </div>
                <div className="px-4 pb-[14px]">
                    <ChipRow chips={chips} />
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn("lhm-card overflow-hidden rounded-[20px] border bg-carte", isMe && "ring-2 ring-rose")}
            style={{ borderColor: `rgba(${r.rgb},.45)`, boxShadow: glow }}
        >
            <div style={{ background: r.accent }} className={featured ? "h-[6px]" : "h-[5px]"} />
            <div className={cn("px-[22px] text-center", featured ? "py-[26px]" : "py-[22px]")}>
                <div className={featured ? "text-[46px] leading-none" : "text-[36px] leading-none"}>{r.medal}</div>
                <div
                    className={cn(
                        "mx-auto my-3 grid place-items-center font-display font-black",
                        featured ? "size-[72px] rounded-[20px] text-[25px]" : "size-[60px] rounded-[17px] text-[21px]",
                    )}
                    style={{ background: g.grad, color: g.txt }}
                >
                    {initials(entry.manager)}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[1px]" style={{ color: r.accent }}>
                    {r.label}
                </div>
                <Link
                    to={`/profil/${entry.managerId}`}
                    className={cn(
                        "mt-1 block font-display font-black tracking-[-0.3px] text-white hover:underline",
                        featured ? "text-[25px]" : "text-[21px]",
                    )}
                >
                    {entry.manager}
                </Link>
                {entry.username && <div className="mt-0.5 text-xs font-medium text-texte-2">{entry.username}</div>}
                <div
                    className={cn(
                        "mb-0.5 mt-3.5 font-display font-black leading-none",
                        featured ? "text-[60px]" : "text-[48px]",
                    )}
                    style={{ color: r.accent }}
                >
                    {entry.total}
                </div>
                <div className="mb-4 text-[9px] font-bold uppercase tracking-[1px] text-texte-2">Trophées all-time</div>
                <div className="mb-3 flex gap-2">
                    <StatBox value={entry.titres} label="Titres ligue" />
                    <StatBox value={entry.coupes} label="Coupes" />
                </div>
                <ChipRow chips={chips} center />
            </div>
        </div>
    );
}
