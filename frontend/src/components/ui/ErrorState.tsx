import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Pendant d'`Empty` pour les échecs de chargement. Sans lui, une API tombée se traduisait par un
 * « Pas encore de données » — l'appli annonçait un palmarès vide au lieu d'une panne.
 *
 * ⚠️ À brancher sur `isError` ET `isPaused` : réseau coupé, TanStack Query met la requête en
 * pause et son statut reste `pending` — sans `isPaused`, la page retombe sur sa branche vide.
 */
export function ErrorState({
    children = "Impossible de charger ces données pour le moment.",
    onRetry,
}: {
    children?: ReactNode;
    onRetry?: () => void;
}) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-rouge/35 bg-rouge/[0.07] p-6">
            <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-rouge text-xs font-extrabold text-white">
                !
            </span>
            <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-black uppercase tracking-[0.3px] text-white">Oups</div>
                <p className="mt-1 text-sm text-texte-2">{children}</p>
                {onRetry && (
                    <Button variant="soft" size="pill-sm" className="mt-3" onClick={onRetry}>
                        Réessayer
                    </Button>
                )}
            </div>
        </div>
    );
}
