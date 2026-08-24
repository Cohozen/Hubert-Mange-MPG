import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { HubertBookCard } from "@/components/business/stats/HubertBookCard";
import { RankingPodiumCard } from "@/components/business/stats/RankingPodiumCard";
import { RankingRestList } from "@/components/business/stats/RankingRestList";
import { StatsInfoDialog } from "@/components/business/stats/StatsInfoDialog";
import type { AllTimeRow, CupCount, FunStats, RankingEntry, RankRow } from "@/components/business/stats/types";
import { Empty } from "@/components/ui/Empty";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loader } from "@/components/ui/Loader";
import { PillTabs } from "@/components/ui/PillTabs";
import { useTabParam } from "@/lib/useTabParam";

type Tab = "classement" | "fun";
const TABS: Tab[] = ["classement", "fun"];

export default function StatsPage() {
    const { data: me } = useAuth();
    const [tab, setTab] = useTabParam<Tab>("tab", "classement", TABS);

    const allTime = useQuery({
        queryKey: ["all-time"],
        queryFn: () => api<{ ranking: AllTimeRow[]; maxLevel: number }>("/api/palmares/all-time"),
    });
    const fun = useQuery({ queryKey: ["fun-stats"], queryFn: () => api<FunStats>("/api/palmares/fun-stats") });
    const cups = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ ranking: CupCount[] }>("/api/palmares/tournaments"),
    });

    const cupsBy = new Map((cups.data?.ranking ?? []).map((c) => [c.managerId, c]));
    const entries: RankingEntry[] = (allTime.data?.ranking ?? []).map((r) => {
        const c = cupsBy.get(r.managerId);
        const cupCounts = { ldc: c?.ldc ?? 0, uefa: c?.uefa ?? 0, conference: c?.conference ?? 0 };
        const coupes = c?.total ?? 0;
        return {
            managerId: r.managerId,
            manager: r.manager,
            username: r.username,
            rank: r.rank,
            titles: r.titles,
            cups: cupCounts,
            titres: r.totalTitles,
            coupes,
            total: r.totalTitles + coupes,
            seasonsPlayed: r.seasonsPlayed,
        };
    });
    const podium = entries.slice(0, 3);
    const rest = entries.slice(3);

    const records: { icon: string; title: string; subtitle: string; unit: string; color: string; rows?: RankRow[] }[] =
        [
            {
                icon: "🐐",
                title: "Bouc émissaire",
                subtitle: "Le plus de malus subis",
                unit: "malus",
                color: "#FF6B35",
                rows: fun.data?.scapeGoat,
            },
            {
                icon: "🥅",
                title: "La passoire",
                subtitle: "Le plus de buts encaissés",
                unit: "BC",
                color: "#FF3B5C",
                rows: fun.data?.worstDefense,
            },
            {
                icon: "⚽",
                title: "Meilleure attaque",
                subtitle: "Le plus de buts marqués",
                unit: "BP",
                color: "#00E5A0",
                rows: fun.data?.bestAttack,
            },
            {
                icon: "🎯",
                title: "Machine à points",
                subtitle: "Le plus de points cumulés",
                unit: "pts",
                color: "#FFD23F",
                rows: fun.data?.mostPoints,
            },
            {
                icon: "🏅",
                title: "Rotaldo d'Or",
                subtitle: "A possédé le meilleur joueur",
                unit: "×",
                color: "#A78BFA",
                rows: fun.data?.rotaldo,
            },
            {
                icon: "🌟",
                title: "La révélation",
                subtitle: "A possédé la plus grosse hausse de cote",
                unit: "×",
                color: "#FF2D78",
                rows: fun.data?.raisingStar,
            },
            {
                icon: "🏆",
                title: "Roi des podiums",
                subtitle: "Le plus de podiums (top 3)",
                unit: "",
                color: "#FFD23F",
                rows: fun.data?.podiums,
            },
            {
                icon: "🔥",
                title: "Série de titres",
                subtitle: "Titres consécutifs",
                unit: "",
                color: "#FF2D78",
                rows: fun.data?.titleStreak,
            },
            {
                icon: "🍸",
                title: "Le Jean-Claude Duss",
                subtitle: "Le plus de 2es places (du mal à conclure)",
                unit: "×",
                color: "#A78BFA",
                rows: fun.data?.jeanClaudeDuss,
            },
            {
                icon: "🏛️",
                title: "Pilier de l'élite",
                subtitle: "Le plus de saisons en D1",
                unit: "",
                color: "#FF2D78",
                rows: fun.data?.d1Seasons,
            },
            {
                icon: "🔒",
                title: "Indéboulonnable",
                subtitle: "Saisons consécutives en D1",
                unit: "",
                color: "#FF2D78",
                rows: fun.data?.d1Streak,
            },
        ];

    return (
        <div className="space-y-6">
            {/* Bannière */}
            <div
                className="relative overflow-hidden rounded-[18px] p-[18px] lg:rounded-[22px] lg:p-8"
                style={{ background: "linear-gradient(100deg,#6D28D9,#FF2D78,#FF6B35)" }}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{ background: "repeating-linear-gradient(115deg,#fff 0 2px, transparent 2px 24px)" }}
                />
                <div
                    className="pointer-events-none absolute -top-16 right-6 size-40 rounded-full lg:size-56"
                    style={{ background: "radial-gradient(circle, rgba(255,255,255,.22), transparent 70%)" }}
                />
                <div className="relative z-10 flex items-end justify-between gap-4">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[2px] text-white/85 lg:text-[11px]">
                            Le grand tableau d'affichage
                        </div>
                        <h1 className="mt-1.5 font-display text-[42px] font-black uppercase leading-[0.9] tracking-[-1.5px] text-white lg:text-[62px] lg:leading-[0.88] lg:tracking-[-2px]">
                            Rétro
                        </h1>
                        <p className="mt-2 max-w-[280px] text-xs leading-[1.4] text-white/90 lg:max-w-none lg:text-sm">
                            Classement all-time, records et chambrage officiel de la ligue · depuis 2023.
                        </p>
                    </div>
                    <StatsInfoDialog>
                        <button
                            type="button"
                            className="lhm-info flex shrink-0 items-center gap-2 rounded-full border border-white/50 bg-nuit/25 px-[18px] py-[11px] font-display text-xs font-black uppercase tracking-[0.5px] text-white transition hover:brightness-110 max-lg:hidden"
                        >
                            ℹ️ Méthode
                        </button>
                    </StatsInfoDialog>
                </div>
            </div>

            <PillTabs
                value={tab}
                onChange={setTab}
                width="mobile-full"
                items={[
                    { key: "classement", label: "🏆 Classement" },
                    { key: "fun", label: "📖 Le Hubert Book" },
                ]}
            />

            {allTime.isError || fun.isError || cups.isError || allTime.isPaused || fun.isPaused || cups.isPaused ? (
                <ErrorState
                    onRetry={() => {
                        allTime.refetch();
                        fun.refetch();
                        cups.refetch();
                    }}
                >
                    Impossible de charger la Rétro.
                </ErrorState>
            ) : allTime.isPending || fun.isPending || cups.isPending ? (
                <Loader />
            ) : tab === "classement" ? (
                entries.length ? (
                    <div className="space-y-6">
                        {/* Titre + méthode */}
                        <div className="flex items-center gap-2.5">
                            <h2 className="font-display text-[13px] font-black uppercase tracking-[1px] text-texte-2 lg:text-xl lg:tracking-[-0.3px] lg:normal-case lg:text-white">
                                <span className="lg:hidden">Classement all-time</span>
                                <span className="hidden lg:inline">Le podium all-time</span>
                            </h2>
                            <StatsInfoDialog>
                                <button
                                    type="button"
                                    className="lhm-info grid size-[22px] shrink-0 place-items-center rounded-full border border-bord bg-carte text-[11px] text-texte-2 transition hover:text-white lg:size-6"
                                >
                                    ℹ
                                </button>
                            </StatsInfoDialog>
                            <span className="hidden text-[13px] text-texte-2 lg:inline">
                                Trié par titres D1 → D6, puis par coupes (C1 · C3 · C4).
                            </span>
                        </div>

                        {/* Podium — mobile empilé */}
                        <div className="flex flex-col gap-[11px] lg:hidden">
                            {podium.map((e, i) => (
                                <RankingPodiumCard
                                    key={e.managerId}
                                    entry={e}
                                    rank={(i + 1) as 1 | 2 | 3}
                                    layout="row"
                                    isMe={e.managerId === me?.id}
                                />
                            ))}
                        </div>
                        {/* Podium — desktop : argent / or / bronze */}
                        {podium.length === 3 && (
                            <div className="hidden grid-cols-3 items-end gap-[18px] lg:grid">
                                <div className="pt-8">
                                    <RankingPodiumCard
                                        entry={podium[1]}
                                        rank={2}
                                        layout="column"
                                        isMe={podium[1].managerId === me?.id}
                                    />
                                </div>
                                <RankingPodiumCard
                                    entry={podium[0]}
                                    rank={1}
                                    layout="column"
                                    isMe={podium[0].managerId === me?.id}
                                />
                                <div className="pt-8">
                                    <RankingPodiumCard
                                        entry={podium[2]}
                                        rank={3}
                                        layout="column"
                                        isMe={podium[2].managerId === me?.id}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Suite du classement */}
                        {rest.length > 0 && (
                            <div className="space-y-3">
                                <div className="font-display text-[10px] font-extrabold uppercase tracking-[1.5px] text-texte-2 lg:text-base lg:tracking-[-0.2px] lg:normal-case lg:text-white">
                                    La suite du classement
                                </div>
                                <RankingRestList entries={rest} meId={me?.id} />
                            </div>
                        )}
                    </div>
                ) : (
                    <Empty />
                )
            ) : (
                <div className="space-y-3.5">
                    <div>
                        <div className="font-display text-[13px] font-black uppercase tracking-[1px] text-texte-2 lg:text-xl lg:tracking-[-0.3px] lg:normal-case lg:text-white">
                            Le Hubert Book
                        </div>
                        <p className="mt-1 text-xs text-texte-2 lg:text-[13px]">
                            Le grand livre des records de la ligue · top 5 par catégorie, le chambrage officiel.
                        </p>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-3 lg:gap-[18px]">
                        {records.map((rec) => (
                            <HubertBookCard key={rec.title} {...rec} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
