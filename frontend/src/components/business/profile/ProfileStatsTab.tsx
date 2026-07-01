import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { CareerChart } from "@/components/business/profile/CareerChart";
import type { TimelineSeason } from "@/components/business/profile/types";
import { MiniStat } from "@/components/business/stats/MiniStat";
import { Empty } from "@/components/ui/Empty";

const sum = (xs: (number | null)[]): number => xs.reduce<number>((a, b) => a + (b ?? 0), 0);

function derive(seasons: TimelineSeason[]) {
    let promotions = 0;
    let relegations = 0;
    for (let i = 1; i < seasons.length; i++) {
        const d = seasons[i].level - seasons[i - 1].level;
        if (d < 0) promotions++;
        else if (d > 0) relegations++;
    }

    const ranks = seasons.map((s) => s.finalRank).filter((r): r is number => r != null);
    const avgRank = ranks.length ? Math.round((sum(ranks) / ranks.length) * 10) / 10 : 0;

    const played = sum(seasons.map((s) => s.played));
    const won = sum(seasons.map((s) => s.won));
    const goalsFor = sum(seasons.map((s) => s.goalsFor));
    const goalsAgainst = sum(seasons.map((s) => s.goalsAgainst));
    const winPct = played ? Math.round((won / played) * 100) : 0;

    const withPoints = seasons.filter((s) => s.points != null);
    const best = withPoints.length ? withPoints.reduce((a, b) => ((b.points ?? 0) > (a.points ?? 0) ? b : a)) : null;
    const worst = withPoints.length ? withPoints.reduce((a, b) => ((b.points ?? 0) < (a.points ?? 0) ? b : a)) : null;

    return {
        promotions,
        relegations,
        moves: promotions + relegations,
        avgRank,
        winPct,
        goalsFor,
        goalsAgainst,
        diff: goalsFor - goalsAgainst,
        best,
        worst,
    };
}

function SeasonHighlight({ title, season }: { title: string; season: TimelineSeason | null }) {
    if (!season) return null;
    return (
        <div className="rounded-2xl border border-bord bg-carte p-3">
            <div className="text-xs text-texte-2">{title}</div>
            <div className="font-display font-black text-white">{season.points ?? 0} pts</div>
            <div className="text-xs text-texte-2">
                {season.division} · {season.realSeason} — {season.gameSeason}
            </div>
        </div>
    );
}

export function ProfileStatsTab({ managerId }: { managerId: string }) {
    const { data } = useQuery({
        queryKey: ["timeline", managerId],
        queryFn: () => api<{ seasons: TimelineSeason[] }>(`/api/palmares/timeline/${managerId}`),
    });

    if (!data) return null;
    const { seasons } = data;

    if (seasons.length === 0) {
        return <Empty>Pas encore de saison jouée.</Empty>;
    }

    const s = derive(seasons);

    return (
        <div className="space-y-6">
            <section>
                <h3 className="mb-2 font-display text-sm font-black uppercase tracking-wide text-white">
                    📈 Historique
                </h3>
                <CareerChart seasons={seasons} />
            </section>

            <section>
                <h3 className="mb-2 font-display text-sm font-black uppercase tracking-wide text-white">Mouvements</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat label="Montées" value={s.promotions} accent="text-menthe" />
                    <MiniStat label="Descentes" value={s.relegations} accent="text-rouge" />
                    <MiniStat label="Mouvements" value={s.moves} />
                    <MiniStat label="Rang moyen" value={s.avgRank} />
                </div>
            </section>

            <section>
                <h3 className="mb-2 font-display text-sm font-black uppercase tracking-wide text-white">Performance</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat label="% victoires" value={s.winPct} accent="text-rose" />
                    <MiniStat label="Buts pour" value={s.goalsFor} />
                    <MiniStat label="Buts contre" value={s.goalsAgainst} />
                    <MiniStat
                        label="Différence"
                        value={s.diff}
                        accent={s.diff > 0 ? "text-menthe" : s.diff < 0 ? "text-rouge" : undefined}
                    />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <SeasonHighlight title="🔥 Meilleure saison" season={s.best} />
                    <SeasonHighlight title="🥶 Pire saison" season={s.worst} />
                </div>
            </section>
        </div>
    );
}
