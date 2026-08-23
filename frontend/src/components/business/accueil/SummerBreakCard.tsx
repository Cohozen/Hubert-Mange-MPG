import type { DashboardSeason } from "@/components/business/accueil/types";
import { Halo } from "./Halo";

function CountUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex-1 rounded-xl bg-nuit/40 px-1 py-2.5 text-center">
            <div className="font-display text-2xl font-black leading-none text-white">{value}</div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wide text-white/80">{label}</div>
        </div>
    );
}

/** Trêve estivale : compte à rebours si l'on connaît la date de reprise du championnat. */
export function SummerBreakCard({ season }: { season: DashboardSeason | null }) {
    const start = season?.startDate ? new Date(season.startDate).getTime() : null;
    const diff = start && start > Date.now() ? start - Date.now() : null;
    const countdown = diff
        ? {
              days: Math.floor(diff / 86_400_000),
              hours: Math.floor((diff % 86_400_000) / 3_600_000),
              minutes: Math.floor((diff % 3_600_000) / 60_000),
          }
        : null;

    return (
        <div
            className="lhm-card relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-transparent p-7"
            style={{ background: "linear-gradient(135deg,#ff6b35,#ff2d78)" }}
        >
            <Halo className="-right-12 -top-16 size-64" color="rgba(255,210,63,.5)" />
            <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-nuit/30 px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-wider text-white">
                    ☀ Pause estivale
                </span>
                <h3 className="my-4 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-white">
                    Le championnat
                    <br />
                    revient bientôt
                </h3>
                {countdown && (
                    <div className="mb-4 rounded-2xl bg-nuit/30 p-4">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/85">
                            Reprise du championnat dans
                        </div>
                        <div className="flex gap-2">
                            <CountUnit value={countdown.days} label="Jours" />
                            <CountUnit value={countdown.hours} label="Heures" />
                            <CountUnit value={countdown.minutes} label="Min" />
                        </div>
                    </div>
                )}
                <p className="text-xs leading-relaxed text-white/90">
                    On attend le coup d'envoi de la nouvelle saison réelle pour relancer la Ligue Hubert Mange.
                </p>
            </div>
        </div>
    );
}
