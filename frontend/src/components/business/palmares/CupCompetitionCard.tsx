import { Link } from "react-router-dom";
import type { CupRow } from "@/components/business/palmares/types";

type Comp = "LDC" | "UEFA" | "CONFERENCE";

/** Style et libellés par compétition de coupe (⭐ C1 · 🎖️ C3 · 🍐 C4). */
const COMP: Record<
    Comp,
    { icon: string; rgb: string; accent: string; tile: string; tileTxt: string; subtitle: string }
> = {
    LDC: {
        icon: "⭐",
        rgb: "0,229,160",
        accent: "#00E5A0",
        tile: "linear-gradient(135deg,#00E5A0,#34D399)",
        tileTxt: "#06251A",
        subtitle: "LDC · C1",
    },
    UEFA: {
        icon: "🎖️",
        rgb: "255,210,63",
        accent: "#FFD23F",
        tile: "linear-gradient(135deg,#FFD23F,#FF6B35)",
        tileTxt: "#3D2E00",
        subtitle: "Europa · C3",
    },
    CONFERENCE: {
        icon: "🍐",
        rgb: "167,139,250",
        accent: "#A78BFA",
        tile: "linear-gradient(135deg,#6D28D9,#A78BFA)",
        tileTxt: "#ffffff",
        subtitle: "Conférence · C4",
    },
};

function initials(name?: string | null) {
    if (!name) return "—";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

/** Carte d'une compétition de coupe : tenant du titre mis en avant + palmarès. */
export function CupCompetitionCard({
    competition,
    title,
    rows = [],
}: {
    competition: Comp;
    title: string;
    rows?: CupRow[];
}) {
    const s = COMP[competition];
    const tenant = rows[0];
    const past = rows.slice(1);
    const glow = `0 0 0 1px rgba(${s.rgb},.55), 0 12px 34px rgba(${s.rgb},.28)`;

    return (
        <div
            className="lhm-card relative overflow-hidden rounded-[18px] border bg-carte lg:rounded-[20px]"
            style={{ borderColor: `rgba(${s.rgb},.35)` }}
        >
            <div className="h-1 lg:h-[5px]" style={{ background: s.accent }} />
            <div className="p-4 lg:p-[22px]">
                {/* En-tête */}
                <div className="mb-[14px] flex items-center gap-3 lg:mb-[18px] lg:gap-[13px]">
                    <div
                        className="grid size-[46px] shrink-0 place-items-center rounded-[14px] border text-[22px] lg:size-14 lg:rounded-2xl lg:text-[28px]"
                        style={{
                            background: `radial-gradient(circle at 50% 35%, rgba(${s.rgb},.35), rgba(${s.rgb},.05))`,
                            borderColor: `rgba(${s.rgb},.4)`,
                        }}
                    >
                        {s.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-display text-base font-black leading-[1.05] text-white lg:text-[19px]">
                            {title}
                        </div>
                        <div
                            className="mt-0.5 text-[11px] font-semibold lg:mt-[3px] lg:text-xs"
                            style={{ color: s.accent }}
                        >
                            {s.subtitle}
                        </div>
                    </div>
                    <div className="shrink-0 text-center lg:hidden">
                        <div className="font-display text-xl font-black leading-none" style={{ color: s.accent }}>
                            {rows.length}
                        </div>
                        <div className="text-[8px] font-bold uppercase tracking-[0.5px] text-texte-2">Sacres</div>
                    </div>
                </div>

                {/* Tenant du titre */}
                {tenant && (
                    <div
                        className="lhm-row mb-2 flex items-center gap-3 rounded-[13px] border p-3 lg:mb-2.5 lg:gap-[13px] lg:rounded-[14px] lg:p-[15px]"
                        style={{
                            background: `linear-gradient(100deg, rgba(${s.rgb},.16), rgba(${s.rgb},.02))`,
                            borderColor: `rgba(${s.rgb},.45)`,
                            boxShadow: glow,
                        }}
                    >
                        <div
                            className="grid size-[42px] shrink-0 place-items-center rounded-xl font-display text-[15px] font-black lg:size-12 lg:rounded-[13px] lg:text-[17px]"
                            style={{ background: s.tile, color: s.tileTxt }}
                        >
                            {initials(tenant.winner)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5">
                                {tenant.winnerManagerId ? (
                                    <Link
                                        to={`/profil/${tenant.winnerManagerId}`}
                                        className="truncate font-display text-[15px] font-black text-white hover:underline lg:text-[17px]"
                                    >
                                        {tenant.winner ?? "—"}
                                    </Link>
                                ) : (
                                    <span className="truncate font-display text-[15px] font-black text-white lg:text-[17px]">
                                        {tenant.winner ?? "—"}
                                    </span>
                                )}
                                {tenant.username && (
                                    <span className="shrink-0 text-[11px] font-medium text-texte-2">
                                        {tenant.username}
                                    </span>
                                )}
                            </div>
                            <div
                                className="mt-0.5 font-display text-[10px] font-bold uppercase tracking-[1px] lg:mt-[3px]"
                                style={{ color: s.accent }}
                            >
                                Tenant du titre<span className="hidden lg:inline"> · {tenant.year}</span>
                            </div>
                        </div>
                        <div className="shrink-0 text-right">
                            <div className="text-[18px] leading-none lg:text-2xl">🏆</div>
                            <div className="mt-0.5 font-display text-[13px] font-black text-white lg:hidden">
                                {tenant.year}
                            </div>
                        </div>
                    </div>
                )}

                {/* Palmarès (anciens vainqueurs) */}
                {past.map((c) => (
                    <div
                        key={c.id}
                        className="lhm-row mb-[7px] flex items-center gap-[11px] rounded-xl border border-bord bg-nuit px-3 py-[9px] last:mb-0 lg:mb-[9px] lg:gap-3 lg:rounded-[13px] lg:px-[14px] lg:py-3"
                    >
                        <div className="grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-bord bg-carte-2 font-display text-xs font-black text-[#9aa3d4] lg:size-10 lg:rounded-[11px] lg:text-[13px]">
                            {initials(c.winner)}
                        </div>
                        <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                            {c.winnerManagerId ? (
                                <Link
                                    to={`/profil/${c.winnerManagerId}`}
                                    className="truncate font-display text-[13px] font-extrabold text-white hover:underline lg:text-sm"
                                >
                                    {c.winner ?? "—"}
                                </Link>
                            ) : (
                                <span className="truncate font-display text-[13px] font-extrabold text-white lg:text-sm">
                                    {c.winner ?? "—"}
                                </span>
                            )}
                            {c.username && (
                                <span className="shrink-0 text-[11px] font-medium text-texte-2">{c.username}</span>
                            )}
                        </div>
                        <span className="shrink-0 font-display text-xs font-black text-texte-2 lg:text-sm">
                            {c.year}
                        </span>
                    </div>
                ))}

                {!rows.length && <p className="text-sm text-texte-2">Pas encore de données.</p>}
            </div>
        </div>
    );
}
