import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@/api/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface AvailableLeague {
    mpgLeagueId: string;
    shortId: string;
    name: string;
    totalUsers: number;
    totalDivisions: number;
    season: number;
    tracked: boolean;
}
interface TrackedLeague {
    id: string;
    mpgLeagueId: string;
    name: string;
    active: boolean;
}

// Ligne fusionnée : une ligue suivie (globale, visible par tous les admins) et/ou disponible dans
// le dashboard MPG de l'admin connecté. La checkbox = « synchronisée » (suivie ET active).
interface LeagueRow {
    mpgLeagueId: string;
    name: string;
    trackedId?: string; // présent si suivie
    active: boolean; // pertinent si suivie
    inMyDashboard: boolean; // présente dans mes ligues MPG (mon token)
    shortId?: string;
    totalUsers?: number;
    totalDivisions?: number;
    season?: number;
}

export function LeaguesSection({ canDelete }: { canDelete: boolean }) {
    const qc = useQueryClient();
    const [pending, setPending] = useState<LeagueRow | null>(null);
    const tracked = useQuery<TrackedLeague[]>({
        queryKey: ["tracked-leagues"],
        queryFn: () => api<TrackedLeague[]>("/api/admin/leagues"),
    });
    const available = useQuery<AvailableLeague[]>({
        queryKey: ["available-leagues"],
        queryFn: () => api<AvailableLeague[]>("/api/admin/leagues/available"),
    });

    const rows = useMemo<LeagueRow[]>(() => {
        const map = new Map<string, LeagueRow>();
        for (const t of tracked.data ?? []) {
            map.set(t.mpgLeagueId, {
                mpgLeagueId: t.mpgLeagueId,
                name: t.name,
                trackedId: t.id,
                active: t.active,
                inMyDashboard: false,
            });
        }
        for (const a of available.data ?? []) {
            const ex = map.get(a.mpgLeagueId);
            if (ex) {
                ex.inMyDashboard = true;
                ex.shortId = a.shortId;
                ex.totalUsers = a.totalUsers;
                ex.totalDivisions = a.totalDivisions;
                ex.season = a.season;
            } else {
                map.set(a.mpgLeagueId, {
                    mpgLeagueId: a.mpgLeagueId,
                    name: a.name,
                    active: false,
                    inMyDashboard: true,
                    shortId: a.shortId,
                    totalUsers: a.totalUsers,
                    totalDivisions: a.totalDivisions,
                    season: a.season,
                });
            }
        }
        // Suivies d'abord, puis disponibles à ajouter ; alpha dans chaque groupe.
        return [...map.values()].sort((x, y) => {
            const gx = x.trackedId ? 0 : 1;
            const gy = y.trackedId ? 0 : 1;
            return gx - gy || x.name.localeCompare(y.name);
        });
    }, [tracked.data, available.data]);

    function invalidate() {
        qc.invalidateQueries({ queryKey: ["tracked-leagues"] });
        qc.invalidateQueries({ queryKey: ["available-leagues"] });
    }

    // Checkbox : crée le suivi si absent, sinon bascule active (gèle/réactive le sync).
    async function toggle(row: LeagueRow) {
        if (!row.trackedId) {
            await api("/api/admin/leagues", {
                method: "POST",
                body: JSON.stringify({
                    mpgLeagueId: row.mpgLeagueId,
                    name: row.name,
                    shortId: row.shortId,
                }),
            });
        } else {
            await api(`/api/admin/leagues/${row.trackedId}`, {
                method: "PUT",
                body: JSON.stringify({ active: !row.active }),
            });
        }
        invalidate();
    }

    async function remove(row: LeagueRow) {
        if (!row.trackedId) return;
        await api(`/api/admin/leagues/${row.trackedId}`, { method: "DELETE" });
        invalidate();
    }

    return (
        <section className="rounded-2xl border border-bord bg-carte p-6">
            <h2 className="mb-1 font-display text-lg font-black text-white">Ligues suivies</h2>
            <p className="mb-3 text-sm text-texte-2">
                Coche une ligue pour la synchroniser. Décocher met le sync en pause (les données déjà synchronisées
                restent dans le classement). « Supprimer » efface la ligue et ses données.
            </p>

            {available.isError && (
                <p className="mb-2 text-sm text-jaune">
                    Tes ligues MPG n'ont pas pu être lues ({(available.error as Error).message}). Tu vois quand même les
                    ligues déjà suivies ci-dessous.
                </p>
            )}

            <div className="divide-y divide-bord">
                {rows.map((l) => (
                    <div key={l.mpgLeagueId} className="flex items-center justify-between gap-2 py-2">
                        <label className="flex min-w-0 cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                className="size-4 shrink-0 accent-menthe"
                                checked={!!l.trackedId && l.active}
                                onChange={() => toggle(l)}
                            />
                            <span className="min-w-0 text-sm">
                                <span className="flex items-center gap-2 font-medium text-white">
                                    <span className="truncate">{l.name}</span>
                                    {l.trackedId && !l.active && (
                                        <span className="shrink-0 rounded-full bg-carte-2 px-2 py-0.5 text-xs text-texte-2">
                                            en pause
                                        </span>
                                    )}
                                </span>
                                <span className="block text-xs text-texte-2">
                                    {l.totalUsers != null
                                        ? `${l.totalUsers} joueurs · ${l.totalDivisions} divisions · saison ${l.season}`
                                        : l.trackedId && !l.inMyDashboard
                                          ? "hors de ton compte MPG"
                                          : ""}
                                </span>
                            </span>
                        </label>
                        {l.trackedId && canDelete && (
                            <button
                                type="button"
                                onClick={() => setPending(l)}
                                title="Supprimer la ligue et ses données"
                                className="rounded-full border border-bord p-2 text-rouge transition hover:border-rouge"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
                {rows.length === 0 && (
                    <p className="py-2 text-sm text-texte-2">
                        {available.isLoading ? "Lecture de MPG…" : "Aucune ligue."}
                    </p>
                )}
            </div>
            {available.isLoading && rows.length > 0 && (
                <p className="mt-2 text-xs text-texte-2">Lecture de tes ligues MPG…</p>
            )}

            <ConfirmDialog
                open={!!pending}
                onOpenChange={(o) => !o && setPending(null)}
                title="Supprimer la ligue"
                description={
                    <>
                        Supprimer <b className="text-white">« {pending?.name} »</b> et toutes ses données synchronisées
                        (classements, matchs, trophées) ? Cette action est irréversible.
                    </>
                }
                onConfirm={() => pending && remove(pending)}
            />
        </section>
    );
}
