import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { initials, playerGradient } from "@/components/business/stats/playerStyle";
import type { H2H, OppRow } from "@/components/business/stats/types";
import { Empty } from "@/components/ui/Empty";

const BADGE = {
    dom: { label: "Domination", emoji: "", c: "#00E5A0", bg: "rgba(0,229,160,.12)", bd: "rgba(0,229,160,.4)" },
    fav: { label: "Favorable", emoji: "", c: "#34D399", bg: "rgba(52,211,153,.1)", bd: "rgba(52,211,153,.35)" },
    even: { label: "Équilibré", emoji: "", c: "#8B92C4", bg: "rgba(139,146,196,.1)", bd: "#2A3160" },
    hard: { label: "Difficile", emoji: "", c: "#FF6B35", bg: "rgba(255,107,53,.12)", bd: "rgba(255,107,53,.4)" },
    nemesis: { label: "Bête noire", emoji: "🐐", c: "#FF3B5C", bg: "rgba(255,59,92,.12)", bd: "rgba(255,59,92,.4)" },
    prey: {
        label: "Victime préférée",
        emoji: "💚",
        c: "#FFD23F",
        bg: "rgba(255,210,63,.12)",
        bd: "rgba(255,210,63,.4)",
    },
} as const;

function badgeFor(o: OppRow, nemesisId?: string | null, preyId?: string | null) {
    if (o.opponentId === preyId) return BADGE.prey;
    if (o.opponentId === nemesisId) return BADGE.nemesis;
    const p = o.played || 1;
    if (o.w > o.l) return o.w / p >= 0.65 ? BADGE.dom : BADGE.fav;
    if (o.w === o.l) return BADGE.even;
    return o.l / p >= 0.6 ? BADGE.nemesis : BADGE.hard;
}

const fmt2 = (n: number) => n.toFixed(2).replace(".", ",");
const COLS = "grid-cols-[1.6fr_60px_54px_54px_54px_80px_80px_150px]";

export function ProfileConfrontationsTab({ managerId }: { managerId: string }) {
    const { data: h } = useQuery({
        queryKey: ["h2h", managerId],
        queryFn: () => api<H2H>(`/api/palmares/h2h/${managerId}`),
    });

    if (!h) return null;
    if (h.opponents.length === 0) return <Empty>Aucune confrontation enregistrée.</Empty>;

    const o = h.overall;
    const moyGlobal = o.played ? fmt2((o.w * 3 + o.d) / o.played) : "0";

    return (
        <div className="overflow-hidden rounded-[18px] border border-bord bg-carte">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bord px-4 py-3.5 lg:px-6">
                <div className="flex items-center gap-2.5">
                    <span
                        className="h-[18px] w-[5px] rounded-[3px] lg:h-5"
                        style={{ background: "var(--grad-energy)" }}
                    />
                    <h2 className="font-display text-[15px] font-black uppercase tracking-[0.3px] text-white lg:text-[17px]">
                        Confrontations
                    </h2>
                </div>
                <span className="text-[11px] font-bold text-texte-2 lg:text-xs">
                    <b className="text-white">
                        {o.w}V · {o.d}N · {o.l}D
                    </b>{" "}
                    · moy. {moyGlobal} pts
                </span>
            </div>

            {/* Desktop : en-tête de tableau */}
            <div
                className={`hidden ${COLS} items-center gap-3 border-b border-bord bg-nuit px-6 py-3 text-[10px] font-bold uppercase tracking-[1.5px] text-texte-2 lg:grid`}
            >
                <div>Adversaire</div>
                <div className="text-center">Joués</div>
                <div className="text-center">V</div>
                <div className="text-center">N</div>
                <div className="text-center">D</div>
                <div className="text-center">Diff.</div>
                <div className="text-center">Moy. pts</div>
                <div>Bilan</div>
            </div>

            {h.opponents.map((op) => {
                const g = playerGradient(op.opponentId || op.manager);
                const moy = op.played ? fmt2((op.w * 3 + op.d) / op.played) : "0";
                const gd = op.gf - op.ga;
                const gdColor = gd > 0 ? "#00E5A0" : gd < 0 ? "#FF3B5C" : "#8B92C4";
                const b = badgeFor(op, h.beteNoire?.opponentId, h.victimePreferee?.opponentId);
                const tile = (
                    <div
                        className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-[13px] font-black lg:size-[42px] lg:text-[15px]"
                        style={{ background: g.grad, color: g.txt }}
                    >
                        {initials(op.manager)}
                    </div>
                );
                const nameLink = (
                    <div className="flex min-w-0 items-baseline gap-1.5">
                        <Link
                            to={`/profil/${op.opponentId}`}
                            className="truncate font-display text-sm font-extrabold text-white hover:underline lg:text-base"
                        >
                            {op.manager}
                        </Link>
                        {op.username && <span className="shrink-0 text-[11px] text-texte-2">{op.username}</span>}
                    </div>
                );
                const badge = (
                    <span
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold lg:text-[11px]"
                        style={{ color: b.c, background: b.bg, borderColor: b.bd }}
                    >
                        {b.emoji} {b.label}
                    </span>
                );

                return (
                    <div key={op.opponentId}>
                        {/* Mobile : carte */}
                        <div className="lhm-trow flex items-center gap-3 border-b border-carte-2 px-4 py-3 lg:hidden">
                            {tile}
                            <div className="min-w-0 flex-1">
                                {nameLink}
                                <div className="mt-1.5">{badge}</div>
                            </div>
                            <div className="flex shrink-0 gap-1">
                                {[
                                    { v: op.w, l: "V", c: "#00E5A0" },
                                    { v: op.d, l: "N", c: "#8B92C4" },
                                    { v: op.l, l: "D", c: "#FF6B8A" },
                                ].map((x) => (
                                    <div key={x.l} className="w-6 text-center">
                                        <div
                                            className="font-display text-sm font-black leading-none"
                                            style={{ color: x.c }}
                                        >
                                            {x.v}
                                        </div>
                                        <div className="mt-0.5 text-[7px] font-bold text-texte-2">{x.l}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="w-[46px] shrink-0 text-right">
                                <div className="font-display text-[15px] font-black leading-none text-white">{moy}</div>
                                <div className="mt-0.5 text-[7px] font-bold uppercase text-texte-2">Moy</div>
                            </div>
                        </div>

                        {/* Desktop : ligne de tableau */}
                        <div
                            className={`lhm-trow hidden ${COLS} items-center gap-3 border-b border-carte-2 px-6 py-3 transition hover:bg-carte-2/40 lg:grid`}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                {tile}
                                {nameLink}
                            </div>
                            <div className="text-center font-display text-[15px] font-extrabold text-[#C7CEEF]">
                                {op.played}
                            </div>
                            <div className="text-center font-display font-black text-menthe">{op.w}</div>
                            <div className="text-center font-display font-black text-texte-2">{op.d}</div>
                            <div className="text-center font-display font-black text-[#FF6B8A]">{op.l}</div>
                            <div className="text-center font-display font-black" style={{ color: gdColor }}>
                                {gd > 0 ? "+" : ""}
                                {gd}
                            </div>
                            <div className="text-center font-display text-lg font-black text-white">{moy}</div>
                            <div>{badge}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
