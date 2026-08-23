import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { CareerChart } from "@/components/business/profile/CareerChart";
import type { TimelineSeason } from "@/components/business/profile/types";
import type { H2H } from "@/components/business/stats/types";
import { Empty } from "@/components/ui/Empty";

const sum = (xs: (number | null)[]): number => xs.reduce<number>((a, b) => a + (b ?? 0), 0);
const fmt1 = (n: number) => n.toFixed(2).replace(".", ",");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h3 className="mb-3 font-display text-[13px] font-black uppercase tracking-[1px] text-texte-2 lg:text-sm lg:tracking-[0.5px] lg:text-white">
                {title}
            </h3>
            {children}
        </section>
    );
}

function RecordCard({
    icon,
    value,
    label,
    sub,
    color,
    soon,
}: {
    icon: string;
    value: string;
    label: string;
    sub: string;
    color: string;
    soon?: boolean;
}) {
    return (
        <div className="lhm-card rounded-2xl border border-bord bg-carte p-[15px] lg:p-[18px]">
            <div className="mb-2 text-lg lg:mb-2.5 lg:text-xl">{icon}</div>
            <div
                className="font-display text-[30px] font-black leading-[0.95] lg:text-4xl"
                style={{ color: soon ? "#8B92C4" : color }}
            >
                {value}
            </div>
            <div className="mt-1.5 font-display text-xs font-extrabold text-white lg:mt-2 lg:text-[13px]">{label}</div>
            <div className="mt-0.5 text-[10px] text-texte-2">{sub}</div>
        </div>
    );
}

function SeasonCard({
    accent,
    tag,
    icon,
    pts,
    sub,
}: {
    accent: string;
    tag: string;
    icon: string;
    pts: number;
    sub: string;
}) {
    return (
        <div className="lhm-card overflow-hidden rounded-2xl border bg-carte" style={{ borderColor: `${accent}66` }}>
            <div className="h-[3px] lg:h-1" style={{ background: accent }} />
            <div className="p-[15px] lg:p-5">
                <div className="mb-2.5 flex items-center gap-2 lg:mb-3.5">
                    <span className="text-lg">{icon}</span>
                    <span
                        className="font-display text-[10px] font-extrabold uppercase tracking-[1px] lg:tracking-[1.5px]"
                        style={{ color: accent }}
                    >
                        {tag}
                    </span>
                </div>
                <div
                    className="font-display text-[30px] font-black leading-[0.95] lg:text-[46px]"
                    style={{ color: accent }}
                >
                    {pts}
                    <span className="ml-1 text-sm opacity-70 lg:text-xl">pts</span>
                </div>
                <div className="mt-1.5 text-[10px] leading-[1.4] text-texte-2 lg:mt-3 lg:text-xs">{sub}</div>
            </div>
        </div>
    );
}

export function ProfileStatsTab({ managerId }: { managerId: string }) {
    const { data } = useQuery({
        queryKey: ["timeline", managerId],
        queryFn: () => api<{ seasons: TimelineSeason[] }>(`/api/palmares/timeline/${managerId}`),
    });
    // Même clé que l'onglet Résumé : servi par le cache si le Résumé a déjà été ouvert.
    const { data: h } = useQuery({
        queryKey: ["h2h", managerId],
        queryFn: () => api<H2H>(`/api/palmares/h2h/${managerId}`),
    });

    if (!data || !h) return null;
    const { seasons } = data;
    if (seasons.length === 0) return <Empty>Pas encore de saison jouée.</Empty>;

    let relegations = 0;
    for (let i = 1; i < seasons.length; i++) if (seasons[i].level > seasons[i - 1].level) relegations++;

    const played = sum(seasons.map((s) => s.played));
    const won = sum(seasons.map((s) => s.won));
    const goalsFor = sum(seasons.map((s) => s.goalsFor));
    const goalsAgainst = sum(seasons.map((s) => s.goalsAgainst));
    const winPct = played ? Math.round((won / played) * 100) : 0;
    // Même règle que le palmarès : le rang d'une saison en cours n'est que provisoire.
    const titles = seasons.filter((s) => s.finalRank === 1 && s.status === "finished").length;

    // Meilleure / pire saison : uniquement sur des saisons closes — celle qui vient de démarrer
    // est à 0 point et passerait pour la pire de la carrière.
    const withPts = seasons.filter((s) => s.points != null && s.status === "finished");
    const best = withPts.length ? withPts.reduce((a, b) => ((b.points ?? 0) > (a.points ?? 0) ? b : a)) : null;
    const worst = withPts.length ? withPts.reduce((a, b) => ((b.points ?? 0) < (a.points ?? 0) ? b : a)) : null;
    const seasonSub = (s: TimelineSeason | null) =>
        s ? `${s.division} · ${s.realSeason}${s.finalRank === 1 && s.status === "finished" ? " · 🏆" : ""}` : "";

    const records = [
        {
            icon: "⚽",
            value: String(played),
            label: "Matchs joués",
            sub: `depuis ${seasons[0].year}`,
            color: "#ffffff",
        },
        { icon: "🏆", value: String(won), label: "Victoires", sub: `${winPct}% de réussite`, color: "#00E5A0" },
        {
            icon: "🥅",
            value: String(goalsFor),
            label: "Buts marqués",
            sub: `${played ? fmt1(goalsFor / played) : "0"} / match`,
            color: "#FFD23F",
        },
        {
            icon: "🔥",
            value: String(h.bestWinStreak),
            label: "Meilleure série",
            sub: "victoires d'affilée",
            color: "#FF6B35",
        },
        {
            icon: "🏅",
            value: String(titles),
            label: "Titres de saison",
            sub: "1re place en division",
            color: "#FF2D78",
        },
        {
            icon: "🛡️",
            value: String(relegations),
            label: relegations > 1 ? "Relégations" : "Relégation",
            sub: `sur ${seasons.length} saisons`,
            color: "#A78BFA",
        },
    ];

    return (
        <div className="space-y-5 lg:space-y-6">
            <Section title="Frise de carrière">
                <CareerChart seasons={seasons} />
            </Section>

            <Section title="Records personnels">
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-3.5">
                    {records.map((r) => (
                        <RecordCard key={r.label} {...r} />
                    ))}
                </div>
            </Section>

            <Section title="Bilan par saison">
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-4">
                    <SeasonCard
                        accent="#00E5A0"
                        tag="Meilleure saison"
                        icon="📈"
                        pts={best?.points ?? 0}
                        sub={seasonSub(best)}
                    />
                    <SeasonCard
                        accent="#FF3B5C"
                        tag="Pire saison"
                        icon="📉"
                        pts={worst?.points ?? 0}
                        sub={seasonSub(worst)}
                    />
                    <div className="lhm-card col-span-2 flex items-center gap-3.5 overflow-hidden rounded-2xl border border-bord bg-carte p-[15px] lg:col-span-1 lg:p-5">
                        <span className="text-xl lg:text-2xl">🥅</span>
                        <div className="min-w-0 flex-1">
                            <div className="font-display text-xs font-extrabold text-white lg:text-sm">
                                Buts encaissés
                            </div>
                            <div className="mt-0.5 text-[10px] text-texte-2">
                                {played ? fmt1(goalsAgainst / played) : "0"} / match ·{" "}
                                {goalsFor - goalsAgainst > 0 ? "+" : ""}
                                {goalsFor - goalsAgainst} de diff.
                            </div>
                        </div>
                        <div className="font-display text-[30px] font-black leading-none text-violet-clair">
                            {goalsAgainst}
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    );
}
