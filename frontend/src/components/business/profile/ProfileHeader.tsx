import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { AllTimeRow, CupCount } from "@/components/business/stats/types";
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
        <div className="bg-base-100 rounded-box shadow p-5 flex items-center gap-4">
            <Avatar url={avatarUrl} name={name} size={64} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold truncate">{name}</h1>
                    {isMe && <span className="badge badge-primary badge-sm">toi</span>}
                    {ldc > 0 && (
                        <span title="Ligue des Crampons" className="whitespace-nowrap">
                            {"⭐".repeat(ldc)}
                        </span>
                    )}
                </div>
                {username && <p className="text-sm opacity-50 truncate">{username}</p>}
                {row && (
                    <p className="text-xs opacity-60 mt-1 tabular-nums">
                        {row.seasonsPlayed} saison{row.seasonsPlayed > 1 ? "s" : ""} · {row.totalTitles} titre
                        {row.totalTitles > 1 ? "s" : ""} · {row.rank}
                        <sup>e</sup> all-time
                    </p>
                )}
            </div>
        </div>
    );
}
