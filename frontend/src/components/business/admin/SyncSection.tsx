import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <section className="space-y-3 rounded-2xl border border-bord bg-carte p-6">
            <h2 className="font-display text-lg font-black text-white">Synchronisation MPG</h2>
            <p className="text-sm text-texte-2">
                Synchro automatique chaque lundi matin. Tu peux aussi la déclencher manuellement.
            </p>
            <Button onClick={runSync} disabled={loading} variant="energy">
                {loading ? "Sync en cours…" : "Lancer le sync maintenant"}
            </Button>
            {error && <p className="text-sm text-rouge">{error}</p>}

            {run && (
                <div className="border-t border-bord pt-3 text-sm">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                            className={cn(
                                "inline-block size-2 shrink-0 rounded-full",
                                run.status === "success"
                                    ? "bg-menthe"
                                    : run.status === "error"
                                      ? "bg-rouge"
                                      : "bg-jaune",
                            )}
                        />
                        <span className="font-medium text-white">
                            Dernière synchro : {run.status} ({run.trigger})
                        </span>
                        <span className="w-full pl-4 text-texte-2 sm:w-auto sm:pl-0">
                            {new Date(run.startedAt).toLocaleString("fr-FR")}
                        </span>
                    </div>
                    {run.summary && (
                        <p className="mt-1 text-texte-2">
                            {run.summary.leagues} ligues · {run.summary.gameSeasons} saisons · {run.summary.divisions}{" "}
                            divisions · {run.summary.managers} managers
                        </p>
                    )}
                    {run.error && <p className="mt-1 text-rouge">{run.error}</p>}
                </div>
            )}
        </section>
    );
}
