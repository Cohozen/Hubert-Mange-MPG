import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { CupRow, DivisionWinner } from "@/components/business/palmares/types";
import { divisionStyle } from "@/components/business/stats/playerStyle";
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

/** Poids de tri : les coupes d'abord (C1 → C4), puis les titres de division par niveau. */
const DIVISION_SORT_OFFSET = 10;

const CUP = {
    LDC: {
        icon: "⭐",
        comp: "Ligue des Crampons",
        sub: "C1 · le Graal européen",
        color: "#00E5A0",
        grad: "linear-gradient(135deg,#00E5A0,#34D399)",
        rgb: "0,229,160",
        sort: 0,
    },
    UEFA: {
        icon: "🎖️",
        comp: "Europa",
        sub: "Heureux papa's League · C3",
        color: "#FF6B35",
        grad: "linear-gradient(135deg,#FF6B35,#FFD23F)",
        rgb: "255,107,53",
        sort: 1,
    },
    CONFERENCE: {
        icon: "🍐",
        comp: "Conférence",
        sub: "La C4 de la ligue",
        color: "#A78BFA",
        grad: "linear-gradient(135deg,#6D28D9,#A78BFA)",
        rgb: "167,139,250",
        sort: 2,
    },
} as const;

export function ProfileTrophiesTab({ managerId }: { managerId: string }) {
    const winners = useQuery({
        queryKey: ["winners"],
        queryFn: () => api<{ divisionWinners: DivisionWinner[] }>("/api/palmares/winners"),
    });
    const cups = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ list: CupRow[] }>("/api/palmares/tournaments"),
    });
    if (winners.isLoading || cups.isLoading) return null;

    const titles = (winners.data?.divisionWinners ?? []).filter((w) => w.managerId === managerId);
    const cupWins = (cups.data?.list ?? []).filter((c) => c.winnerManagerId === managerId);

    if (titles.length === 0 && cupWins.length === 0) {
        return <Empty>Aucun trophée pour l'instant. 🥲</Empty>;
    }

    const trophies: Trophy[] = [
        ...titles.map((t) => {
            const d = divisionStyle(t.level);
            return {
                icon: t.level === 1 ? "🏆" : "🥇",
                comp: `Division ${t.level}`,
                sub: "Titre de division",
                year: t.realSeason,
                tag: `S${t.gameSeasonIndex}`,
                color: d.c,
                grad: d.grad,
                tagBg: d.bg,
                tagBd: d.bd,
                sort: DIVISION_SORT_OFFSET + t.level,
            };
        }),
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
                    <span className="text-[9px] font-bold uppercase tracking-[1px] text-texte-2">
                        {trophies.length > 1 ? "Titres" : "Titre"}
                    </span>
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
            </div>
        </div>
    );
}
