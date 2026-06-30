import { Halo } from "./Halo";
import { accueilMock } from "./mockData";

/** Carte d'inter-saison : édition terminée, prochaine en préparation (factice). */
export function InterSeasonCard() {
    const s = accueilMock.interSeason;
    return (
        <div className="lhm-card relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-transparent p-7 grad-primary">
            <Halo className="-right-14 -top-20 size-72" />
            <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-clair/50 bg-nuit/40 px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-wider text-white">
                    <span className="size-1.5 rounded-full bg-violet-clair" />
                    {s.badge}
                </span>
                <h3 className="my-3 whitespace-pre-line font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-white">
                    {s.title}
                </h3>
                <p className="mb-5 max-w-md text-sm leading-relaxed text-[#c4b5fd]">{s.text}</p>
                <div className="flex gap-3">
                    <div className="flex-1 rounded-2xl bg-nuit/40 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-violet-clair">
                            Position finale
                        </div>
                        <div className="mt-1 font-display text-2xl font-black leading-none text-white">
                            {s.finalPosition}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold text-menthe">{s.finalNote}</div>
                    </div>
                    <div className="flex-1 rounded-2xl bg-nuit/40 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-violet-clair">
                            Coup d'envoi
                        </div>
                        <div className="mt-1 font-display text-2xl font-black leading-none text-white">{s.kickoff}</div>
                        <div className="mt-1 text-[11px] font-semibold text-texte-2">{s.kickoffNote}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
