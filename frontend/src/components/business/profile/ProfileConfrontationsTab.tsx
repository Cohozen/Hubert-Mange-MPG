import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { H2H } from "@/components/business/stats/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

export function ProfileConfrontationsTab({ managerId }: { managerId: string }) {
    const { data: h } = useQuery({
        queryKey: ["h2h", managerId],
        queryFn: () => api<H2H>(`/api/palmares/h2h/${managerId}`),
    });

    if (!h) return null;

    if (h.opponents.length === 0) {
        return (
            <div className="card bg-base-100 shadow">
                <div className="card-body text-sm opacity-60">Aucune confrontation enregistrée.</div>
            </div>
        );
    }

    return (
        <ul className="list bg-base-100 rounded-box shadow">
            {h.opponents.map((o) => (
                <li key={o.opponentId} className="list-row items-center text-sm">
                    <span className="list-col-grow min-w-0">
                        <ManagerLabel
                            managerId={o.opponentId}
                            name={o.manager}
                            username={o.username}
                            avatarUrl={o.avatarUrl}
                            size={24}
                        />
                    </span>
                    <span className="shrink-0 tabular-nums">
                        <span className="text-success">{o.w}</span>
                        <span className="opacity-40">–</span>
                        <span>{o.d}</span>
                        <span className="opacity-40">–</span>
                        <span className="text-error">{o.l}</span>
                    </span>
                    <span className="shrink-0 opacity-50 text-xs w-16 text-right">
                        {o.gf}:{o.ga}
                    </span>
                </li>
            ))}
        </ul>
    );
}
