import { accueilMock } from "./mockData";

/** Mini-carte « Mercato ouvert » (donnée factice). */
export function MercatoCard() {
    const m = accueilMock.mercato;
    return (
        <div className="lhm-card relative overflow-hidden rounded-[18px] border border-bord bg-carte p-[18px]">
            <div className="absolute inset-x-0 top-0 h-1 grad-lime" />
            <div className="mb-3 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-menthe" style={{ animation: "lhmPulse 1.6s infinite" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-menthe">Mercato ouvert</span>
            </div>
            <div className="font-display text-3xl font-black leading-none text-white">
                {m.budget}
                <span className="text-[15px] text-texte-2">{m.unit}</span>
            </div>
            <div className="mt-1 text-[11px] text-texte-2">Budget restant</div>
            <div className="mt-4 rounded-xl bg-orange/10 px-3 py-2 text-[11px] font-semibold text-orange">
                ⏱ Ferme dans {m.closesIn}
            </div>
        </div>
    );
}
