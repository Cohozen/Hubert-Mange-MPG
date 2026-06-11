import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";
import { api } from "@/api/client";

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

// Options du type de coupe forcé ("" = détection auto par nom).
const COMPETITION_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "Auto (par nom)" },
    { value: "LDC", label: "Ligue des Crampons" },
    { value: "UEFA", label: "Europa (Heureux papa's)" },
    { value: "CONFERENCE", label: "Conference" },
    { value: "OTHER", label: "Autre" },
];

export function TournamentsSection({ canDelete }: { canDelete: boolean }) {
    const qc = useQueryClient();
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
        if (!confirm(`Supprimer « ${row.name} » et ses données synchronisées ?`)) return;
        await api(`/api/admin/tournaments/${row.trackedId}`, { method: "DELETE" });
        invalidate();
    }

    return (
        <section className="bg-base-100 rounded-box shadow p-6">
            <h2 className="text-lg font-bold text-base-content mb-1">Tournois suivis (coupes)</h2>
            <p className="text-sm opacity-60 mb-3 text-justify">
                Coche un tournoi pour le synchroniser. Décocher met le sync en pause. Le type de coupe est déduit du nom.
                Force-le via le menu si la détection se trompe.
            </p>

            {available.isError && (
                <p className="text-sm text-warning mb-2">
                    Tes tournois MPG n'ont pas pu être lus ({(available.error as Error).message}). Tu vois quand même
                    les tournois déjà suivis ci-dessous.
                </p>
            )}

            <div className="divide-y">
                {rows.map((t) => (
                    <div key={t.mpgTournamentId} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
                        <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-success shrink-0"
                                checked={!!t.trackedId && t.active}
                                onChange={() => toggle(t)}
                            />
                            <span className=" flex flex-col gap-1 text-sm min-w-0 flex-1">
                                <span className="font-medium text-base-content flex flex-wrap items-center gap-1">
                                    <span className="break-words">{t.name}</span>
                                    {t.trackedId && !t.active && (
                                        <span className="badge badge-ghost badge-sm shrink-0">en pause</span>
                                    )}
                                </span>
                                <span className="opacity-50 text-xs block">
                                    {t.winner
                                        ? `🏆 ${t.winner}`
                                        : t.trackedId && !t.inMyDashboard
                                            ? "hors de ton compte MPG"
                                            : ""}
                                </span>

                            </span>
                            {t.trackedId && canDelete && (
                                <button
                                    onClick={() => remove(t)}
                                    title="Supprimer le tournoi et ses données"
                                    className="text-xs rounded-full p-2 border border-base-300 text-error hover:border-error"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </label>
                        <div className="flex items-center gap-2 shrink-0 sm:self-auto pl-8 sm:pl-0">
                            {t.trackedId && (
                                <select
                                    value={t.competitionOverride ?? ""}
                                    onChange={(e) => setCompetition(t, e.target.value)}
                                    title="Type de coupe (auto par défaut, déduit du nom)"
                                    className="select select-bordered select-xs sm:select-sm max-w-[10rem]"
                                >
                                    {COMPETITION_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                ))}
                {rows.length === 0 && (
                    <p className="text-sm opacity-50 py-2">
                        {available.isLoading ? "Lecture de MPG…" : "Aucun tournoi."}
                    </p>
                )}
            </div>
            {available.isLoading && rows.length > 0 && (
                <p className="text-xs opacity-40 mt-2">Lecture de tes tournois MPG…</p>
            )}
        </section>
    );
}
