import type { DashboardRank, DashboardSeason } from "@/components/business/accueil/types";
import { ordinal } from "@/components/business/accueil/types";
import { Halo } from "./Halo";

/** Inter-saison : l'édition MPG est terminée, la suivante n'a pas encore démarré. */
export function InterSeasonCard({ season, rank }: { season: DashboardSeason | null; rank: DashboardRank | null }) {
    const nextIndex = (season?.gameSeasonIndex ?? 0) + 1;
    const finalPosition = rank?.position ? `${rank.position}${ordinal(rank.position)} · D${season?.level ?? "?"}` : "—";
    const note = rank?.position === 1 ? "Champion 🏆" : season?.level === 1 ? "Maintenu en élite" : "Saison terminée";

    return (
        <div className="lhm-card relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-transparent p-7 grad-primary">
            <Halo className="-right-14 -top-20 size-72" />
            <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-clair/50 bg-nuit/40 px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-wider text-white">
                    <span className="size-1.5 rounded-full bg-violet-clair" />
                    {season?.gameSeason ?? "Saison"} terminée
                </span>
                <h3 className="my-3 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-white">
                    Saison {nextIndex}
                    <br />
                    en préparation
                </h3>
                <p className="mb-5 max-w-md text-sm leading-relaxed text-[#c4b5fd]">
                    Classement final figé. Promotions et relégations en cours de calcul — le nouveau calendrier arrive
                    très vite.
                </p>
                <div className="flex gap-3">
                    <div className="flex-1 rounded-2xl bg-nuit/40 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-violet-clair">
                            Position finale
                        </div>
                        <div className="mt-1 font-display text-2xl font-black leading-none text-white">
                            {finalPosition}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold text-menthe">{note}</div>
                    </div>
                    <div className="flex-1 rounded-2xl bg-nuit/40 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-violet-clair">Bilan</div>
                        <div className="mt-1 font-display text-2xl font-black leading-none text-white">
                            {rank?.points ?? 0} pts
                        </div>
                        <div className="mt-1 text-[11px] font-semibold text-texte-2">
                            {season?.realSeason ?? ""} · {rank?.played ?? 0} journées
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
