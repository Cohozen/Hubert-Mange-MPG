import { Link } from "react-router-dom";
import { accueilMock } from "./mockData";

/** Résumé du palmarès : coupes d'Europe + championnats par division (factice). */
export function PalmaresSummaryCard() {
    const p = accueilMock.palmares;
    return (
        <div
            className="lhm-card relative h-full overflow-hidden rounded-[18px] border border-bord"
            style={{ background: "linear-gradient(160deg,#1b2350,#141a3d)" }}
        >
            {/* Bandeau */}
            <div className="flex items-center justify-between px-[18px] py-3.5 grad-banner">
                <div className="font-display text-base font-black uppercase tracking-wide text-white">🏆 Palmarès</div>
                <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[22px] font-black leading-none text-white">{p.trophies}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/90">Trophées</span>
                </div>
            </div>

            <div className="p-[18px]">
                <div className="mb-3 font-display text-[10px] font-extrabold uppercase tracking-wider text-texte-2">
                    Coupes d'Europe
                </div>
                <div className="mb-6 grid grid-cols-3 gap-2.5">
                    {p.cups.map((c) => (
                        <div
                            key={c.code}
                            className="relative overflow-hidden rounded-2xl border bg-nuit px-1.5 py-3.5 text-center"
                            style={{ borderColor: `color-mix(in srgb, ${c.color} 40%, transparent)` }}
                        >
                            <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: c.color }} />
                            <div className="mx-auto mb-1.5 grid size-10 place-items-center text-xl">{c.icon}</div>
                            <div
                                className="font-display text-[22px] font-black leading-none"
                                style={{ color: c.color }}
                            >
                                ×{c.count}
                            </div>
                            <div className="mt-1 font-display text-[11px] font-black tracking-wide text-white">
                                {c.label}
                            </div>
                            <div className="mt-0.5 text-[9px] text-texte-2">{c.years}</div>
                        </div>
                    ))}
                </div>

                <div className="mb-3 font-display text-[10px] font-extrabold uppercase tracking-wider text-texte-2">
                    Championnats · par division
                </div>
                <div className="flex flex-col gap-2.5">
                    {p.divisions.map((d) => (
                        <div
                            key={d.code}
                            className="relative flex items-center gap-3 overflow-hidden rounded-[13px] border border-bord bg-nuit px-3.5 py-3"
                        >
                            <div className="absolute inset-y-0 left-0 w-1" style={{ background: d.accent }} />
                            <div
                                className="grid size-9 place-items-center rounded-xl font-display text-sm font-black text-white"
                                style={{ background: `color-mix(in srgb, ${d.accent} 30%, var(--color-carte-2))` }}
                            >
                                {d.code}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-display text-[13px] font-black text-white">{d.title}</div>
                                <div className="text-[10px] font-semibold" style={{ color: d.accent }}>
                                    {d.note}
                                </div>
                            </div>
                            <div className="text-right">
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
