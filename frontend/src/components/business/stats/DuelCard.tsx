import { OppRow } from "@/components/business/stats/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

export function DuelCard({ title, subtitle, opp }: { title: string; subtitle?: string; opp: OppRow | null }) {
    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body p-4">
                <h3 className="font-semibold">{title}</h3>
                {subtitle && <p className="text-xs opacity-60 -mt-1 mb-1">{subtitle}</p>}
                {opp ? (
                    <div className="space-y-1">
                        <ManagerLabel name={opp.manager} username={opp.username} avatarUrl={opp.avatarUrl} size={24} />
                        <div className="text-sm">
                            <span className="text-success font-bold">{opp.w}V</span>{" "}
                            <span className="opacity-70">{opp.d}N</span>{" "}
                            <span className="text-error font-bold">{opp.l}D</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm opacity-60">Pas assez de matchs.</p>
                )}
            </div>
        </div>
    );
}
