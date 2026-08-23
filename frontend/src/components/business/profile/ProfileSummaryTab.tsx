import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { CareerFactsCard } from "@/components/business/profile/CareerFactsCard";
import type { TimelineSeason } from "@/components/business/profile/types";
import { initials, playerGradient } from "@/components/business/stats/playerStyle";
import type { FormMatch, H2H, OppRow } from "@/components/business/stats/types";
import { Empty } from "@/components/ui/Empty";

/** Couleurs et libellés d'un résultat vu du manager (V / N / D). */
const RESULT = {
    W: { label: "V", word: "victoire", c: "#00E5A0", bg: "rgba(0,229,160,.18)" },
    D: { label: "N", word: "nul", c: "#8B92C4", bg: "rgba(139,146,196,.18)" },
    L: { label: "D", word: "défaite", c: "#FF6B8A", bg: "rgba(255,59,92,.18)" },
} as const;

/** Sous-titre de la card « Série en cours » : série en cours, ou dernier match + dernière victoire. */
function StreakSub({ h }: { h: H2H }) {
    if (!h.lastMatch) return <>Aucun match joué</>;
    if (h.currentWinStreak > 0) {
        return (
            <>
                <div>victoire{h.currentWinStreak > 1 ? "s" : ""} d'affilée</div>
                {h.streakSince && (
                    <div className="mt-0.5">
                        depuis la J{h.streakSince.gameWeek} · {h.streakSince.gameSeason} · {h.streakSince.realSeason}
                    </div>
                )}
            </>
        );
    }
    const last = h.lastMatch;
    return (
        <>
            <div>
                Dernier : {RESULT[last.result].word} {last.score}
                {last.opponent ? ` vs ${last.opponent}` : ""}
            </div>
            <div className="mt-0.5">
                {h.lastWin
                    ? `Dernière victoire : J${h.lastWin.gameWeek} · ${h.lastWin.gameSeason} · ${h.lastWin.realSeason}`
                    : "Aucune victoire"}
            </div>
        </>
    );
}

function CardShell({
    accent,
    icon,
    tag,
    tagColor,
    children,
}: {
    accent: string;
    icon: string;
    tag: string;
    tagColor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="lhm-card relative overflow-hidden rounded-[18px] border border-bord bg-carte">
            <div className="h-1" style={{ background: accent }} />
            <div className="p-4 lg:p-5">
                <div className="mb-3 flex items-center gap-2 lg:mb-4">
                    <span className="text-[15px] leading-none lg:text-[17px]">{icon}</span>
                    <span
                        className="font-display text-[10px] font-extrabold uppercase tracking-[1.5px]"
                        style={{ color: tagColor }}
                    >
                        {tag}
                    </span>
                </div>
                {children}
            </div>
        </div>
    );
}

function RivalCard({
    accent,
    icon,
    tag,
    opp,
    sub,
}: {
    accent: string;
    icon: string;
    tag: string;
    opp: OppRow;
    sub: string;
}) {
    const g = playerGradient(opp.opponentId || opp.manager);
    const stat = `${opp.w}V · ${opp.d}N · ${opp.l}D`;
    return (
        <CardShell accent={accent} icon={icon} tag={tag} tagColor={accent}>
            <div className="flex items-center gap-3">
                <div
                    className="grid size-[46px] shrink-0 place-items-center rounded-[13px] font-display text-base font-black"
                    style={{ background: g.grad, color: g.txt }}
                >
                    {initials(opp.manager)}
                </div>
                <div className="min-w-0 flex-1">
                    <Link
                        to={`/profil/${opp.opponentId}`}
                        className="block truncate font-display text-lg font-black tracking-[-0.3px] text-white hover:underline"
                    >
                        {opp.manager}
                    </Link>
                    <div className="mt-0.5 text-[11px] text-texte-2 lg:hidden">{sub}</div>
                </div>
                <div
                    className="shrink-0 whitespace-nowrap font-display text-base font-black lg:hidden"
                    style={{ color: accent }}
                >
                    {stat}
                </div>
            </div>
            {/* Desktop : stat + sous-titre empilés sous l'identité */}
            <div className="mt-3.5 hidden lg:block">
                <div className="font-display text-[22px] font-black" style={{ color: accent }}>
                    {stat}
                </div>
                <div className="mt-1.5 text-[11px] text-texte-2">{sub}</div>
            </div>
        </CardShell>
    );
}

function MetricCard({
    accent,
    icon,
    tag,
    value,
    sub,
    soon,
}: {
    accent: string;
    icon: string;
    tag: string;
    value: string;
    sub: React.ReactNode;
    soon?: boolean;
}) {
    return (
        <CardShell
            accent={soon ? "var(--color-bord)" : accent}
            icon={icon}
            tag={tag}
            tagColor={soon ? "#8B92C4" : accent}
        >
            <div className="font-display text-4xl font-black leading-none" style={{ color: soon ? "#8B92C4" : accent }}>
                {value}
            </div>
            <div className="mt-2 text-xs text-texte-2">{sub}</div>
        </CardShell>
    );
}

