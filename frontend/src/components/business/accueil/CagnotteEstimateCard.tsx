import { accueilMock } from "./mockData";

/** Mini-carte « Cagnotte · gain estimé » (donnée factice). */
export function CagnotteEstimateCard() {
    const c = accueilMock.cagnotte;
    return (
        <div className="lhm-card relative overflow-hidden rounded-[18px] border border-bord bg-carte p-[18px]">
            <div className="absolute inset-x-0 top-0 h-1 grad-energy" />
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-texte-2">
                Cagnotte · Gain estimé
            </div>
            <div className="font-display text-[34px] font-black leading-none text-menthe">{c.estimate}</div>
            <div className="mt-1 text-[11px] text-texte-2">Sur la saison</div>
            <div className="mt-4 rounded-xl bg-violet-clair/10 px-3 py-2 text-[11px] font-semibold text-violet-clair">
                ▲ {c.note}
            </div>
        </div>
    );
}
