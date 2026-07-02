import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PillTabItem<K extends string = string> {
    key: K;
    label: ReactNode;
}

/**
 * Onglets « pilules » Broadcast (conteneur arrondi, segment actif en dégradé
 * `grad-banner`). Contrôlé. `full` = segments à largeur égale (ex. pilules de
 * saison Cagnotte) ; sinon largeur au contenu (Palmarès / Rétro).
 */
export function PillTabs<K extends string>({
    items,
    value,
    onChange,
    full = false,
    className,
}: {
    items: PillTabItem<K>[];
    value: K;
    onChange: (key: K) => void;
    full?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "rounded-full border border-bord bg-carte p-[5px]",
                full ? "flex w-full gap-1" : "inline-flex gap-[3px]",
                className,
            )}
        >
            {items.map((it) => {
                const active = it.key === value;
                return (
                    <button
                        key={it.key}
                        type="button"
                        onClick={() => onChange(it.key)}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-full px-[18px] py-[9px] font-display text-xs font-black uppercase tracking-[0.5px] whitespace-nowrap transition",
                            full && "flex-1",
                            active
                                ? "grad-banner text-white shadow-[0_6px_18px_rgba(255,45,120,.35)]"
                                : "text-texte-2 hover:brightness-110",
                        )}
                    >
                        {it.label}
                    </button>
                );
            })}
        </div>
    );
}
