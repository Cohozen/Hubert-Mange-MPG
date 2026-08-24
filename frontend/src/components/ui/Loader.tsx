import { cn } from "@/lib/utils";

/**
 * Indicateur de chargement de la marque. Remplace les `return null` qui laissaient un écran vide
 * le temps d'une requête (et donnaient l'impression d'une page cassée sur une connexion lente).
 */
export function Loader({ fullScreen = false, className }: { fullScreen?: boolean; className?: string }) {
    return (
        <div className={cn("grid place-items-center", fullScreen ? "min-h-screen bg-nuit" : "min-h-[40vh]", className)}>
            <div className="size-10 animate-spin rounded-full border-4 border-bord border-t-rose" />
        </div>
    );
}
