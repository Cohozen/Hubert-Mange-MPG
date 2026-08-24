import type { DashboardNext, DashboardRank, DashboardSeason, Zone } from "@/components/business/accueil/types";
import { ordinal } from "@/components/business/accueil/types";
import { Halo } from "./Halo";

/** Enjeu de la place : libellé, icône et couleur (or, menthe, gris, rouge). */
const ZONES: Record<Zone, { label: string; icon: string; color: string; bar: string }> = {
    titre: { label: "Titre", icon: "🏆", color: "#FFD23F", bar: "linear-gradient(90deg,#FFD23F,#FF6B35)" },
    promotion: { label: "Promotion", icon: "▲", color: "#00E5A0", bar: "linear-gradient(90deg,#00E5A0,#34D399)" },
    maintien: { label: "Maintien", icon: "=", color: "#C7CEEF", bar: "linear-gradient(90deg,#8B92C4,#C7CEEF)" },
    relegation: { label: "Relégation", icon: "⚠", color: "#FF6B8A", bar: "linear-gradient(90deg,#FF3B5C,#FF6B8A)" },
};

/** « à 2 pts de la promotion » quand on court après, « 2 pts d'avance sur le 3e » quand on mène. */
function zoneHint(rank: DashboardRank): string | null {
    if (!rank.zone || rank.zoneGap == null || !rank.zoneTarget) return null;
    const ahead = rank.zone === "titre" || rank.zone === "promotion";
    const pts = `${rank.zoneGap} pt${rank.zoneGap > 1 ? "s" : ""}`;
    if (ahead) {
        return rank.zoneGap === 0
            ? `à égalité avec le ${rank.zoneTarget}`
            : `${pts} d'avance sur le ${rank.zoneTarget}`;
    }
    const target = rank.zoneTarget === "maintien" ? "du maintien" : `de la ${rank.zoneTarget}`;
    return rank.zoneGap === 0 ? `à égalité pour ${rank.zoneTarget}` : `à ${pts} ${target}`;
}

/** Carte hero : rang dans la division, enjeu de la place, progression et prochain match. */
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
    const zone = rank?.zone ? ZONES[rank.zone] : null;
    const hint = rank ? zoneHint(rank) : null;

    return (
        <div className="lhm-card relative overflow-hidden rounded-2xl border border-transparent p-6 grad-primary">
            <Halo className="-right-16 -top-20 size-60" />
            <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-widest text-violet-clair">
                    {live ? "Saison en cours" : "Dernière saison"} · {season?.division ?? "—"}
                </div>
                <div className="mb-4 mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
                    <div className="font-display text-6xl font-black leading-[0.82] text-white">
                        {rank?.position ?? "—"}
                        {rank?.position ? <span className="text-2xl opacity-60">{ordinal(rank.position)}</span> : null}
                    </div>
                    {rank?.delta != null && (
                        <div className={`pb-3 font-display text-xl font-black ${deltaColor}`}>{deltaLabel}</div>
                    )}
                    {zone && (
                        <span
                            className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-wider"
                            style={{
                                color: zone.color,
                                borderColor: `color-mix(in srgb, ${zone.color} 45%, transparent)`,
                                background: `color-mix(in srgb, ${zone.color} 14%, transparent)`,
                            }}
                        >
                            {zone.icon} {zone.label}
                        </span>
                    )}
                    <div className="flex-1 pb-3 text-right">
                        <span className="font-display text-2xl font-black text-white">{rank?.points ?? 0}</span>
                        <span className="text-sm text-[#c4b5fd]"> {(rank?.points ?? 0) > 1 ? "pts" : "pt"}</span>
                    </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-nuit/45">
                    <span
                        className="block h-full rounded-full grad-lime"
                        style={{
                            width: `${rank?.progressPct ?? 0}%`,
                            ...(zone ? { background: zone.bar } : {}),
                        }}
                    />
                </div>
                {hint && (
                    <div className="mt-2 text-xs font-semibold" style={{ color: zone?.color }}>
                        {hint}
                    </div>
                )}
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
