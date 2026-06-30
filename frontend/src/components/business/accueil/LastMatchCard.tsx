import { cn } from "@/lib/utils";
import { accueilMock } from "./mockData";

const FORM_STYLES: Record<string, string> = {
    V: "bg-menthe/15 text-menthe",
    N: "bg-texte-2/15 text-texte-2",
    D: "bg-rouge/15 text-[#ff6b8a]",
};

/** Dernière journée : score, forme récente et prochain rendez-vous (factice). */
export function LastMatchCard() {
    const m = accueilMock.lastMatch;
    return (
        <div className="lhm-card relative h-full overflow-hidden rounded-[18px] border border-bord bg-carte p-[18px]">
            <div
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ background: "linear-gradient(180deg,#ff2d78,#ff6b35)" }}
            />
            <div className="mb-4 font-display text-[11px] font-extrabold uppercase tracking-wider text-texte-2">
                Dernière journée · J{m.journee}
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="grid size-10 place-items-center rounded-xl font-display text-sm font-black text-white grad-primary">
                        {m.me.initials}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-white">{m.me.name}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wide text-menthe">Victoire</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="font-display text-3xl font-black text-menthe">{m.me.score}</div>
                    <div className="rounded-lg bg-nuit px-2 py-1 text-[10px] font-bold text-texte-2">VS</div>
                    <div className="font-display text-3xl font-black text-white">{m.opponent.score}</div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="min-w-0 text-right">
                        <div className="truncate text-[13px] font-bold text-white">{m.opponent.name}</div>
                        <div className="text-[10px] font-semibold text-texte-2">J{m.journee}</div>
                    </div>
                    <div className="grid size-10 place-items-center rounded-xl font-display text-sm font-black text-white grad-energy">
                        {m.opponent.initials}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-texte-2">5 derniers</span>
                <div className="flex flex-1 gap-1.5">
                    {m.form.map((r, i) => (
                        <span
                            // biome-ignore lint/suspicious/noArrayIndexKey: liste statique factice
                            key={i}
                            className={cn(
                                "grid h-7 flex-1 place-items-center rounded-md font-display text-xs font-black",
                                FORM_STYLES[r],
                            )}
                        >
                            {r}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-bord pt-4">
                <div className="flex items-center gap-2.5">
                    <div
                        className="grid size-10 place-items-center rounded-xl font-display text-sm font-black text-[#3d2e00]"
                        style={{ background: "linear-gradient(135deg,#ff6b35,#ffd23f)" }}
                    >
                        {m.next.initials}
                    </div>
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-texte-2">
                            Prochain · J{m.next.journee}
                        </div>
                        <div className="font-display text-sm font-black text-white">vs {m.next.name}</div>
                    </div>
                </div>
                <span className="rounded-full px-3.5 py-2 font-display text-[11px] font-black text-white grad-energy">
                    Dans {m.next.inDays}j
                </span>
            </div>
        </div>
    );
}
