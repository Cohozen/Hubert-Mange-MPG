import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { api } from "../api/client";
import { ManagerLabel } from "../components/Manager";
import { isSuperadmin, useAuth } from "../auth/useAuth";

interface SyncRun {
  trigger: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  summary: {
    leagues: number;
    gameSeasons: number;
    divisions: number;
    managers: number;
    participations: number;
    notes: string[];
  } | null;
}

export default function AdminPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const { data: me } = useAuth();

  const last = useQuery<SyncRun | null>({
    queryKey: ["sync-last"],
    queryFn: () => api<SyncRun | null>("/api/sync/last"),
  });

  async function runSync() {
    setError(null);
    setLoading(true);
    try {
      await api("/api/sync", { method: "POST" });
      await qc.invalidateQueries({ queryKey: ["sync-last"] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const run = last.data;

  return (
    <div className="max-w-5xl columns-1 lg:columns-2 gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid">
      <section className="bg-base-100 rounded-box shadow p-6 space-y-3">
        <h2 className="text-lg font-bold text-base-content">Synchronisation MPG</h2>
        <p className="text-sm opacity-60">
          Synchro automatique chaque lundi matin (résultats publiés vers 8h). Tu peux aussi
          la déclencher manuellement.
        </p>
        <button onClick={runSync} disabled={loading} className="btn btn-primary">
          {loading && <span className="loading loading-spinner loading-sm" />}
          {loading ? "Sync en cours…" : "Lancer le sync maintenant"}
        </button>
        {error && <p className="text-sm text-error">{error}</p>}

        {run && (
          <div className="border-t pt-3 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  run.status === "success"
                    ? "bg-success"
                    : run.status === "error"
                      ? "bg-red-500"
                      : "bg-amber-400"
                }`}
              />
              <span className="font-medium text-base-content">
                Dernière synchro : {run.status} ({run.trigger})
              </span>
              <span className="opacity-50">
                {new Date(run.startedAt).toLocaleString("fr-FR")}
              </span>
            </div>
            {run.summary && (
              <p className="opacity-60 mt-1">
                {run.summary.leagues} ligue(s) · {run.summary.gameSeasons} saisons ·{" "}
                {run.summary.divisions} divisions · {run.summary.managers} managers
              </p>
            )}
            {run.error && <p className="text-error mt-1">{run.error}</p>}
          </div>
        )}
      </section>

      <LeaguesSection />

      <TournamentsSection />

      {isSuperadmin(me) && <RolesSection />}
    </div>
  );
}

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

function LeaguesSection() {
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
            {l.trackedId && (
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
}

interface TournamentRow {
  mpgTournamentId: string;
  name: string;
  trackedId?: string;
  active: boolean;
  inMyDashboard: boolean;
  winner?: string | null;
}

function TournamentsSection() {
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

  async function remove(row: TournamentRow) {
    if (!row.trackedId) return;
    if (!confirm(`Supprimer « ${row.name} » et ses données synchronisées ?`)) return;
    await api(`/api/admin/tournaments/${row.trackedId}`, { method: "DELETE" });
    invalidate();
  }

  return (
    <section className="bg-base-100 rounded-box shadow p-6">
      <h2 className="text-lg font-bold text-base-content mb-1">Tournois suivis (coupes)</h2>
      <p className="text-sm opacity-60 mb-3">
        Coche un tournoi pour le synchroniser. Décocher met le sync en pause. « Supprimer » efface
        le tournoi et ses données.
      </p>

      {available.isError && (
        <p className="text-sm text-warning mb-2">
          Tes tournois MPG n'ont pas pu être lus ({(available.error as Error).message}). Tu vois
          quand même les tournois déjà suivis ci-dessous.
        </p>
      )}

      <div className="divide-y">
        {rows.map((t) => (
          <div key={t.mpgTournamentId} className="flex items-center justify-between gap-2 py-2">
            <label className="flex items-center gap-3 min-w-0 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-success shrink-0"
                checked={!!t.trackedId && t.active}
                onChange={() => toggle(t)}
              />
              <span className="text-sm min-w-0">
                <span className="font-medium text-base-content flex items-center gap-2">
                  <span className="truncate">{t.name}</span>
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
            </label>
            {t.trackedId && (
              <button
                onClick={() => remove(t)}
                title="Supprimer le tournoi et ses données"
                className="text-xs rounded-full p-2 border border-base-300 text-error hover:border-error"
              >
                <Trash2 size={14} />
              </button>
            )}
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

interface ManagerRow {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  roles: string[];
}

const ASSIGNABLE = [
  { code: "ADMIN", label: "Admin league" },
  { code: "TREASURER", label: "Banquier" },
];

function RolesSection() {
  const qc = useQueryClient();
  const managers = useQuery<ManagerRow[]>({
    queryKey: ["admin-managers"],
    queryFn: () => api<ManagerRow[]>("/api/admin/managers"),
  });

  async function toggle(m: ManagerRow, code: string) {
    const next = m.roles.includes(code)
      ? m.roles.filter((r) => r !== code)
      : [...m.roles.filter((r) => r !== "SUPERADMIN"), code];
    await api(`/api/admin/managers/${m.id}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles: next.filter((r) => r !== "SUPERADMIN") }),
    });
    qc.invalidateQueries({ queryKey: ["admin-managers"] });
  }

  return (
    <section className="bg-base-100 rounded-box shadow p-6">
      <h2 className="text-lg font-bold text-base-content mb-1">Rôles</h2>
      <p className="text-sm opacity-60 mb-4">
        Attribue les rôles. Le superadmin (toi) est défini par ton compte MPG en config.
      </p>
      <div className="max-h-96 overflow-auto divide-y">
        {managers.data?.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 py-2">
            <span className="flex items-center gap-2 min-w-0 text-sm">
              <ManagerLabel name={m.displayName} username={m.username} avatarUrl={m.avatarUrl} size={26} />
              {m.roles.includes("SUPERADMIN") && (
                <span className="text-xs text-primary font-medium shrink-0">superadmin</span>
              )}
            </span>
            <div className="flex gap-2 shrink-0">
              {ASSIGNABLE.map((role) => {
                const active = m.roles.includes(role.code);
                return (
                  <button
                    key={role.code}
                    onClick={() => toggle(m, role.code)}
                    disabled={m.roles.includes("SUPERADMIN")}
                    className={`text-xs rounded-full px-3 py-1 border disabled:opacity-40 ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-base-100 opacity-60 border-base-300 hover:border-base-content/40"
                    }`}
                  >
                    {role.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
