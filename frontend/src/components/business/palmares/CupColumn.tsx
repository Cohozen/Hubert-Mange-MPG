import { ExternalLink } from "lucide-react";
import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { CupRow } from "@/components/business/palmares/types";

export function CupColumn({ title, icon, rows }: { title: string; icon: string; rows?: CupRow[] }) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4">
        <h3 className="font-semibold mb-1">{title}</h3>
        {rows?.length ? (
          <ul className="space-y-2">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="opacity-60 w-10 shrink-0">{c.year}</span>
                <span className="flex-1 min-w-0 flex items-center gap-1">
                  <span className="shrink-0">{icon}</span>
                  <ManagerLabel
                    name={c.winner}
                    username={c.username}
                    avatarUrl={c.avatarUrl}
                    size={22}
                  />
                </span>
                <a
                  href={c.mpgUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="link link-primary shrink-0"
                  aria-label="Voir sur MPG"
                >
                  <ExternalLink size={14} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-60">Pas encore de données.</p>
        )}
      </div>
    </div>
  );
}
