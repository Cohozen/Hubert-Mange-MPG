import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { H2H } from "@/components/business/stats/types";
import { Empty } from "@/components/ui/Empty";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

export function ProfileConfrontationsTab({ managerId }: { managerId: string }) {
    const { data: h } = useQuery({
        queryKey: ["h2h", managerId],
        queryFn: () => api<H2H>(`/api/palmares/h2h/${managerId}`),
    });

    if (!h) return null;

    if (h.opponents.length === 0) {
        return <Empty>Aucune confrontation enregistrée.</Empty>;
    }

    return (
        <ul className="divide-y divide-bord overflow-hidden rounded-2xl border border-bord bg-carte">
            {h.opponents.map((o) => (
                <li key={o.opponentId} className="flex items-center gap-3 p-3 text-sm">
                    <span className="min-w-0 flex-1 text-white">
                        <ManagerLabel
                            managerId={o.opponentId}
                            name={o.manager}
                            username={o.username}
                            avatarUrl={o.avatarUrl}
                            size={24}
                        />
                    </span>
                    <span className="shrink-0 tabular-nums">
                        <span className="text-menthe">{o.w}</span>
                        <span className="text-texte-2/50">–</span>
                        <span className="text-white">{o.d}</span>
                        <span className="text-texte-2/50">–</span>
                        <span className="text-rouge">{o.l}</span>
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs text-texte-2">
                        {o.gf}:{o.ga}
                    </span>
                </li>
            ))}
        </ul>
    );
}
