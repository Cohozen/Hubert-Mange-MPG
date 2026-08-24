import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api/client";
import { SETTINGS_BARS, SettingsCard } from "@/components/business/settings/SettingsCard";

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

interface SyncConfig {
    enabled: boolean;
    cron: string;
    tz: string;
    nextRun: string | null;
    credentialsOk: boolean;
}

/** « lundi 25 août à 08:30 » */
function formatNextRun(iso: string): string {
    return new Date(iso).toLocaleString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function SyncSection() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const qc = useQueryClient();

    const last = useQuery<SyncRun | null>({
        queryKey: ["sync-last"],
        queryFn: () => api<SyncRun | null>("/api/sync/last"),
    });
    // État réel du cron côté serveur : AUTO_SYNC et identifiants admin MPG.
    const schedule = useQuery<SyncConfig>({
        queryKey: ["sync-config"],
        queryFn: () => api<SyncConfig>("/api/sync/config"),
    });

    async function runSync() {
        setError(null);
        setLoading(true);
        try {
            await api("/api/sync", { method: "POST" });
            // Le sync réécrit palmarès, stats, cagnotte et dashboard : tout le cache est périmé.
            await qc.invalidateQueries();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const run = last.data;
    const ok = run?.status === "success";
    const auto = schedule.data;

    return (
        <SettingsCard
            bar={SETTINGS_BARS.profil}
            title="Synchronisation MPG"
            right={
                <span className="rounded-full border border-violet-clair/40 bg-violet-clair/[0.12] px-2.5 py-1 font-display text-[9px] font-black uppercase tracking-[1px] text-violet-clair">
                    API
                </span>
            }
        >
            <button
                type="button"
                onClick={runSync}
                disabled={loading}
                className="lhm-btn flex w-full items-center justify-center gap-2.5 rounded-[14px] py-[15px] font-display text-sm font-black uppercase tracking-[1.5px] text-white shadow-[0_8px_22px_rgba(255,45,120,.32)] grad-banner transition hover:brightness-110 disabled:opacity-60"
            >
                {loading ? (
                    <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                        Synchronisation…
                    </>
                ) : (
                    <>
                        <span className="size-3 rounded-full border-2 border-white" />
                        Synchroniser MPG
                    </>
                )}
            </button>
            {error && <p className="mt-3 text-sm text-rouge">{error}</p>}

            {run && (
                <div
                    className="mt-3 flex items-center gap-3 rounded-[14px] border bg-nuit p-3.5"
                    style={{ borderColor: ok ? "rgba(0,229,160,.32)" : "rgba(255,59,92,.34)" }}
                >
                    <span
                        className="grid size-[30px] shrink-0 place-items-center rounded-[9px] border font-display text-sm font-black"
                        style={
                            ok
                                ? {
                                      background: "rgba(0,229,160,.13)",
                                      borderColor: "rgba(0,229,160,.4)",
                                      color: "#00E5A0",
                                  }
                                : {
                                      background: "rgba(255,59,92,.13)",
                                      borderColor: "rgba(255,59,92,.42)",
                                      color: "#FF6B8A",
                                  }
                        }
                    >
                        {ok ? "✓" : "!"}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div
                            className="font-display text-xs font-black tracking-[0.3px]"
                            style={{ color: ok ? "#00E5A0" : "#FF6B8A" }}
                        >
                            {ok ? "Dernière synchro réussie" : "Échec de la dernière synchro"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-texte-2">
                            {new Date(run.startedAt).toLocaleString("fr-FR")} · {run.trigger}
                            {run.summary && ` · ${run.summary.leagues} ligues · ${run.summary.managers} managers`}
                        </div>
                        {run.error && <div className="mt-0.5 text-[11px] text-rouge">{run.error}</div>}
                    </div>
                </div>
            )}

            <div className="mt-3 flex items-center gap-3 rounded-[14px] border border-bord bg-nuit p-3.5">
                <div className="grid size-[38px] shrink-0 place-items-center rounded-[11px] border border-violet-clair/30 bg-violet-clair/10 text-lg">
                    ⏱
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Auto-sync</span>
                        {auto &&
                            (auto.enabled ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-menthe/40 bg-menthe/[0.12] px-2 py-[3px] font-display text-[8px] font-black uppercase tracking-[0.5px] text-menthe">
                                    <span className="size-[5px] animate-[lhmPulse_1.6s_infinite] rounded-full bg-menthe" />
                                    Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-rouge/40 bg-rouge/[0.12] px-2 py-[3px] font-display text-[8px] font-black uppercase tracking-[0.5px] text-[#FF6B8A]">
                                    <span className="size-[5px] rounded-full bg-rouge" />
                                    Inactive
                                </span>
                            ))}
                    </div>
                    <div className="mt-1 text-[11px] text-texte-2">
                        {!auto
                            ? "…"
                            : auto.enabled && auto.nextRun
                              ? `Prochaine synchro : ${formatNextRun(auto.nextRun)}.`
                              : !auto.credentialsOk
                                ? "Identifiants admin MPG absents côté serveur."
                                : "Désactivée côté serveur (AUTO_SYNC=false)."}
                    </div>
                </div>
            </div>
        </SettingsCard>
    );
}
