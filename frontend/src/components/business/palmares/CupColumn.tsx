import { ExternalLink } from "lucide-react";
import type { CupRow } from "@/components/business/palmares/types";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

/** Colonne d'une compétition de coupe (LDC / UEFA / Conference). */
export function CupColumn({
    title,
    icon,
    accent,
    rows,
}: {
    title: string;
    icon: string;
    accent: string;
    rows?: CupRow[];
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-bord bg-carte">
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
            <div className="p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-black uppercase tracking-wide text-white">
                    <span>{icon}</span>
                    {title}
                </h3>
                {rows?.length ? (
                    <ul className="space-y-1.5">
                        {rows.map((c) => (
                            <li
                                key={c.id}
                                className="flex items-center justify-between gap-2 rounded-xl bg-nuit px-3 py-2 text-sm"
                            >
                                <span
                                    className="w-9 shrink-0 font-display text-xs font-black"
                                    style={{ color: accent }}
                                >
                                    {c.year}
                                </span>
                                <span className="min-w-0 flex-1 text-white">
                                    <ManagerLabel
                                        name={c.winner}
                                        username={c.username}
                                        avatarUrl={c.avatarUrl}
                                        managerId={c.winnerManagerId}
                                        size={22}
                                    />
                                </span>
                                {c.mpgUrl && (
                                    <a
                                        href={c.mpgUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="shrink-0 text-texte-2 transition hover:text-orange"
                                        aria-label="Voir sur MPG"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-texte-2">Pas encore de données.</p>
                )}
            </div>
        </div>
    );
}