function DonutCard({ w, d, l }: { w: number; d: number; l: number }) {
    const total = w + d + l || 1;
    const wp = Math.round((w / total) * 100);
    const dp = Math.round((d / total) * 100);
    const lp = 100 - wp - dp;
    const legend = [
        { dot: "#00E5A0", label: "Victoires", val: wp, n: w },
        { dot: "#8B92C4", label: "Nuls", val: dp, n: d },
        { dot: "#FF3B5C", label: "Défaites", val: lp, n: l },
    ];
    return (
        <div className="lhm-card flex items-center gap-4 rounded-[18px] border border-bord bg-carte p-4 lg:gap-5 lg:p-5">
            <div className="relative size-[124px] shrink-0">
                <div
                    className="size-full rounded-full"
                    style={{
                        background: `conic-gradient(#00E5A0 0 ${wp}%, #8B92C4 ${wp}% ${wp + dp}%, #FF3B5C ${wp + dp}% 100%)`,
                    }}
                />
                <div className="absolute inset-[18px] grid place-items-center rounded-full bg-carte text-center">
                    <div>
                        <div className="font-display text-2xl font-black text-menthe">{wp}%</div>
                        <div className="text-[10px] text-texte-2">victoires</div>
                    </div>
                </div>
            </div>
            <div className="min-w-0 flex-1">
                <div className="mb-3 font-display text-[10px] font-extrabold uppercase tracking-[1.5px] text-texte-2">
                    Taux de victoire
                </div>
                {legend.map((x) => (
                    <div key={x.label} className="mb-2 flex items-center gap-2.5">
                        <span className="size-[9px] shrink-0 rounded-full" style={{ background: x.dot }} />
                        <span className="flex-1 truncate text-xs text-[#C7CEEF]">
                            {x.label} <span className="text-texte-2">· {x.n}</span>
                        </span>
                        <span className="font-display text-sm font-black" style={{ color: x.dot }}>
                            {x.val}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FormCard({ form }: { form: FormMatch[] }) {
    return (
        <div className="lhm-card rounded-[18px] border border-bord bg-carte p-4 lg:p-5">
            <div className="mb-3 font-display text-[10px] font-extrabold uppercase tracking-[1.5px] text-texte-2">
                5 derniers matchs · forme
            </div>
            {form.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-bord bg-nuit/40 px-4 py-5 text-sm text-texte-2">
                    ⏳ Pas encore de match joué.
                </div>
            ) : (
                <div className="flex gap-1.5 lg:gap-2">
                    {form.map((m) => {
                        const r = RESULT[m.result];
                        return (
                            <div
                                key={`${m.context}-${m.gameWeek}`}
                                className="flex flex-1 flex-col items-center gap-1.5"
                                title={`J${m.gameWeek} · ${m.score}${m.opponent ? ` vs ${m.opponent}` : ""} · ${m.context}`}
                            >
                                <span
                                    className="grid h-[34px] w-full place-items-center rounded-lg font-display text-[13px] font-black lg:h-[46px] lg:text-base"
                                    style={{ background: r.bg, color: r.c }}
                                >
                                    {r.label}
                                </span>
                                <span className="text-[9px] text-texte-2 lg:text-[10px]">{m.score}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function ProfileSummaryTab({ managerId }: { managerId: string }) {
    const { data: h } = useQuery({
        queryKey: ["h2h", managerId],
        queryFn: () => api<H2H>(`/api/palmares/h2h/${managerId}`),
    });
    const { data: tl } = useQuery({
        queryKey: ["timeline", managerId],
        queryFn: () => api<{ seasons: TimelineSeason[] }>(`/api/palmares/timeline/${managerId}`),
    });

    if (!h) return null;
    if (h.overall.played === 0) {
        return (
            <div className="space-y-3 lg:space-y-[18px]">
                <Empty>Pas encore de match enregistré.</Empty>
                <CareerFactsCard seasons={tl?.seasons ?? []} />
            </div>
        );
    }

    // Série de victoires : verte tant qu'elle court, sinon on prend la couleur du dernier résultat.
    const streakAccent = h.currentWinStreak > 0 ? RESULT.W.c : h.lastMatch ? RESULT[h.lastMatch.result].c : "#FF6B35";
    const last = tl?.seasons.at(-1);
    const lastValue = last ? (last.finalRank === 1 ? "Champion" : last.finalRank ? `${last.finalRank}e` : "—") : "—";
    const lastSub = last ? `${last.division} · ${last.realSeason}` : "Saison à venir";

    return (
        <div className="space-y-3 lg:space-y-[18px]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[18px]">
                {h.beteNoire && (
                    <RivalCard
                        accent="#FF3B5C"
                        icon="🐐"
                        tag="Bête noire"
                        opp={h.beteNoire}
                        sub="Ton bilan le plus négatif"
                    />
                )}
                {h.victimePreferee && (
                    <RivalCard
                        accent="#00E5A0"
                        icon="💚"
                        tag="Victime préférée"
                        opp={h.victimePreferee}
                        sub="Ton meilleur bilan"
                    />
                )}
                <MetricCard
                    accent={streakAccent}
                    icon="🔥"
                    tag="Série en cours"
                    value={h.lastMatch ? String(h.currentWinStreak) : "—"}
                    sub={<StreakSub h={h} />}
                    soon={!h.lastMatch}
                />
                <MetricCard accent="#FFD23F" icon="🏆" tag="Dernière saison" value={lastValue} sub={lastSub} />
            </div>

            <div className="grid gap-3 lg:grid-cols-2 lg:gap-[18px]">
                <DonutCard w={h.overall.w} d={h.overall.d} l={h.overall.l} />
                <FormCard form={h.form} />
            </div>

            <CareerFactsCard seasons={tl?.seasons ?? []} />
        </div>
    );
}
