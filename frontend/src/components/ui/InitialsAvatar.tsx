import { initials } from "@/components/business/stats/playerStyle";
import { cn } from "@/lib/utils";

/**
 * Pastille d'identité à initiales, dégradé de marque — le rendu de la page profil.
 * Utilisé partout où l'on représente le manager connecté (topbar, hero du profil) :
 * la ligue n'affiche pas les photos MPG (convention « initiales colorées partout »).
 */
export function InitialsAvatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
    return (
        <span
            className={cn(
                "grid shrink-0 place-items-center rounded-full font-display font-black text-white",
                className,
            )}
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.4),
                background: "linear-gradient(135deg,#6D28D9,#FF2D78,#FF6B35)",
            }}
        >
            {initials(name)}
        </span>
    );
}
