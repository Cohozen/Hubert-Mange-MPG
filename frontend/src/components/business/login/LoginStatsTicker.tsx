import type { LoginTeaser } from "@/components/business/login/types";

/**
 * Ticker de chiffres du panneau immersif de la page de connexion.
 * `teaser` absent = données en cours de chargement → placeholders (les valeurs viennent de
 * l'API publique, jamais du code, pour ne plus se périmer d'une saison à l'autre).
 */
export function LoginStatsTicker({ teaser }: { teaser?: LoginTeaser }) {
    const items = [
        { value: teaser?.equipes, label: "Équipes" },
        { value: teaser?.editions, label: "Éditions" },
        { value: teaser?.divisions, label: "Divisions" },
    ];

    return (
        <div className="flex gap-[38px]">
            {items.map((item) => (
                <div key={item.label}>
                    {item.value === undefined ? (
                        <div className="h-[34px] w-10 animate-pulse rounded-lg bg-white/20" />
                    ) : (
                        <div className="font-display text-[34px] font-black leading-none text-white">{item.value}</div>
                    )}
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[1.5px] text-white/70">
                        {item.label}
                    </div>
                </div>
            ))}
        </div>
    );
}
