import type { DashboardNext, DashboardRank, DashboardSeason } from "@/components/business/accueil/types";
import { ordinal } from "@/components/business/accueil/types";
import { Halo } from "./Halo";

/** Carte hero : rang dans la division, progression de la saison et prochain match. */
export function SeasonHeroCard({
    season,
    rank,
    next,
    live,
}: {
    season: DashboardSeason | null;
    rank: DashboardRank | null;
    next: DashboardNext | null;
    live: boolean;
}) {
    const delta = rank?.delta ?? 0;
    const deltaLabel = delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "= 0";
    const deltaColor = delta > 0 ? "text-menthe" : delta < 0 ? "text-[#ff6b8a]" : "text-texte-2";

    return (
        <div className="lhm-card relative overflow-hidden rounded-2xl border border-transparent p-6 grad-primary">
            <Halo className="-right-16 -top-20 size-60" />
            <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-widest text-violet-clair">
                    {live ? "Saison en cours" : "Dernière saison"} · {season?.division ?? "—"}
                </div>
                <div className="mb-4 mt-2 flex items-end gap-4">
                    <div className="font-display text-6xl font-black leading-[0.82] text-white">
                        {rank?.position ?? "—"}
                        {rank?.position ? <span className="text-2xl opacity-60">{ordinal(rank.position)}</span> : null}
                    </div>
                    {rank?.delta != null && (
                        <div className={`pb-3 font-display text-xl font-black ${deltaColor}`}>{deltaLabel}</div>
                    )}
                    <div className="flex-1 pb-3 text-right">
                        <span className="font-display text-2xl font-black text-white">{rank?.points ?? 0}</span>
                        <span className="text-sm text-[#c4b5fd]"> pts</span>
                    </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-nuit/45">
                    <span
                        className="block h-full rounded-full grad-lime"
                        style={{ width: `${rank?.progressPct ?? 0}%` }}
                    />
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-[#c4b5fd]">
                    <span>
                        {rank?.gameWeeksLeft != null
                            ? `${rank.gameWeeksLeft} journée${rank.gameWeeksLeft > 1 ? "s" : ""} restante${rank.gameWeeksLeft > 1 ? "s" : ""}`
                            : `${season?.gameSeason ?? ""} · ${season?.realSeason ?? ""}`}
                    </span>
                    {next?.opponent ? (
                        <span>
                            Prochaine :{" "}
                            <b className="text-white">
                                J{next.gameWeek} vs {next.opponent}
                            </b>
                        </span>
                    ) : rank?.gap ? (
                        <span>
                            À{" "}
                            <b className="text-white">
                                {rank.gap} pt{rank.gap > 1 ? "s" : ""}
                            </b>{" "}
                            du leader
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
