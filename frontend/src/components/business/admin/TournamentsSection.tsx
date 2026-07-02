import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/api/client";
import { SETTINGS_BARS, SettingsCard } from "@/components/business/settings/SettingsCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

interface AvailableTournament {
    mpgTournamentId: string;
    name: string;
    winner: string | null;
    tracked: boolean;
}
interface TrackedTournament {
    id: string;
    mpgTournamentId: string;
    name: string;
    active: boolean;
    competitionOverride: string | null;
}

interface TournamentRow {
    mpgTournamentId: string;
    name: string;
    trackedId?: string;
    active: boolean;
    inMyDashboard: boolean;
    winner?: string | null;
    competitionOverride: string | null;
}

const COMPETITION_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "Auto (par nom)" },
    { value: "LDC", label: "Ligue des Crampons" },
    { value: "UEFA", label: "Europa" },
    { value: "CONFERENCE", label: "Conférence" },
    { value: "OTHER", label: "Autre" },
];
const ICON: Record<string, string> = { LDC: "⭐", UEFA: "🎖️", CONFERENCE: "🍐", OTHER: "🏆" };

export function TournamentsSection({ canDelete }: { canDelete: boolean }) {
    const qc = useQueryClient();
    const [pending, setPending] = useState<TournamentRow | null>(null);
    const tracked = useQuery<TrackedTournament[]>({
        queryKey: ["tracked-tournaments"],
        queryFn: () => api<TrackedTournament[]>("/api/admin/tournaments"),
    });
    const available = useQuery<AvailableTournament[]>({
        queryKey: ["available-tournaments"],
        queryFn: () => api<AvailableTournament[]>("/api/admin/tournaments/available"),
    });

    const rows = useMemo<TournamentRow[]>(() => {
        const map = new Map<string, TournamentRow>();
        for (const t of tracked.data ?? []) {
            map.set(t.mpgTournamentId, {
                mpgTournamentId: t.mpgTournamentId,
                name: t.name,
                trackedId: t.id,
                active: t.active,
                inMyDashboard: false,
                competitionOverride: t.competitionOverride,
            });
        }
        for (const a of available.data ?? []) {
            const ex = map.get(a.mpgTournamentId);
            if (ex) {
                ex.inMyDashboard = true;
                ex.winner = a.winner;
            } else {
                map.set(a.mpgTournamentId, {
                    mpgTournamentId: a.mpgTournamentId,
                    name: a.name,
                    active: false,
                    inMyDashboard: true,
                    winner: a.winner,
                    competitionOverride: null,
                });
            }
        }
        return [...map.values()].sort((x, y) => {
            const gx = x.trackedId ? 0 : 1;
            const gy = y.trackedId ? 0 : 1;
            return gx - gy || x.name.localeCompare(y.name);
        });
    }, [tracked.data, available.data]);

    function invalidate() {
        qc.invalidateQueries({ queryKey: ["tracked-tournaments"] });
        qc.invalidateQueries({ queryKey: ["available-tournaments"] });
    }

    async function toggle(row: TournamentRow) {
        if (!row.trackedId) {
            await api("/api/admin/tournaments", {
                method: "POST",
                body: JSON.stringify({ mpgTournamentId: row.mpgTournamentId, name: row.name }),
            });
        } else {
            await api(`/api/admin/tournaments/${row.trackedId}`, {
                method: "PUT",
                body: JSON.stringify({ active: !row.active }),
            });
        }
        invalidate();
    }

    async function setCompetition(row: TournamentRow, value: string) {
        if (!row.trackedId) return;
        await api(`/api/admin/tournaments/${row.trackedId}`, {
            method: "PUT",
            body: JSON.stringify({ competitionOverride: value || null }),
        });
        invalidate();
    }

    async function remove(row: TournamentRow) {
        if (!row.trackedId) return;
        await api(`/api/admin/tournaments/${row.trackedId}`, { method: "DELETE" });
        invalidate();
    }

    return (
        <SettingsCard
            bar={SETTINGS_BARS.preferences}
            title="Tournois suivis"
            right={<span className="text-[11px] font-semibold text-texte-2">Type override</span>}
        >
            {available.isError && (
                <p className="mb-3 text-sm text-jaune">
                    Tes tournois MPG n'ont pas pu être lus. Les tournois déjà suivis restent affichés.
                </p>
            )}

            <div className="flex flex-col gap-2.5">
                {rows.map((t) => (
                    <div key={t.mpgTournamentId} className="lhm-row rounded-[14px] border border-bord bg-nuit p-3">
                        <div className="flex items-center gap-3">
                            <div className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-carte-2 text-[17px]">
                                {ICON[t.competitionOverride ?? ""] ?? "🏆"}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-display text-[12px] font-black tracking-[0.2px] text-white">
                                    {t.name}
                                </div>
                                <div className="mt-0.5 text-[10px] text-texte-2">
                                    {t.winner
                                        ? `🏆 ${t.winner}`
                                        : t.trackedId && !t.inMyDashboard
                                          ? "hors de ton compte MPG"
                                          : t.trackedId && !t.active
                                            ? "en pause"
                                            : ""}
                                </div>
                            </div>
                            <ToggleSwitch
                                on={!!t.trackedId && t.active}
                                onChange={() => toggle(t)}
                                label={`Suivre ${t.name}`}
                            />
                            {t.trackedId && canDelete && (
                                <button
                                    type="button"
                                    onClick={() => setPending(t)}
                                    title="Supprimer le tournoi et ses données"
                                    className="grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-rouge/30 bg-rouge/[0.07] font-display text-[15px] font-black text-[#FF6B8A] transition hover:border-rouge/60 hover:bg-rouge/15"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        {t.trackedId && (
                            <div className="mt-2.5 flex items-center gap-2.5 border-t border-bord pt-2.5">
                                <span className="font-display text-[9px] font-extrabold uppercase tracking-[1px] text-texte-2">
                                    Type de compétition
                                </span>
                                <select
                                    value={t.competitionOverride ?? ""}
                                    onChange={(e) => setCompetition(t, e.target.value)}
                                    className="flex-1 rounded-[10px] border border-bord bg-carte px-3 py-2 font-display text-[11px] font-black tracking-[0.5px] text-white outline-none transition focus:border-rose"
                                >
                                    {COMPETITION_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                ))}
                {rows.length === 0 && (
                    <p className="text-sm text-texte-2">{available.isLoading ? "Lecture de MPG…" : "Aucun tournoi."}</p>
                )}
            </div>

            <ConfirmDialog
                open={!!pending}
                onOpenChange={(o) => !o && setPending(null)}
                title="Supprimer le tournoi"
                description={
                    <>
                        Supprimer <b className="text-white">« {pending?.name} »</b> et ses données synchronisées ? Cette
                        action est irréversible.
                    </>
                }
                onConfirm={() => pending && remove(pending)}
            />
        </SettingsCard>
    );
}
