import type { DashboardNext } from "@/components/business/accueil/types";
import { daysUntil, ordinal } from "@/components/business/accueil/types";
import { initials, playerGradient } from "@/components/business/stats/playerStyle";
import type { FormMatch } from "@/components/business/stats/types";
import { Empty } from "@/components/ui/Empty";
import { cn } from "@/lib/utils";

const RESULT = {
    W: { label: "V", word: "Victoire", chip: "bg-menthe/15 text-menthe", color: "text-menthe" },
    D: { label: "N", word: "Match nul", chip: "bg-texte-2/15 text-texte-2", color: "text-texte-2" },
    L: { label: "D", word: "Défaite", chip: "bg-rouge/15 text-[#ff6b8a]", color: "text-[#ff6b8a]" },
} as const;

function Tile({ name, seed }: { name: string; seed: string }) {
    const g = playerGradient(seed);
    return (
        <div
            className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-sm font-black"
            style={{ background: g.grad, color: g.txt }}
        >
            {initials(name)}
        </div>
    );
}

/** Identité d'un camp : pastille + nom + pseudo. `flip` place le texte à droite de la pastille. */
function Side({ name, username, seed, flip }: { name: string; username: string | null; seed: string; flip?: boolean }) {
    return (
        <div className={cn("flex min-w-0 items-center gap-2.5", flip && "flex-row-reverse")}>
            <Tile name={name} seed={seed} />
            <div className={cn("min-w-0", flip && "text-right")}>
                <div className="truncate text-[13px] font-bold text-white">{name}</div>
                {username && <div className="truncate text-[10px] text-texte-2">{username}</div>}
            </div>
        </div>
    );
}

/**
 * Dernière journée jouée — ou journée en cours si un match est en direct : son score est
 * provisoire, il est signalé comme tel et n'entre ni dans la forme ni dans les séries.
 */
export function LastMatchCard({
    last,
    live,
    form,
    next,
    me,
    meId,
    meUsername,
}: {
    last: FormMatch | null;
    live: FormMatch | null;
    form: FormMatch[];
    next: DashboardNext | null;
    me: string;
    meId: string;
    meUsername: string | null;
}) {
    const match = live ?? last;
    if (!match) {
        return (
            <div className="lhm-card h-full rounded-[18px] border border-bord bg-carte p-[18px]">
                <Empty>Aucun match joué pour l'instant. La saison démarre. ⚽</Empty>
            </div>
        );
    }
    const r = RESULT[match.result];
    const [mine, theirs] = match.score.split("-");
    const inDays = daysUntil(next?.kickoffAt ?? null);

    return (
        <div className="lhm-card relative h-full overflow-hidden rounded-[18px] border border-bord bg-carte p-[18px]">
            <div
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ background: "linear-gradient(180deg,#ff2d78,#ff6b35)" }}
            />

            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="font-display text-[11px] font-extrabold uppercase tracking-wider text-texte-2">
                    {live ? "Journée en cours" : "Dernière journée"} · J{match.gameWeek} · {match.gameSeason}
                </div>
                {live ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-rouge/15 px-2.5 py-1 font-display text-[10px] font-black uppercase tracking-wider text-[#ff6b8a]">
                        <span
                            className="size-1.5 rounded-full bg-[#ff6b8a]"
                            style={{ animation: "lhmPulse 1.6s infinite" }}
                        />
                        En cours
                    </span>
                ) : (
                    <span
                        className={cn(
                            "rounded-full px-2.5 py-1 font-display text-[10px] font-black uppercase tracking-wider",
                            r.chip,
                        )}
                    >
                        {r.word}
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between gap-2">
                <Side name={me} username={meUsername} seed={meId} />
                <div className="flex shrink-0 items-center gap-3">
                    <div className={cn("font-display text-3xl font-black", live ? "text-white" : r.color)}>{mine}</div>
                    <div className="rounded-lg bg-nuit px-2 py-1 text-[10px] font-bold text-texte-2">VS</div>
                    <div className="font-display text-3xl font-black text-white">{theirs}</div>
                </div>
                <Side
                    name={match.opponent ?? "—"}
                    username={match.opponentUsername}
                    seed={match.opponentId ?? match.opponent ?? "?"}
                    flip
                />
            </div>
            {live && <div className="mt-2 text-center text-[10px] text-texte-2">Score provisoire</div>}

            {form.length > 0 && (
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
            )}

            {next && (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-bord pt-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <Tile name={next.opponent ?? "?"} seed={next.opponentId ?? next.opponent ?? "?"} />
                        <div className="min-w-0">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-texte-2">
                                Prochain · J{next.gameWeek}
                                {next.opponentRank
                                    ? ` · ${next.opponentRank}${ordinal(next.opponentRank)} de la division`
                                    : ""}
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
