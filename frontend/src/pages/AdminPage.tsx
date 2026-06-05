import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { ManagerLabel } from "../components/Manager";

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

      <RolesSection />
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

function LeaguesSection() {
  const qc = useQueryClient();
  const [load, setLoad] = useState(false);
  const tracked = useQuery<TrackedLeague[]>({
    queryKey: ["tracked-leagues"],
    queryFn: () => api<TrackedLeague[]>("/api/admin/leagues"),
  });
  const available = useQuery<AvailableLeague[]>({
    queryKey: ["available-leagues"],
    queryFn: () => api<AvailableLeague[]>("/api/admin/leagues/available"),
    enabled: load,
  });

  async function toggle(l: AvailableLeague) {
    if (l.tracked) {
      const t = tracked.data?.find((x) => x.mpgLeagueId === l.mpgLeagueId);
      if (t) await api(`/api/admin/leagues/${t.id}`, { method: "DELETE" });
    } else {
      await api("/api/admin/leagues", {
        method: "POST",
        body: JSON.stringify({ mpgLeagueId: l.mpgLeagueId, name: l.name, shortId: l.shortId }),
      });
    }
    qc.invalidateQueries({ queryKey: ["tracked-leagues"] });
    qc.invalidateQueries({ queryKey: ["available-leagues"] });
  }

  return (
    <section className="bg-base-100 rounded-box shadow p-6">
      <h2 className="text-lg font-bold text-base-content mb-1">Ligues suivies</h2>
      <p className="text-sm opacity-60 mb-3">
        Seules les ligues suivies sont synchronisées. Les autres ligues MPG que tu rejoins
        sont ignorées.
      </p>

      <div className="text-sm opacity-70 mb-3">
        Suivies :{" "}
        {tracked.data?.length
          ? tracked.data.map((t) => t.name).join(", ")
          : "aucune"}
      </div>

      {!load ? (
        <button onClick={() => setLoad(true)} className="btn btn-sm">
          Charger mes ligues MPG
        </button>
      ) : available.isLoading ? (
        <p className="text-sm opacity-50">Lecture de MPG…</p>
      ) : available.error ? (
        <p className="text-sm text-error">{(available.error as Error).message}</p>
      ) : (
        <div className="divide-y">
          {available.data?.map((l) => (
            <div key={l.mpgLeagueId} className="flex items-center justify-between py-2">
              <div className="text-sm">
                <div className="font-medium text-base-content">{l.name}</div>
                <div className="opacity-50 text-xs">
                  {l.totalUsers} joueurs · {l.totalDivisions} divisions · saison {l.season}
                </div>
              </div>
              <button
                onClick={() => toggle(l)}
                className={`text-xs rounded-full px-3 py-1 border ${
                  l.tracked
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-base-100 opacity-60 border-base-300 hover:border-base-content/40"
                }`}
              >
                {l.tracked ? "✓ suivie" : "suivre"}
              </button>
            </div>
          ))}
        </div>
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

function TournamentsSection() {
  const qc = useQueryClient();
  const [load, setLoad] = useState(false);
  const tracked = useQuery<TrackedTournament[]>({
    queryKey: ["tracked-tournaments"],
    queryFn: () => api<TrackedTournament[]>("/api/admin/tournaments"),
  });
  const available = useQuery<AvailableTournament[]>({
    queryKey: ["available-tournaments"],
    queryFn: () => api<AvailableTournament[]>("/api/admin/tournaments/available"),
    enabled: load,
  });

  async function toggle(t: AvailableTournament) {
    if (t.tracked) {
      const x = tracked.data?.find((y) => y.mpgTournamentId === t.mpgTournamentId);
      if (x) await api(`/api/admin/tournaments/${x.id}`, { method: "DELETE" });
    } else {
      await api("/api/admin/tournaments", {
        method: "POST",
        body: JSON.stringify({ mpgTournamentId: t.mpgTournamentId, name: t.name }),
      });
    }
    qc.invalidateQueries({ queryKey: ["tracked-tournaments"] });
    qc.invalidateQueries({ queryKey: ["available-tournaments"] });
  }

  return (
    <section className="bg-base-100 rounded-box shadow p-6">
      <h2 className="text-lg font-bold text-base-content mb-1">Tournois suivis (coupes)</h2>
      <p className="text-sm opacity-60 mb-3">
        Seuls les tournois suivis sont synchronisés. Les autres coupes que tu rejoins sont ignorées.
      </p>

      <div className="text-sm opacity-70 mb-3">
        Suivis : {tracked.data?.length ? tracked.data.map((t) => t.name).join(", ") : "aucun"}
      </div>

      {!load ? (
        <button onClick={() => setLoad(true)} className="btn btn-sm">
          Charger mes tournois MPG
        </button>
      ) : available.isLoading ? (
        <p className="text-sm opacity-50">Lecture de MPG…</p>
      ) : available.error ? (
        <p className="text-sm text-error">{(available.error as Error).message}</p>
      ) : (
        <div className="divide-y">
          {available.data?.map((t) => (
            <div key={t.mpgTournamentId} className="flex items-center justify-between py-2">
              <div className="text-sm">
                <div className="font-medium text-base-content">{t.name}</div>
                {t.winner && <div className="opacity-50 text-xs">🏆 {t.winner}</div>}
              </div>
              <button
                onClick={() => toggle(t)}
                className={`text-xs rounded-full px-3 py-1 border ${
                  t.tracked
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-base-100 opacity-60 border-base-300 hover:border-base-content/40"
                }`}
              >
                {t.tracked ? "✓ suivi" : "suivre"}
              </button>
            </div>
          ))}
        </div>
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
