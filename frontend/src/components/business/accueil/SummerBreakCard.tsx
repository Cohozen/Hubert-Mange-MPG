import { Halo } from "./Halo";
import { accueilMock } from "./mockData";

function CountUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex-1 rounded-xl bg-nuit/40 px-1 py-2.5 text-center">
            <div className="font-display text-2xl font-black leading-none text-white">{value}</div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wide text-white/80">{label}</div>
        </div>
    );
}

/** Carte de trêve estivale : compte à rebours avant reprise (factice). */
export function SummerBreakCard() {
    const s = accueilMock.summerBreak;
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
                <div className="mb-4 rounded-2xl bg-nuit/30 p-4">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/85">
                        Reprise estimée dans
                    </div>
                    <div className="flex gap-2">
                        <CountUnit value={s.countdown.days} label="Jours" />
                        <CountUnit value={s.countdown.hours} label="Heures" />
                        <CountUnit value={s.countdown.minutes} label="Min" />
                    </div>
                </div>
                <p className="text-xs leading-relaxed text-white/90">{s.text}</p>
            </div>
        </div>
    );
}
