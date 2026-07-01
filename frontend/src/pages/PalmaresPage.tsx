import { useQuery } from "@tanstack/react-query";
import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { api } from "@/api/client";
import { CupColumn } from "@/components/business/palmares/CupColumn";
import type { CupCount, CupRow, DivisionWinner } from "@/components/business/palmares/types";
import { Empty } from "@/components/ui/Empty";
import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const selectClass =
    "h-9 min-w-0 flex-1 rounded-xl border border-bord bg-carte px-3 text-sm text-white outline-none focus:border-rose";

export default function PalmaresPage() {
    const winners = useQuery({
        queryKey: ["winners"],
        queryFn: () => api<{ divisionWinners: DivisionWinner[] }>("/api/palmares/winners"),
    });
    const cups = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ list: CupRow[]; ranking: CupCount[] }>("/api/palmares/tournaments"),
    });

    const [fSeason, setFSeason] = useState("");
    const [fDiv, setFDiv] = useState("");
    const allWinners = winners.data?.divisionWinners ?? [];
    const seasonOptions = [...new Set(allWinners.map((w) => w.realSeason))];
    const divisionOptions = [...new Set(allWinners.map((w) => w.division))].sort();
    const filteredWinners = allWinners.filter(
        (w) => (!fSeason || w.realSeason === fSeason) && (!fDiv || w.division === fDiv),
    );

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <SectionTitle>🏆 Coupes</SectionTitle>
                {cups.data?.ranking.length ? (
                    <div className="flex flex-wrap gap-2">
                        {cups.data.ranking.map((m, i) => (
                            <span
                                key={m.managerId}
                                className="inline-flex items-center gap-1.5 rounded-full border border-bord bg-carte px-3 py-1.5 text-sm font-medium text-white"
                            >
                                <span className="font-display text-xs font-black text-texte-2">{i + 1}.</span>
                                {m.manager}
                                <span className="tracking-tight">
                                    {"⭐".repeat(m.ldc)}
                                    {"🎖️".repeat(m.uefa)}
                                    {"🍐".repeat(m.conference)}
                                </span>
                            </span>
                        ))}
                    </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-3">
                    <CupColumn
                        title="Ligue des Crampons"
                        icon="⭐"
                        accent="var(--color-menthe)"
                        rows={cups.data?.list.filter((c) => c.competition === "LDC")}
                    />
                    <CupColumn
                        title="Heureux papa's League"
                        icon="🎖️"
                        accent="var(--color-jaune)"
                        rows={cups.data?.list.filter((c) => c.competition === "UEFA")}
                    />
                    <CupColumn
                        title="…League Conference"
                        icon="🍐"
                        accent="var(--color-violet-clair)"
                        rows={cups.data?.list.filter((c) => c.competition === "CONFERENCE")}
                    />
                </div>
            </section>

            <section className="space-y-4">
                <SectionTitle>Vainqueurs par saison</SectionTitle>
                {allWinners.length ? (
                    <>
                        <div className="flex gap-2">
                            <select
                                value={fSeason}
                                onChange={(e) => setFSeason(e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Toutes les saisons</option>
                                {seasonOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                            <select value={fDiv} onChange={(e) => setFDiv(e.target.value)} className={selectClass}>
                                <option value="">Toutes les divisions</option>
                                {divisionOptions.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                            {(fSeason || fDiv) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFSeason("");
                                        setFDiv("");
                                    }}
                                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-bord bg-carte text-texte-2 transition hover:text-white"
                                    aria-label="Réinitialiser"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Mobile : cartes */}
                        <div className="space-y-2 sm:hidden">
                            {filteredWinners.map((w, i) => (
                                <div key={i} className="rounded-2xl border border-bord bg-carte p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <ManagerLabel
                                            managerId={w.managerId}
                                            name={w.winner}
                                            username={w.username}
                                            avatarUrl={w.avatarUrl}
                                            size={26}
                                        />
                                        <span className="shrink-0 rounded-full bg-carte-2 px-2 py-0.5 text-xs font-semibold text-texte-2">
                                            {w.division}
                                        </span>
                                    </div>
                                    {w.team && <div className="mt-1 text-sm italic text-texte-2">🏟️ {w.team}</div>}
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-xs text-texte-2">{w.season}</span>
                                        {w.mpgUrl && (
                                            <a
                                                href={w.mpgUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-orange"
                                            >
                                                MPG <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop : tableau */}
                        <div className="hidden overflow-hidden rounded-2xl border border-bord bg-carte sm:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-bord hover:bg-transparent">
                                        <TableHead className="text-texte-2">Saison</TableHead>
                                        <TableHead className="text-texte-2">Division</TableHead>
                                        <TableHead className="text-texte-2">Vainqueur</TableHead>
                                        <TableHead className="text-texte-2">Équipe</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWinners.map((w, i) => (
                                        <TableRow key={i} className="border-bord hover:bg-carte-2/40">
                                            <TableCell className="whitespace-nowrap text-texte-2">{w.season}</TableCell>
                                            <TableCell className="text-white">{w.division}</TableCell>
                                            <TableCell className="text-white">
                                                <ManagerLabel
                                                    managerId={w.managerId}
                                                    name={w.winner}
                                                    username={w.username}
                                                    avatarUrl={w.avatarUrl}
                                                    size={26}
                                                />
                                            </TableCell>
                                            <TableCell className="italic text-texte-2">{w.team ?? "—"}</TableCell>
                                            <TableCell>
                                                {w.mpgUrl && (
                                                    <a
                                                        href={w.mpgUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-texte-2 transition hover:text-orange"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <Empty />
                )}
            </section>
        </div>
    );
}
