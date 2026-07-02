import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { CupRow, DivisionWinner } from "@/components/business/palmares/types";
import type { TimelineSeason } from "@/components/business/profile/types";
import { Empty } from "@/components/ui/Empty";

interface Trophy {
    icon: string;
    comp: string;
    sub: string;
    year: string;
    tag: string;
    color: string;
    grad: string;
    tagBg: string;
    tagBd: string;
    sort: number;
}

const CUP = {
    LDC: {
        icon: "⭐",
        comp: "Ligue des Crampons",
        sub: "C1 · le Graal européen",
        color: "#00E5A0",
        grad: "linear-gradient(135deg,#00E5A0,#34D399)",
        rgb: "0,229,160",
        sort: 1,
    },
    UEFA: {
        icon: "🎖️",
        comp: "Europa",
        sub: "Heureux papa's League · C3",
        color: "#FF6B35",
        grad: "linear-gradient(135deg,#FF6B35,#FFD23F)",
        rgb: "255,107,53",
        sort: 2,
    },
    CONFERENCE: {
        icon: "🍐",
        comp: "Conférence",
        sub: "La C4 de la ligue",
        color: "#A78BFA",
        grad: "linear-gradient(135deg,#6D28D9,#A78BFA)",
        rgb: "167,139,250",
        sort: 3,
    },
} as const;

function careerFacts(seasons: TimelineSeason[]): string[] {
    if (!seasons.length) return [];
    const first = seasons[0];
    const last = seasons[seasons.length - 1];
    let relegations = 0;
    for (let i = 1; i < seasons.length; i++) if (seasons[i].level > seasons[i - 1].level) relegations++;
    const facts = [`🚀 Parti de Division ${first.level} en ${first.year}`];
    if (last.level < first.level) facts.push(`📈 Montée D${first.level} → D${last.level} en ${seasons.length} saisons`);
    facts.push(
        relegations === 0
            ? `🛡️ Aucune relégation en ${seasons.length} saisons`
            : `📉 ${relegations} relégation${relegations > 1 ? "s" : ""}`,
    );
    return facts;
}

export function ProfileTrophiesTab({ managerId }: { managerId: string }) {
    const winners = useQuery({
        queryKey: ["winners"],
        queryFn: () => api<{ divisionWinners: DivisionWinner[] }>("/api/palmares/winners"),
    });
    const cups = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ list: CupRow[] }>("/api/palmares/tournaments"),
    });
    const tl = useQuery({
        queryKey: ["timeline", managerId],
        queryFn: () => api<{ seasons: TimelineSeason[] }>(`/api/palmares/timeline/${managerId}`),
    });

    if (winners.isLoading || cups.isLoading) return null;

    const titles = (winners.data?.divisionWinners ?? []).filter((w) => w.managerId === managerId);
    const cupWins = (cups.data?.list ?? []).filter((c) => c.winnerManagerId === managerId);

    if (titles.length === 0 && cupWins.length === 0) {
        return <Empty>Aucun trophée pour l'instant. 🥲</Empty>;
    }

    const trophies: Trophy[] = [
        ...titles.map((t) => ({
            icon: t.level === 1 ? "🏆" : "🥇",
            comp: `Champion D${t.level}`,
            sub: "Titre de division",
            year: t.realSeason,
            tag: `Division ${t.level}`,
            color: "#FFD23F",
            grad: "linear-gradient(135deg,#FFD23F,#FF6B35)",
            tagBg: "rgba(255,210,63,.13)",
            tagBd: "rgba(255,210,63,.45)",
            sort: 0,
        })),
        ...cupWins.map((c) => {
            const m = CUP[c.competition as keyof typeof CUP] ?? CUP.CONFERENCE;
            return {
                icon: m.icon,
                comp: m.comp,
                sub: m.sub,
                year: String(c.year),
                tag: "Coupe",
                color: m.color,
                grad: m.grad,
                tagBg: `rgba(${m.rgb},.13)`,
                tagBd: `rgba(${m.rgb},.45)`,
                sort: m.sort,
            };
        }),
    ].sort((a, b) => a.sort - b.sort || b.year.localeCompare(a.year));

    const facts = careerFacts(tl.data?.seasons ?? []);

    return (
        <div>
            <div className="mb-3 flex items-end justify-between lg:mb-4">
                <h2 className="font-display text-[13px] font-black uppercase tracking-[1px] text-texte-2 lg:text-xl lg:normal-case lg:tracking-[-0.3px] lg:text-white">
                    <span className="lg:hidden">Salle des trophées</span>
                    <span className="hidden lg:inline">La salle des trophées</span>
                </h2>
                <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[22px] font-black leading-none text-jaune lg:text-xl">
                        {trophies.length}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[1px] text-texte-2">Titres</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
                {trophies.map((t, i) => (
                    <div
                        key={i}
                        className="lhm-card relative overflow-hidden rounded-2xl border bg-carte"
                        style={{ borderColor: t.tagBd }}
                    >
                        <div className="h-[3px] lg:h-1" style={{ background: t.color }} />
                        <div className="p-[13px] lg:p-5">
                            <div className="mb-3 flex items-center justify-between lg:mb-3.5">
                                <div
                                    className="grid size-[42px] place-items-center rounded-full text-xl lg:size-[54px] lg:text-[27px]"
                                    style={{ background: t.grad }}
                                >
                                    {t.icon}
                                </div>
                                <span
                                    className="rounded-full border px-2 py-1 font-display text-[9px] font-black tracking-[0.5px] lg:px-[11px] lg:text-[10px]"
                                    style={{ color: t.color, background: t.tagBg, borderColor: t.tagBd }}
                                >
                                    {t.tag}
                                </span>
                            </div>
                            <div className="font-display text-[15px] font-black tracking-[-0.2px] text-white lg:text-lg">
                                {t.comp}
                            </div>
                            <div className="mt-1 text-[10px] leading-[1.4] text-texte-2 lg:text-[11px]">{t.sub}</div>
                            <div
                                className="mt-2 font-display text-[13px] font-black lg:mt-3 lg:text-[15px]"
                                style={{ color: t.color }}
                            >
                                {t.year}
                            </div>
                        </div>
                    </div>
                ))}

                {facts.length > 0 && (
                    <div className="col-span-2 flex flex-col justify-center rounded-2xl border border-dashed border-bord bg-gradient-to-br from-carte-2 to-carte p-4 lg:col-span-1 lg:p-5">
                        <div className="mb-3 font-display text-[10px] font-extrabold uppercase tracking-[1.5px] text-texte-2">
                            Faits de carrière
                        </div>
                        <div className="flex flex-col gap-2.5 text-xs text-[#C7CEEF]">
                            {facts.map((f) => (
                                <div key={f}>{f}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
