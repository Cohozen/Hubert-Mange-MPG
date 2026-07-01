import type { OppRow } from "@/components/business/stats/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

export function DuelCard({ title, subtitle, opp }: { title: string; subtitle?: string; opp: OppRow | null }) {
    return (
        <div className="lhm-card rounded-2xl border border-bord bg-carte p-4">
            <h3 className="font-display text-sm font-black text-white">{title}</h3>
            {subtitle && <p className="-mt-0.5 mb-1 text-xs text-texte-2">{subtitle}</p>}
            {opp ? (
                <div className="mt-1 space-y-1">
                    <ManagerLabel name={opp.manager} username={opp.username} avatarUrl={opp.avatarUrl} size={24} />
                    <div className="text-sm">
                        <span className="font-bold text-menthe">{opp.w}V</span>{" "}
                        <span className="text-texte-2">{opp.d}N</span>{" "}
                        <span className="font-bold text-rouge">{opp.l}D</span>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-texte-2">Pas assez de matchs.</p>
            )}
        </div>
    );
}
