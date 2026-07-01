import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import type { AllTimeRow, CupCount } from "@/components/business/stats/types";
import { Avatar } from "@/components/ui/Avatar";

export function ProfileHeader({ managerId }: { managerId: string }) {
    const { data: me } = useAuth();
    const { data } = useQuery({
        queryKey: ["all-time"],
        queryFn: () => api<{ ranking: AllTimeRow[]; maxLevel: number }>("/api/palmares/all-time"),
    });
    const { data: cups } = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ ranking: CupCount[] }>("/api/palmares/tournaments"),
    });

    const row = data?.ranking.find((r) => r.managerId === managerId);
    const isMe = managerId === me?.id;
    const ldc = cups?.ranking.find((c) => c.managerId === managerId)?.ldc ?? 0;

    const name = row?.manager ?? (isMe ? me?.displayName : null) ?? "—";
    const username = row?.username ?? (isMe ? me?.username : null);
    const avatarUrl = row?.avatarUrl ?? (isMe ? me?.avatarUrl : null);

    return (
        <div className="relative overflow-hidden rounded-2xl border border-bord bg-carte">
            <div className="h-1.5 grad-energy" />
            <div className="flex items-center gap-4 p-5">
                <Avatar url={avatarUrl} name={name} size={64} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate font-display text-xl font-black uppercase tracking-tight text-white">
                            {name}
                        </h1>
                        {isMe && (
                            <span className="rounded-full bg-rose/15 px-2 py-0.5 text-xs font-semibold text-rose">
                                toi
                            </span>
                        )}
                        {ldc > 0 && (
                            <span title="Ligue des Crampons" className="whitespace-nowrap">
                                {"⭐".repeat(ldc)}
                            </span>
                        )}
                    </div>
                    {username && <p className="truncate text-sm text-texte-2">{username}</p>}
                    {row && (
                        <p className="mt-1 text-xs tabular-nums text-texte-2">
                            {row.seasonsPlayed} saison{row.seasonsPlayed > 1 ? "s" : ""} · {row.totalTitles} titre
                            {row.totalTitles > 1 ? "s" : ""} · {row.rank}
                            <sup>e</sup> all-time
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
