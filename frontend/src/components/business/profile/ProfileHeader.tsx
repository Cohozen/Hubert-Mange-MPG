import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { AllTimeRow } from "@/components/business/stats/types";

export function ProfileHeader({ managerId }: { managerId: string }) {
    const { data: me } = useAuth();
    const { data } = useQuery({
        queryKey: ["all-time"],
        queryFn: () => api<{ ranking: AllTimeRow[]; maxLevel: number }>("/api/palmares/all-time"),
    });

    const row = data?.ranking.find((r) => r.managerId === managerId);
    const isMe = managerId === me?.id;

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
            {isMe && (
                <Link to="/parametres" className="btn btn-sm btn-ghost shrink-0">
                    Modifier mes infos
                </Link>
            )}
        </div>
    );
}
