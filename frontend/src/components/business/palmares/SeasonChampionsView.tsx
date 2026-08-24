import { useState } from "react";
import { Link } from "react-router-dom";
import type { DivisionWinner } from "@/components/business/palmares/types";
import { divisionStyle } from "@/components/business/stats/playerStyle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Couleur du texte sur la pastille + libellé (les couleurs viennent de `divisionStyle`). */
const DIV_LABEL: Record<number, { txt: string; label: string }> = {
    1: { txt: "#3D2E00", label: "Division 1 · Élite" },
    2: { txt: "#ffffff", label: "Division 2" },
    3: { txt: "#ffffff", label: "Division 3" },
    4: { txt: "#3D2E00", label: "Division 4" },
    5: { txt: "#06251A", label: "Division 5" },
    6: { txt: "#0A0E27", label: "Division 6" },
};
const NEUTRAL_LABEL = { txt: "#0A0E27", label: "Division" };
const divStyle = (level: number) => {
    const { c, grad } = divisionStyle(level);
    return { color: c, grad, ...(DIV_LABEL[level] ?? NEUTRAL_LABEL) };
};

function initials(name?: string | null) {
    if (!name) return "—";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

const triggerClass = "h-[42px] rounded-xl border-bord bg-carte font-display text-xs font-extrabold lg:h-[46px]";

/** Vue « Saisons » du Palmarès : filtres + champions de division. */
export function SeasonChampionsView({ winners }: { winners: DivisionWinner[] }) {
    const [fSeason, setFSeason] = useState("all");
    const [fDiv, setFDiv] = useState("all");

    const seasons = [...new Set(winners.map((w) => w.realSeason))];
    const levels = [...new Set(winners.map((w) => w.level))].sort((a, b) => a - b);
    const rows = winners.filter(
        (w) => (fSeason === "all" || w.realSeason === fSeason) && (fDiv === "all" || String(w.level) === fDiv),
    );

    return (
        <div>
            {/* Filtres */}
            <div className="mb-3 flex items-center gap-2 lg:mb-5 lg:gap-3.5">
                <div className="mr-1 hidden font-display text-[22px] font-black tracking-[-0.5px] text-white lg:block">
                    Les Champions
                </div>
                <Select value={fSeason} onValueChange={setFSeason}>
                    <SelectTrigger className={`${triggerClass} flex-1 lg:min-w-[210px] lg:flex-none`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les saisons</SelectItem>
                        {seasons.map((s) => (
                            <SelectItem key={s} value={s}>
                                Saison {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={fDiv} onValueChange={setFDiv}>
                    <SelectTrigger className={`${triggerClass} flex-1 lg:min-w-[200px] lg:flex-none`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes divisions</SelectItem>
                        {levels.map((l) => (
                            <SelectItem key={l} value={String(l)}>
                                Division {l}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="ml-auto hidden font-display text-[11px] font-extrabold uppercase tracking-[1px] text-texte-2 lg:block">
                    {rows.length} champions
                </div>
            </div>

            <div className="mb-3 font-display text-[10px] font-extrabold uppercase tracking-[1.5px] text-texte-2 lg:hidden">
                {rows.length} champions · du + récent au + ancien
            </div>

            {rows.length === 0 ? (
                <div className="rounded-[18px] border border-bord bg-carte px-5 py-14 text-center text-texte-2">
                    <div className="mb-3 text-[40px]">🏟️</div>
                    <div className="font-display text-lg font-black text-white">Aucun champion</div>
                    <div className="mt-1.5 text-[13px]">Ajuste tes filtres pour explorer d'autres sacres.</div>
                </div>
            ) : (
                <>
                    {/* Mobile : cartes */}
                    <div className="flex flex-col gap-2 lg:hidden">
                        {rows.map((w, i) => {
                            const d = divStyle(w.level);
                            return (
                                <div
                                    key={`${w.realSeason}-${w.division}-${i}`}
                                    className="lhm-row relative flex items-center gap-[11px] overflow-hidden rounded-[13px] border border-bord bg-carte px-3 py-2.5"
                                >
                                    <span className="absolute inset-y-0 left-0 w-1" style={{ background: d.color }} />
                                    <div
                                        className="grid size-[38px] shrink-0 place-items-center rounded-[11px] font-display text-sm font-black"
                                        style={{ background: d.grad, color: d.txt }}
                                    >
                                        {initials(w.winner)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline gap-1.5">
                                            {w.managerId ? (
                                                <Link
                                                    to={`/profil/${w.managerId}`}
                                                    className="truncate font-display text-sm font-extrabold text-white hover:underline"
                                                >
                                                    {w.winner ?? "—"}
                                                </Link>
                                            ) : (
                                                <span className="truncate font-display text-sm font-extrabold text-white">
                                                    {w.winner ?? "—"}
                                                </span>
                                            )}
                                            {w.username && (
                                                <span className="shrink-0 text-[11px] font-medium text-texte-2">
                                                    {w.username}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <span
                                                className="font-display text-[9px] font-black tracking-[0.5px]"
                                                style={{ color: d.color }}
                                            >
                                                D{w.level}
                                            </span>
                                            <span className="text-[11px] text-texte-2">· {d.label}</span>
                                        </div>
                                    </div>
                                    <span className="shrink-0 font-display text-[13px] font-black text-texte-2">
                                        {w.realSeason} - S{w.season.split(" ")[3] ?? "?"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop : tableau */}
                    <div className="hidden overflow-hidden rounded-[18px] border border-bord bg-carte lg:block">
                        <div className="grid grid-cols-[150px_250px_1fr_120px] gap-4 border-b border-bord bg-nuit px-6 py-3.5 text-[10px] font-bold uppercase tracking-[1.5px] text-texte-2">
                            <div>Saison</div>
                            <div>Division</div>
                            <div>Champion</div>
                            <div className="text-right">Profil</div>
                        </div>
                        {rows.map((w, i) => {
                            const d = divStyle(w.level);
                            return (
                                <div
                                    key={`${w.realSeason}-${w.division}-${i}`}
                                    className="grid grid-cols-[150px_250px_1fr_120px] items-center gap-4 border-b border-carte-2 px-6 py-3.5 transition hover:bg-carte-2/40"
                                >
                                    <div className="font-display text-[17px] font-black text-white">{w.realSeason} - S{w.season.split(" ")[3] ?? "?"}</div>
                                    <div className="flex items-center gap-[11px]">
                                        <span
                                            className="inline-flex h-[30px] min-w-9 items-center justify-center rounded-[9px] px-[11px] font-display text-[13px] font-black"
                                            style={{ background: d.grad, color: d.txt }}
                                        >
                                            D{w.level}
                                        </span>
                                        <span className="text-[13px] font-semibold text-[#C7CEEF]">{d.label}</span>
                                    </div>
                                    <div className="flex items-center gap-[13px]">
                                        <div
                                            className="grid size-[42px] shrink-0 place-items-center rounded-xl font-display text-[15px] font-black"
                                            style={{ background: d.grad, color: d.txt }}
                                        >
                                            {initials(w.winner)}
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            {w.managerId ? (
                                                <Link
                                                    to={`/profil/${w.managerId}`}
                                                    className="font-display text-base font-extrabold text-white hover:underline"
                                                >
                                                    {w.winner ?? "—"}
                                                </Link>
                                            ) : (
                                                <span className="font-display text-base font-extrabold text-white">
                                                    {w.winner ?? "—"}
                                                </span>
                                            )}
                                            {w.username && (
                                                <span className="text-xs font-medium text-texte-2">{w.username}</span>
                                            )}
                                        </div>
                                    </div>
                                    {w.managerId ? (
                                        <Link
                                            to={`/profil/${w.managerId}`}
                                            className="justify-self-end font-display text-xs font-black uppercase text-orange transition hover:opacity-70"
                                        >
                                            Voir →
                                        </Link>
                                    ) : (
                                        <span className="justify-self-end text-texte-2">—</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
