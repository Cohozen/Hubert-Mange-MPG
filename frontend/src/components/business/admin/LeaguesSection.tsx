import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { api } from "@/api/client";

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
        body: JSON.stringify({ mpgLeagueId: row.mpgLeagueId, name: row.name, shortId: row.shortId }),
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
    if (!confirm(`Supprimer « ${row.name} » et toutes ses données synchronisées ?`)) return;
    await api(`/api/admin/leagues/${row.trackedId}`, { method: "DELETE" });
    invalidate();
  }

  return (
    <section className="bg-base-100 rounded-box shadow p-6">
      <h2 className="text-lg font-bold text-base-content mb-1">Ligues suivies</h2>
      <p className="text-sm opacity-60 mb-3">
        Coche une ligue pour la synchroniser. Décocher met le sync en pause (les données déjà
        synchronisées restent dans le classement). « Supprimer » efface la ligue et ses données.
      </p>

      {available.isError && (
        <p className="text-sm text-warning mb-2">
          Tes ligues MPG n'ont pas pu être lues ({(available.error as Error).message}). Tu vois
          quand même les ligues déjà suivies ci-dessous.
        </p>
      )}

      <div className="divide-y">
        {rows.map((l) => (
          <div key={l.mpgLeagueId} className="flex items-center justify-between gap-2 py-2">
            <label className="flex items-center gap-3 min-w-0 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-success shrink-0"
                checked={!!l.trackedId && l.active}
                onChange={() => toggle(l)}
              />
              <span className="text-sm min-w-0">
                <span className="font-medium text-base-content flex items-center gap-2">
                  <span className="truncate">{l.name}</span>
                  {l.trackedId && !l.active && (
                    <span className="badge badge-ghost badge-sm shrink-0">en pause</span>
                  )}
                </span>
                <span className="opacity-50 text-xs block">
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
                onClick={() => remove(l)}
                title="Supprimer la ligue et ses données"
                className="text-xs rounded-full p-2 border border-base-300 text-error hover:border-error"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm opacity-50 py-2">
            {available.isLoading ? "Lecture de MPG…" : "Aucune ligue."}
          </p>
        )}
      </div>
      {available.isLoading && rows.length > 0 && (
        <p className="text-xs opacity-40 mt-2">Lecture de tes ligues MPG…</p>
      )}
    </section>
  );
}
