import { Halo } from "./Halo";
import { accueilMock } from "./mockData";

/** Carte hero : rang en cours, progression et prochain match. */
export function SeasonHeroCard() {
    const r = accueilMock.rank;
    return (
        <div className="lhm-card relative overflow-hidden rounded-2xl border border-transparent p-6 grad-primary">
            <Halo className="-right-16 -top-20 size-60" />
            <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-widest text-violet-clair">
                    Saison en cours · Rang {accueilMock.division}
                </div>
                <div className="mb-4 mt-2 flex items-end gap-4">
                    <div className="font-display text-6xl font-black leading-[0.82] text-white">
                        {r.position}
                        <span className="text-2xl opacity-60">{r.suffix}</span>
                    </div>
                    <div className="pb-3 font-display text-xl font-black text-menthe">▲ +{r.delta}</div>
                    <div className="flex-1 pb-3 text-right">
                        <span className="font-display text-2xl font-black text-white">{r.points}</span>
                        <span className="text-sm text-[#c4b5fd]"> pts</span>
                    </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-nuit/45">
                    <span className="block h-full rounded-full grad-lime" style={{ width: `${r.progressPct}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[#c4b5fd]">
                    <span>{r.journeesLeft} journées restantes</span>
                    <span>
                        Prochaine :{" "}
                        <b className="text-white">
                            J{r.nextJournee} vs {r.nextOpponent}
                        </b>
                    </span>
                </div>
            </div>
        </div>
    );
}
