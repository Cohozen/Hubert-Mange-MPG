import { Link } from "react-router-dom";
import type { DashboardPalmares } from "@/components/business/accueil/types";
import { shortYears } from "@/components/business/accueil/types";
import { divisionStyle } from "@/components/business/stats/playerStyle";

const CUPS = [
    { key: "ldc", label: "LDC", icon: "⭐", color: "var(--color-menthe)" },
    { key: "uefa", label: "EUROPA", icon: "🎖️", color: "var(--color-jaune)" },
    { key: "conference", label: "CONF.", icon: "🍐", color: "var(--color-violet-clair)" },
] as const;

/** Résumé du palmarès du manager : coupes d'Europe et titres par division. */
export function PalmaresSummaryCard({ palmares }: { palmares: DashboardPalmares }) {
    const rows = palmares.titlesByLevel.map((t) => ({
        code: `D${t.level}`,
        title: t.level === 1 ? "Division 1 · Élite" : `Division ${t.level}`,
        note: t.years.length ? [...new Set(t.years)].join(" · ") : "",
        value: `×${t.count}`,
        valueLabel: t.count > 1 ? "Titres" : "Titre",
        accent: divisionStyle(t.level).c,
    }));
    if (palmares.firstLevel) {
        rows.push({
            code: `D${palmares.firstLevel}`,
            title: `Division ${palmares.firstLevel}`,
            note: "Division de départ",
            value: String(palmares.firstYear ?? "—"),
            valueLabel: "Début",
            accent: divisionStyle(palmares.firstLevel).c,
        });
    }

    return (
        <div
            className="lhm-card relative h-full overflow-hidden rounded-[18px] border border-bord"
            style={{ background: "linear-gradient(160deg,#1b2350,#141a3d)" }}
        >
            <div className="flex items-center justify-between px-[18px] py-3.5 grad-banner">
                <div className="font-display text-base font-black uppercase tracking-wide text-white">🏆 Palmarès</div>
                <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[22px] font-black leading-none text-white">
                        {palmares.trophies}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/90">
                        {palmares.trophies > 1 ? "Trophées" : "Trophée"}
                    </span>
                </div>
            </div>

            <div className="p-[18px]">
                <div className="mb-3 font-display text-[10px] font-extrabold uppercase tracking-wider text-texte-2">
                    Coupes d'Europe
                </div>
                <div className="mb-6 grid grid-cols-3 gap-2.5">
                    {CUPS.map((c) => {
                        const cup = palmares.cups[c.key];
                        const won = cup.count > 0;
                        return (
                            <div
                                key={c.key}
                                className={`relative overflow-hidden rounded-2xl border bg-nuit px-1.5 py-3.5 text-center ${won ? "" : "opacity-45"}`}
                                style={{ borderColor: `color-mix(in srgb, ${c.color} 40%, transparent)` }}
                            >
                                <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: c.color }} />
                                <div className="mx-auto mb-1.5 grid size-10 place-items-center text-xl">{c.icon}</div>
                                <div
                                    className="font-display text-[22px] font-black leading-none"
                                    style={{ color: c.color }}
                                >
                                    ×{cup.count}
                                </div>
                                <div className="mt-1 font-display text-[11px] font-black tracking-wide text-white">
                                    {c.label}
                                </div>
                                <div className="mt-0.5 text-[9px] text-texte-2">{shortYears(cup.years)}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="mb-3 font-display text-[10px] font-extrabold uppercase tracking-wider text-texte-2">
                    Championnats · par division
                </div>
                <div className="flex flex-col gap-2.5">
                    {rows.map((d) => (
                        <div
                            key={`${d.code}-${d.valueLabel}`}
                            className="relative flex items-center gap-3 overflow-hidden rounded-[13px] border border-bord bg-nuit px-3.5 py-3"
                        >
                            <div className="absolute inset-y-0 left-0 w-1" style={{ background: d.accent }} />
                            <div
                                className="grid size-9 shrink-0 place-items-center rounded-xl font-display text-sm font-black text-white"
                                style={{ background: `color-mix(in srgb, ${d.accent} 30%, var(--color-carte-2))` }}
                            >
                                {d.code}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-display text-[13px] font-black text-white">{d.title}</div>
                                <div className="truncate text-[10px] font-semibold" style={{ color: d.accent }}>
                                    {d.note}
                                </div>
                            </div>
                            <div className="shrink-0 text-right">
                                <div
                                    className="font-display text-xl font-black leading-none"
                                    style={{ color: d.accent }}
                                >
                                    {d.value}
                                </div>
                                <div className="text-[8px] font-bold uppercase tracking-wide text-texte-2">
                                    {d.valueLabel}
                                </div>
                            </div>
                        </div>
                    ))}
                    {rows.length === 0 && (
                        <div className="rounded-[13px] border border-dashed border-bord px-3.5 py-4 text-center text-xs text-texte-2">
                            Pas encore de titre. Ça viendra. 💪
                        </div>
                    )}
                </div>

                <Link
                    to="/profil"
                    className="mt-4 inline-flex items-center gap-2 font-display text-[13px] font-black uppercase tracking-wide text-orange transition hover:gap-3"
                >
                    Voir mon profil complet →
                </Link>
            </div>
        </div>
    );
}
