import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PillTabItem<K extends string = string> {
    key: K;
    label: ReactNode;
}

/**
 * Onglets « pilules » Broadcast (conteneur arrondi, segment actif en dégradé
 * `grad-banner`). Contrôlé. `width` : `auto` = largeur au contenu (Palmarès) ·
 * `full` = segments à largeur égale (pilules de saison Cagnotte) · `mobile-full`
 * = pleine largeur en mobile, compact en desktop (Rétro).
 */
export function PillTabs<K extends string>({
    items,
    value,
    onChange,
    width = "auto",
    className,
}: {
    items: PillTabItem<K>[];
    value: K;
    onChange: (key: K) => void;
    width?: "auto" | "full" | "mobile-full";
    className?: string;
}) {
    const container =
        width === "full"
            ? "flex w-full gap-1"
            : width === "mobile-full"
              ? "flex w-full gap-1 lg:inline-flex lg:w-auto lg:gap-[3px]"
              : "inline-flex gap-[3px]";
    const segment = width === "full" ? "flex-1" : width === "mobile-full" ? "flex-1 lg:flex-none" : undefined;

    return (
        <div className={cn("rounded-full border border-bord bg-carte p-[5px]", container, className)}>
            {items.map((it) => {
                const active = it.key === value;
                return (
                    <button
                        key={it.key}
                        type="button"
                        onClick={() => onChange(it.key)}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-full px-[18px] py-[9px] font-display text-xs font-black uppercase tracking-[0.5px] whitespace-nowrap transition",
                            segment,
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
