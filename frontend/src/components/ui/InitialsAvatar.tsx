import { initials, playerGradient } from "@/components/business/stats/playerStyle";
import { cn } from "@/lib/utils";

/**
 * Identité d'un manager : initiales sur un dégradé **déterministe** dérivé de son id — un joueur
 * garde la même couleur d'une page à l'autre (convention « initiales colorées partout », pas de
 * photo MPG). `ring` ajoute l'anneau de marque du hero de profil.
 */
export function InitialsAvatar({
    name,
    seed,
    size = 32,
    ring = false,
    ringWidth = 3,
    className,
}: {
    name: string;
    seed: string;
    size?: number;
    ring?: boolean;
    ringWidth?: number;
    className?: string;
}) {
    const g = playerGradient(seed);
    const tile = (
        <span
            className={cn("grid size-full place-items-center rounded-full font-display font-black", className)}
            style={{ background: g.grad, color: g.txt, fontSize: Math.round(size * 0.38) }}
        >
            {initials(name)}
        </span>
    );

    if (!ring) {
        return (
            <span className="block shrink-0" style={{ width: size, height: size }}>
                {tile}
            </span>
        );
    }
    return (
        <span className="relative block shrink-0" style={{ width: size, height: size }}>
            <span
                className="absolute rounded-full"
                style={{
                    inset: -ringWidth,
                    background: "linear-gradient(135deg,#FFD23F,#FF2D78,#6D28D9)",
                }}
            />
            <span className="absolute inset-0 rounded-full" style={{ padding: 0 }}>
                {tile}
            </span>
        </span>
    );
}
