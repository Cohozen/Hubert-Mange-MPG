import { Link } from "react-router-dom";
import type { CupCount } from "@/components/business/palmares/types";

/** Médaille de rang (or / argent / bronze) pour le top 3. */
const rankStyles = [
    { bg: "linear-gradient(135deg,#FFE48A,#FFD23F)", color: "#3D2E00" },
    { bg: "linear-gradient(135deg,#E2E8F8,#A9B2D8)", color: "#1B2350" },
    { bg: "linear-gradient(135deg,#E59866,#B4631F)", color: "#ffffff" },
];

function initials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

const GRID = "grid-cols-[26px_1fr_28px_28px_28px_32px] lg:grid-cols-[64px_1fr_88px_88px_88px_88px]";

/** Carte « Classement des vainqueurs » de coupe (façon JO : C1 > C3 > C4). */
export function PalmaresRankingCard({ rows }: { rows: CupCount[] }) {
    return (
        <div className="lhm-card overflow-hidden rounded-[18px] border border-bord bg-carte lg:rounded-[20px]">
            <div className="h-1 lg:h-[5px]" style={{ background: "linear-gradient(90deg,#00E5A0,#FFD23F,#A78BFA)" }} />

            {/* En-tête */}
            <div className="flex items-center justify-between gap-5 px-[15px] py-[15px] lg:px-[26px] lg:py-5">
                <div className="flex items-center gap-2 lg:gap-[13px]">
                    <span className="text-[17px] lg:text-[26px]">🏅</span>
                    <div>
                        <div className="font-display text-base font-black text-white lg:text-[21px]">
                            Classement des vainqueurs
                        </div>
                        <div className="mt-0.5 text-[11px] text-texte-2 lg:text-[13px]">
                            Façon JO · la C1 prime, puis la C3, puis la C4.
                        </div>
                    </div>
                </div>
                <div className="hidden items-center gap-4 lg:flex">
                    {[
                        { c: "#00E5A0", t: "C1 · LDC" },
                        { c: "#FFD23F", t: "C3 · Europa" },
                        { c: "#A78BFA", t: "C4 · Conf." },
                    ].map((l) => (
                        <span key={l.t} className="flex items-center gap-1.5 text-[11px] font-bold text-texte-2">
                            <span className="size-[9px] rounded-full" style={{ background: l.c }} />
                            {l.t}
                        </span>
                    ))}
                </div>
            </div>

            {/* En-tête de colonnes */}
            <div
                className={`grid ${GRID} items-center gap-[5px] border-y border-bord bg-nuit px-[15px] py-2 lg:gap-[14px] lg:px-[26px] lg:py-3`}
            >
                <div className="text-[9px] font-bold text-texte-2 lg:text-[10px] lg:uppercase lg:tracking-[1.5px]">
                    <span className="lg:hidden">#</span>
                    <span className="hidden lg:inline">Rang</span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-[0.5px] text-texte-2 lg:text-[10px] lg:tracking-[1.5px]">
                    Joueur
                </div>
                <div className="text-center font-display text-[10px] font-black text-menthe lg:text-xs">
                    <span className="lg:hidden">C1</span>
                    <span className="hidden lg:inline">⭐ C1</span>
                </div>
                <div className="text-center font-display text-[10px] font-black text-jaune lg:text-xs">
                    <span className="lg:hidden">C3</span>
                    <span className="hidden lg:inline">🎖️ C3</span>
                </div>
                <div className="text-center font-display text-[10px] font-black text-violet-clair lg:text-xs">
                    <span className="lg:hidden">C4</span>
                    <span className="hidden lg:inline">🍐 C4</span>
                </div>
                <div className="text-center text-[9px] font-bold text-texte-2 lg:text-[10px] lg:uppercase lg:tracking-[1.5px]">
                    <span className="lg:hidden">TOT</span>
                    <span className="hidden lg:inline">Total</span>
                </div>
            </div>

            {/* Lignes */}
            {rows.map((r, i) => {
                const rs = rankStyles[i];
                return (
                    <div
                        key={r.managerId}
                        className={`grid ${GRID} items-center gap-[5px] border-b border-carte-2 px-[15px] py-[9px] transition hover:bg-carte-2/40 lg:gap-[14px] lg:px-[26px] lg:py-[14px]`}
                    >
                        <div
                            className="grid size-[22px] place-items-center rounded-[7px] font-display text-[11px] font-black lg:size-9 lg:rounded-[11px] lg:text-base"
                            style={
                                rs
                                    ? { background: rs.bg, color: rs.color }
                                    : { background: "var(--color-carte-2)", color: "var(--color-texte-2)" }
                            }
                        >
                            {i + 1}
                        </div>
                        <div className="flex min-w-0 items-center gap-2 lg:gap-[13px]">
                            <div className="grid size-[26px] shrink-0 place-items-center rounded-lg border border-bord bg-carte-2 font-display text-[9px] font-black text-[#9aa3d4] lg:size-[42px] lg:rounded-xl lg:text-[15px]">
                                {initials(r.manager)}
                            </div>
                            <Link
                                to={`/profil/${r.managerId}`}
                                className="inline-flex min-w-0 items-baseline gap-1.5 hover:underline"
                            >
                                <span className="truncate font-display text-xs font-extrabold text-white lg:text-base">
                                    {r.manager}
                                </span>
                                {r.username && (
                                    <span className="shrink-0 text-[10px] font-medium text-texte-2 lg:text-xs">
                                        {r.username}
                                    </span>
                                )}
                            </Link>
                        </div>
                        <div
                            className="text-center font-display text-[13px] font-black text-menthe lg:text-[19px]"
                            style={{ opacity: r.ldc ? 1 : 0.22 }}
                        >
                            {r.ldc}
                        </div>
                        <div
                            className="text-center font-display text-[13px] font-black text-jaune lg:text-[19px]"
                            style={{ opacity: r.uefa ? 1 : 0.22 }}
                        >
                            {r.uefa}
                        </div>
                        <div
                            className="text-center font-display text-[13px] font-black text-violet-clair lg:text-[19px]"
                            style={{ opacity: r.conference ? 1 : 0.22 }}
                        >
                            {r.conference}
                        </div>
                        <div className="text-center font-display text-[13px] font-black text-white lg:text-[19px]">
                            {r.total}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
