import type { DashboardNext } from "@/components/business/accueil/types";
import { daysUntil } from "@/components/business/accueil/types";
import { initials, playerGradient } from "@/components/business/stats/playerStyle";
import type { FormMatch } from "@/components/business/stats/types";
import { Empty } from "@/components/ui/Empty";
import { cn } from "@/lib/utils";

const RESULT = {
    W: { label: "V", word: "Victoire", chip: "bg-menthe/15 text-menthe", color: "text-menthe" },
    D: { label: "N", word: "Match nul", chip: "bg-texte-2/15 text-texte-2", color: "text-texte-2" },
    L: { label: "D", word: "Défaite", chip: "bg-rouge/15 text-[#ff6b8a]", color: "text-[#ff6b8a]" },
} as const;

function Tile({ name, seed, className }: { name: string; seed: string; className?: string }) {
    const g = playerGradient(seed);
    return (
        <div
            className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl font-display text-sm font-black",
                className,
            )}
            style={{ background: g.grad, color: g.txt }}
        >
            {initials(name)}
        </div>
    );
}

/** Dernière journée jouée : score, forme récente et prochain rendez-vous. */
export function LastMatchCard({
    last,
    form,
    next,
    me,
    meId,
}: {
    last: FormMatch | null;
    form: FormMatch[];
    next: DashboardNext | null;
    me: string;
    meId: string;
}) {
    if (!last) {
        return (
            <div className="lhm-card h-full rounded-[18px] border border-bord bg-carte p-[18px]">
                <Empty>Aucun match joué pour l'instant. La saison démarre. ⚽</Empty>
            </div>
        );
    }
    const r = RESULT[last.result];
    const [mine, theirs] = last.score.split("-");
    const inDays = daysUntil(next?.kickoffAt ?? null);

    return (
        <div className="lhm-card relative h-full overflow-hidden rounded-[18px] border border-bord bg-carte p-[18px]">
            <div
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ background: "linear-gradient(180deg,#ff2d78,#ff6b35)" }}
            />
            <div className="mb-4 font-display text-[11px] font-extrabold uppercase tracking-wider text-texte-2">
                Dernière journée · J{last.gameWeek} · {last.gameSeason}
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <Tile name={me} seed={meId} />
                    <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-white">{me}</div>
                        <div className={cn("text-[10px] font-bold uppercase tracking-wide", r.color)}>{r.word}</div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <div className={cn("font-display text-3xl font-black", r.color)}>{mine}</div>
                    <div className="rounded-lg bg-nuit px-2 py-1 text-[10px] font-bold text-texte-2">VS</div>
                    <div className="font-display text-3xl font-black text-white">{theirs}</div>
                </div>
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="min-w-0 text-right">
                        <div className="truncate text-[13px] font-bold text-white">{last.opponent ?? "—"}</div>
                        <div className="text-[10px] font-semibold text-texte-2">{last.realSeason}</div>
                    </div>
                    <Tile name={last.opponent ?? "?"} seed={last.opponentId ?? last.opponent ?? "?"} />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-texte-2">5 derniers</span>
                <div className="flex flex-1 gap-1.5">
                    {form.map((m) => (
                        <span
                            key={`${m.realSeason}-${m.gameSeason}-${m.gameWeek}`}
                            title={`J${m.gameWeek} · ${m.score}${m.opponent ? ` vs ${m.opponent}` : ""} · ${m.context}`}
                            className={cn(
                                "grid h-7 flex-1 place-items-center rounded-md font-display text-xs font-black",
                                RESULT[m.result].chip,
                            )}
                        >
                            {RESULT[m.result].label}
                        </span>
                    ))}
                </div>
            </div>

            {next && (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-bord pt-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <Tile name={next.opponent ?? "?"} seed={next.opponentId ?? next.opponent ?? "?"} />
                        <div className="min-w-0">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-texte-2">
                                Prochain · J{next.gameWeek}
                                {next.opponentRank ? ` · ${next.opponentRank}e de la division` : ""}
                            </div>
                            <div className="truncate font-display text-sm font-black text-white">
                                vs {next.opponent ?? "à définir"}
                            </div>
                        </div>
                    </div>
                    {inDays != null && (
                        <span className="shrink-0 rounded-full px-3.5 py-2 font-display text-[11px] font-black text-white grad-energy">
                            Dans {inDays}j
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
