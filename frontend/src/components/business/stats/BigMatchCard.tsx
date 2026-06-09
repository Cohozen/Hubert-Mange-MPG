import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { BigMatch } from "@/components/business/stats/types";

export function BigMatchCard({ title, m }: { title: string; m: BigMatch | null }) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4">
        <h3 className="font-semibold mb-1">{title}</h3>
        {m ? (
          <div className="space-y-1">
            <div className="text-2xl font-bold">{m.score}</div>
            <ManagerLabel
              name={m.opponent}
              username={m.username}
              avatarUrl={m.avatarUrl}
              size={24}
            />
            <div className="text-xs opacity-60">{m.context}</div>
          </div>
        ) : (
          <p className="text-sm opacity-60">—</p>
        )}
      </div>
    </div>
  );
}
