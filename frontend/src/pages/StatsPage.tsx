import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { RankCard } from "@/components/business/stats/RankCard";
import type { AllTimeRow, CupCount, FunStats, Movement, RankRow } from "@/components/business/stats/types";
import { Empty } from "@/components/ui/Empty";
import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Médaille pour le top 3 (uniquement si le manager a au moins un titre), sinon le rang.
const rankLabel = (rank: number, hasTitles: boolean) =>
    hasTitles && rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `${rank}.`;

const chip = "rounded-full px-2 py-0.5 text-xs font-semibold";

export default function StatsPage() {
    const { data: me } = useAuth();
    const allTime = useQuery({
        queryKey: ["all-time"],
        queryFn: () => api<{ ranking: AllTimeRow[]; maxLevel: number }>("/api/palmares/all-time"),
    });
    const fun = useQuery({
        queryKey: ["fun-stats"],
        queryFn: () => api<FunStats>("/api/palmares/fun-stats"),
    });
    const cups = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ ranking: CupCount[] }>("/api/palmares/tournaments"),
    });
    const movements = useQuery({
        queryKey: ["movements"],
        queryFn: () =>
            api<{ promotions: Movement[]; relegations: Movement[]; yoyo: Movement[] }>("/api/palmares/movements"),
    });

    const moveRows = (m?: Movement[]): RankRow[] =>
        (m ?? []).map((x) => ({
            managerId: x.managerId,
            manager: x.manager,
            username: x.username,
            avatarUrl: x.avatarUrl,
            value: x.count,
        }));

    // Coupes par manager : comptées dans le total de titres affiché, mais hors calcul du classement.
    const cupsByManager = new Map((cups.data?.ranking ?? []).map((c) => [c.managerId, c]));
    const totalWithCups = (r: AllTimeRow) => r.totalTitles + (cupsByManager.get(r.managerId)?.total ?? 0);

    return (
        <div className="space-y-8">
            <img
                src="/stats-banner.jpg"
                alt="Mega Ligue — Hubert mange"
                className="w-full rounded-2xl border border-bord object-cover"
                loading="lazy"
            />

            <section className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <SectionTitle>Classement all-time</SectionTitle>
                    <details className="relative">
                        <summary className="grid size-8 cursor-pointer list-none place-items-center rounded-full text-texte-2 transition hover:bg-carte hover:text-white [&::-webkit-details-marker]:hidden">
                            <Info size={16} />
                        </summary>
                        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-bord bg-carte p-4 text-xs leading-relaxed text-texte-2 shadow-xl sm:w-80">
                            Façon Jeux Olympiques : on compte les titres (1re place) par division. On départage d'abord
                            sur les titres de D1, puis de D2, et ainsi de suite, puis sur le nombre de coupes. Les
                            coupes (⭐ Crampons · 🎖️ Europa · 🍐 Conference) comptent dans le total de titres et
                            départagent après les championnats.
                        </div>
                    </details>
                </div>

                {allTime.data?.ranking.length ? (
                    <>
                        {/* Mobile : cartes */}
                        <div className="space-y-2 sm:hidden">
                            {allTime.data.ranking.map((r) => {
                                const c = cupsByManager.get(r.managerId);
                                const isMe = r.managerId === me?.id;
                                return (
                                    <div
                                        key={r.managerId}
                                        className={cn(
                                            "flex items-center gap-3 rounded-2xl border bg-carte p-3",
                                            isMe ? "border-rose" : "border-bord",
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-8 shrink-0 text-center font-display font-black",
                                                r.rank > 3 ? "text-base text-texte-2" : "text-2xl",
                                            )}
                                        >
                                            {rankLabel(r.rank, r.totalTitles > 0)}
                                        </div>
                                        <div className="min-w-0 flex-1 text-white">
                                            <ManagerLabel
                                                managerId={r.managerId}
                                                name={r.manager}
                                                username={r.username}
                                                avatarUrl={r.avatarUrl}
                                                size={26}
                                            />
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                {r.titles.map((cnt, lvl) =>
                                                    cnt > 0 ? (
                                                        <span
                                                            key={lvl}
                                                            className={cn(
                                                                chip,
                                                                lvl === 0
                                                                    ? "bg-rose/15 text-rose"
                                                                    : "bg-carte-2 text-texte-2",
                                                            )}
                                                        >
                                                            D{lvl + 1} ×{cnt}
                                                        </span>
                                                    ) : null,
                                                )}
                                                {r.totalTitles === 0 && (
                                                    <span className={cn(chip, "bg-carte-2 text-texte-2")}>
                                                        aucun titre
                                                    </span>
                                                )}
                                                {c?.ldc ? (
                                                    <span className={cn(chip, "bg-jaune/15 text-jaune")}>
                                                        ⭐ ×{c.ldc}
                                                    </span>
                                                ) : null}
                                                {c?.uefa ? (
                                                    <span className={cn(chip, "bg-carte-2 text-texte-2")}>
                                                        🎖️ ×{c.uefa}
                                                    </span>
                                                ) : null}
                                                {c?.conference ? (
                                                    <span className={cn(chip, "bg-carte-2 text-texte-2")}>
                                                        🍐 ×{c.conference}
                                                    </span>
                                                ) : null}
                                                <span
                                                    className={cn(
                                                        chip,
                                                        "border border-bord bg-transparent text-texte-2",
                                                    )}
                                                >
                                                    {r.seasonsPlayed} saisons
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="font-display text-lg font-black text-rose">
                                                {totalWithCups(r)}
                                            </div>
                                            <div className="text-[10px] text-texte-2">
                                                titre{totalWithCups(r) > 1 ? "s" : ""}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop : tableau */}
                        <div className="hidden overflow-x-auto rounded-2xl border border-bord bg-carte sm:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-bord hover:bg-transparent">
                                        <TableHead className="text-texte-2">#</TableHead>
                                        <TableHead className="text-texte-2">Manager</TableHead>
                                        {Array.from({ length: allTime.data.maxLevel }, (_, lvl) => (
                                            <TableHead key={lvl} className="text-center text-texte-2">
                                                {lvl === 0 ? "🥇 D1" : `D${lvl + 1}`}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-center text-texte-2">Total</TableHead>
                                        <TableHead className="text-center text-texte-2" title="Ligue des Crampons">
                                            ⭐
                                        </TableHead>
                                        <TableHead className="text-center text-texte-2" title="Europa">
                                            🎖️
                                        </TableHead>
                                        <TableHead className="text-center text-texte-2" title="Conference">
                                            🍐
                                        </TableHead>
                                        <TableHead className="text-center text-texte-2">Saisons</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allTime.data.ranking.map((r) => {
                                        const isMe = r.managerId === me?.id;
                                        const c = cupsByManager.get(r.managerId);
                                        const cupCell = (n: number) => (
                                            <TableCell
                                                className={cn(
                                                    "text-center",
                                                    n > 0 ? "font-semibold text-white" : "text-texte-2/40",
                                                )}
                                            >
                                                {n || "—"}
                                            </TableCell>
                                        );
                                        return (
                                            <TableRow
                                                key={r.managerId}
                                                className={cn(
                                                    "border-bord",
                                                    isMe ? "bg-rose/5" : "hover:bg-carte-2/40",
                                                )}
                                            >
                                                <TableCell
                                                    className={cn(
                                                        "font-display font-black text-white",
                                                        isMe && "border-l-2 border-l-rose",
                                                    )}
                                                >
                                                    {rankLabel(r.rank, r.totalTitles > 0)}
                                                </TableCell>
                                                <TableCell className="text-white">
                                                    <ManagerLabel
                                                        managerId={r.managerId}
                                                        name={r.manager}
                                                        username={r.username}
                                                        avatarUrl={r.avatarUrl}
                                                        size={26}
                                                    />
                                                </TableCell>
                                                {r.titles.map((cnt, lvl) => (
                                                    <TableCell
                                                        key={lvl}
                                                        className={cn(
                                                            "text-center",
                                                            cnt > 0 ? "font-semibold text-white" : "text-texte-2/40",
                                                        )}
                                                    >
                                                        {cnt || "—"}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-center font-display font-black text-rose">
                                                    {totalWithCups(r)}
                                                </TableCell>
                                                {cupCell(c?.ldc ?? 0)}
                                                {cupCell(c?.uefa ?? 0)}
                                                {cupCell(c?.conference ?? 0)}
                                                <TableCell className="text-center text-texte-2">
                                                    {r.seasonsPlayed}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <Empty />
                )}
            </section>

            <section className="space-y-4">
                <SectionTitle>Stats fun</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <RankCard
                        title="🐐 Bouc émissaire"
                        subtitle="le plus de malus subis"
                        rows={fun.data?.scapeGoat}
                        unit=" malus"
                        accent="text-jaune"
                    />
                    <RankCard
                        title="🥅 La passoire"
                        subtitle="le plus de buts encaissés"
                        rows={fun.data?.worstDefense}
                        unit=" BC"
                        accent="text-rouge"
                    />
                    <RankCard
                        title="⚽ Meilleure attaque"
                        subtitle="le plus de buts marqués"
                        rows={fun.data?.bestAttack}
                        unit=" BP"
                        accent="text-menthe"
                    />
                    <RankCard
                        title="🎯 Machine à points"
                        subtitle="le plus de points cumulés"
                        rows={fun.data?.mostPoints}
                        unit=" pts"
                        accent="text-rose"
                    />
                    <RankCard
                        title="🏅 Rotaldo d'Or"
                        subtitle="a possédé le meilleur joueur"
                        rows={fun.data?.rotaldo}
                        unit="×"
                        accent="text-rose"
                    />
                    <RankCard
                        title="🌟 La révélation"
                        subtitle="a possédé la plus grosse hausse de cote"
                        rows={fun.data?.raisingStar}
                        unit="×"
                        accent="text-rose"
                    />
                    <RankCard
                        title="🏆 Roi des podiums"
                        subtitle="le plus de podiums (top 3)"
                        rows={fun.data?.podiums}
                        unit=""
                        accent="text-jaune"
                    />
                    <RankCard
                        title="🔥 Série de titres"
                        subtitle="titres consécutifs"
                        rows={fun.data?.titleStreak}
                        unit=""
                        accent="text-rose"
                    />
                    <RankCard
                        title="🍸 Le Jean-Claude Duss"
                        subtitle="le plus de 2es places (du mal à conclure)"
                        rows={fun.data?.jeanClaudeDuss}
                        unit="×"
                        accent="text-violet-clair"
                    />
                    <RankCard
                        title="🏛️ Pilier de l'élite"
                        subtitle="le plus de saisons en D1"
                        rows={fun.data?.d1Seasons}
                        unit=""
                        accent="text-rose"
                    />
                    <RankCard
                        title="🔒 Indéboulonnable"
                        subtitle="saisons consécutives en D1"
                        rows={fun.data?.d1Streak}
                        unit=""
                        accent="text-rose"
                    />
                    <RankCard
                        title="📈 Montées"
                        subtitle="le plus de promotions"
                        rows={moveRows(movements.data?.promotions)}
                        unit=""
                        accent="text-menthe"
                    />
                    <RankCard
                        title="📉 Descentes"
                        subtitle="le plus de relégations"
                        rows={moveRows(movements.data?.relegations)}
                        unit=""
                        accent="text-rouge"
                    />
                    <RankCard
                        title="🎢 Yo-yo"
                        subtitle="le plus de montées + descentes"
                        rows={moveRows(movements.data?.yoyo)}
                        unit=""
                        accent="text-violet-clair"
                    />
                </div>
            </section>
        </div>
    );
}
