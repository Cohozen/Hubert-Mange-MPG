import type { BigMatch } from "@/components/business/stats/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

export function BigMatchCard({ title, m }: { title: string; m: BigMatch | null }) {
    return (
        <div className="lhm-card rounded-2xl border border-bord bg-carte p-4">
            <h3 className="mb-1 font-display text-sm font-black text-white">{title}</h3>
            {m ? (
                <div className="space-y-1">
                    <div className="font-display text-2xl font-black text-white">{m.score}</div>
                    <ManagerLabel name={m.opponent} username={m.username} avatarUrl={m.avatarUrl} size={24} />
                    <div className="text-xs text-texte-2">{m.context}</div>
                </div>
            ) : (
                <p className="text-sm text-texte-2">—</p>
            )}
        </div>
    );
}
