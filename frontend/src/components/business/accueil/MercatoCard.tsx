import type { DashboardMercato } from "@/components/business/accueil/types";
import { cn } from "@/lib/utils";

const dateLabel = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit" })
        : null;

/** Mini-carte mercato : budget restant et état du marché (ouvert / fermé, prochain tour). */
export function MercatoCard({ mercato }: { mercato: DashboardMercato | null }) {
    const open = mercato?.closed === false;
    const nextTurn = dateLabel(mercato?.nextTurnAt ?? null);

    return (
        <div className="lhm-card relative overflow-hidden rounded-[18px] border border-bord bg-carte p-[18px]">
            <div className={cn("absolute inset-x-0 top-0 h-1", open ? "grad-lime" : "bg-bord")} />
            <div className="mb-3 flex items-center gap-1.5">
                <span
                    className={cn("size-2 rounded-full", open ? "bg-menthe" : "bg-texte-2")}
                    style={open ? { animation: "lhmPulse 1.6s infinite" } : undefined}
                />
                <span
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        open ? "text-menthe" : "text-texte-2",
                    )}
                >
                    {open ? "Mercato ouvert" : "Mercato fermé"}
                </span>
            </div>
            <div className="font-display text-3xl font-black leading-none text-white">
                {mercato?.budget ?? "—"}
                <span className="text-[15px] text-texte-2">M€</span>
            </div>
            <div className="mt-1 text-[11px] text-texte-2">Budget restant</div>
            {nextTurn && (
                <div className="mt-4 rounded-xl bg-orange/10 px-3 py-2 text-[11px] font-semibold text-orange">
                    ⏱ Prochain tour · {nextTurn}
                </div>
            )}
        </div>
    );
}
