import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Dernier filet : sans lui, la moindre erreur de rendu donne un écran blanc, sans message ni moyen
 * de repartir. Composant classe — c'est la seule forme d'error boundary en React 18.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Erreur de rendu :", error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="grid min-h-screen place-items-center bg-nuit px-6">
                <div className="w-full max-w-md rounded-[22px] border border-bord bg-carte p-7 text-center">
                    <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-rouge/30 bg-rouge/10 text-2xl">
                        ⚠️
                    </div>
                    <h1 className="mt-4 font-display text-xl font-black uppercase tracking-[-0.3px] text-white">
                        Ça a coincé
                    </h1>
                    <p className="mt-2 text-sm text-texte-2">
                        Une erreur inattendue a interrompu l'affichage. Recharger la page suffit en général.
                    </p>
                    <Button variant="energy" size="pill" className="mt-5" onClick={() => window.location.reload()}>
                        Recharger
                    </Button>
                </div>
            </div>
        );
    }
}
