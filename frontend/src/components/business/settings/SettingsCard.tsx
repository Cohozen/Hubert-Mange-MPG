import type { ReactNode } from "react";

/** Carte de réglages Broadcast : barre de dégradé + en-tête à barre verticale (+ slot droit). */
export function SettingsCard({
    bar,
    title,
    right,
    children,
}: {
    bar: string;
    title: string;
    right?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="lhm-card overflow-hidden rounded-[20px] border border-bord bg-carte">
            <div className="h-1" style={{ background: bar }} />
            <div className="p-[18px] lg:p-6">
                <div className="mb-4 flex items-center justify-between gap-2.5 lg:mb-5">
                    <div className="flex items-center gap-2.5">
                        <span className="h-[17px] w-1 rounded-[3px] lg:h-5 lg:w-[5px]" style={{ background: bar }} />
                        <span className="font-display text-[13px] font-black uppercase tracking-[1px] text-white lg:text-[17px] lg:tracking-[0.5px]">
                            {title}
                        </span>
                    </div>
                    {right}
                </div>
                {children}
            </div>
        </div>
    );
}

/** Dégradés de barre par section (repris de la maquette Paramètres V2). */
export const SETTINGS_BARS = {
    profil: "linear-gradient(90deg,#6D28D9,#FF2D78,#FF6B35)",
    paiement: "linear-gradient(90deg,#00E5A0,#34D399)",
    preferences: "linear-gradient(90deg,#6D28D9,#A78BFA)",
    logout: "linear-gradient(90deg,#FF3B5C,#FF6B35)",
} as const;
