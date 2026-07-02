import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/api/client";
import { SETTINGS_BARS, SettingsCard } from "@/components/business/settings/SettingsCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

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

interface LeagueRow {
    mpgLeagueId: string;
    name: string;
    trackedId?: string;
    active: boolean;
    inMyDashboard: boolean;
    shortId?: string;
    totalUsers?: number;
    totalDivisions?: number;
    season?: number;
}

function tag(name: string) {
    return name
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
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
        await api(`/api/admin/leagues/${row.trackedId}`, { method: "DELETE" });
        invalidate();
    }

    const activeCount = rows.filter((r) => r.trackedId && r.active).length;

    return (
        <SettingsCard
            bar={SETTINGS_BARS.paiement}
            title="Ligues suivies"
            right={<span className="text-[11px] font-semibold text-texte-2">{activeCount} actives</span>}
        >
            {available.isError && (
                <p className="mb-3 text-sm text-jaune">
                    Tes ligues MPG n'ont pas pu être lues. Les ligues déjà suivies restent affichées.
                </p>
            )}

            <div className="flex flex-col gap-2.5">
                {rows.map((l) => (
                    <div
                        key={l.mpgLeagueId}
                        className="lhm-row flex items-center gap-3 rounded-[14px] border border-bord bg-nuit p-3 transition"
                    >
                        <div className="grid size-[38px] shrink-0 place-items-center rounded-[11px] font-display text-[11px] font-black text-white grad-banner">
                            {tag(l.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate font-display text-[13px] font-black tracking-[0.2px] text-white">
                                {l.name}
                            </div>
                            <div className="mt-0.5 text-[10px] text-texte-2">
                                {l.totalUsers != null
                                    ? `${l.totalUsers} joueurs · ${l.totalDivisions} div. · saison ${l.season}`
                                    : l.trackedId && !l.inMyDashboard
                                      ? "hors de ton compte MPG"
                                      : l.trackedId && !l.active
                                        ? "en pause"
                                        : ""}
                            </div>
                        </div>
                        <ToggleSwitch
                            on={!!l.trackedId && l.active}
                            onChange={() => toggle(l)}
                            label={`Suivre ${l.name}`}
                        />
                        {l.trackedId && canDelete && (
                            <button
                                type="button"
                                onClick={() => setPending(l)}
                                title="Supprimer la ligue et ses données"
                                className="grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-rouge/30 bg-rouge/[0.07] font-display text-[15px] font-black text-[#FF6B8A] transition hover:border-rouge/60 hover:bg-rouge/15"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
                {rows.length === 0 && (
                    <p className="text-sm text-texte-2">{available.isLoading ? "Lecture de MPG…" : "Aucune ligue."}</p>
                )}
            </div>

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
        </SettingsCard>
    );
}
