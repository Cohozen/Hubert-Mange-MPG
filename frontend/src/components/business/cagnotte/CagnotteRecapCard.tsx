import { formatMoney } from "@/api/client";
import type { PoolDetail } from "@/components/business/cagnotte/types";

/** Bandeau récap de la cagnotte (collecté, objectif, progression, 3 stats). */
export function CagnotteRecapCard({ pool }: { pool: PoolDetail }) {
    const total = pool.contributions.length;
    const paidCount = pool.contributions.filter((c) => c.paid).length;
    const pending = Math.max(0, pool.totalExpected - pool.totalCollected);
    const pct =
        pool.totalExpected > 0 ? Math.min(100, Math.round((pool.totalCollected / pool.totalExpected) * 100)) : 0;

    return (
        <div
            className="relative overflow-hidden rounded-[20px] p-5 shadow-[0_18px_44px_rgba(109,40,217,.35)] lg:flex lg:items-center lg:gap-8 lg:p-7"
            style={{ background: "linear-gradient(135deg,#2D1B69,#6D28D9)" }}
        >
            <div
                className="pointer-events-none absolute -right-24 -top-28 size-[260px] rounded-full lg:size-[360px]"
                style={{
                    background: "radial-gradient(circle, rgba(255,45,120,.5), transparent 70%)",
                    animation: "lhmHalo 9s ease-in-out infinite",
                }}
            />
            <div className="relative min-w-0 flex-1">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-display text-[10px] font-extrabold uppercase tracking-[1.5px] text-[#C9B8F5]">
                        Cagnotte · {pool.season}
                    </span>
                    {pool.closed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-nuit/45 px-3 py-[5px] text-[10px] font-extrabold text-[#C9B8F5]">
                            🔒 Clôturée
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-menthe/50 bg-menthe/[0.18] px-3 py-[5px] text-[10px] font-extrabold text-menthe">
                            <span className="size-[7px] animate-[lhmPulse_1.6s_infinite] rounded-full bg-menthe" />
                            Ouverte
                        </span>
                    )}
                </div>
                <div className="min-w-0 font-display font-black leading-[0.9] tracking-[-2px] text-white tabular-nums text-[clamp(2rem,9vw,4rem)]">
                    {formatMoney(pool.totalCollected)}
                </div>
                <div className="mt-2 text-xs text-[#C9B8F5]">
                    collectés sur <b className="text-white">{formatMoney(pool.totalExpected)}</b> · objectif · {total}{" "}
                    membres
                </div>
                <div className="mt-3.5 h-2 overflow-hidden rounded-[5px] bg-nuit/45 lg:max-w-[560px]">
                    <div className="h-full rounded-[5px] grad-lime" style={{ width: `${pct}%` }} />
                </div>

                <div className="mt-4 flex gap-2.5 lg:hidden">
                    <RecapStat label="Encaissé" value={formatMoney(pool.totalCollected)} color="text-menthe" />
                    <RecapStat label="En attente" value={formatMoney(pending)} color="text-orange" />
                    <RecapStat label="Payés" value={`${paidCount}/${total}`} color="text-white" />
                </div>
            </div>

            <div className="relative hidden shrink-0 gap-3 lg:flex">
                <RecapStat label="Encaissé" value={formatMoney(pool.totalCollected)} color="text-menthe" wide />
                <RecapStat label="En attente" value={formatMoney(pending)} color="text-orange" wide />
                <RecapStat label="Payés" value={`${paidCount}/${total}`} color="text-white" wide />
            </div>
        </div>
    );
}

function RecapStat({ label, value, color, wide }: { label: string; value: string; color: string; wide?: boolean }) {
    return (
        <div
            className={`min-w-0 rounded-xl bg-nuit/[0.32] px-3 py-2.5 ${wide ? "lg:w-auto lg:min-w-[100px] lg:p-4" : "flex-1"}`}
        >
            <div className="text-[9px] font-bold uppercase tracking-[0.5px] text-[#C9B8F5]">{label}</div>
            <div
                className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-display font-black tabular-nums text-[clamp(0.9rem,3.4vw,1.5rem)] lg:overflow-visible ${color}`}
            >
                {value}
            </div>
        </div>
    );
}
