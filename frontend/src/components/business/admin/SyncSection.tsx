import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

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

export function SyncSection() {
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
    <section className="bg-base-100 rounded-box shadow p-6 space-y-3">
      <h2 className="text-lg font-bold text-base-content">Synchronisation MPG</h2>
      <p className="text-sm opacity-60">
        Synchro automatique chaque lundi matin (résultats publiés vers 8h). Tu peux aussi la
        déclencher manuellement.
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
            <span className="opacity-50">{new Date(run.startedAt).toLocaleString("fr-FR")}</span>
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
  );
}
