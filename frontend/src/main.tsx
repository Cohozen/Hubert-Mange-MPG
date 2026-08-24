import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ApiError } from "./api/client";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
// Polices Broadcast : Inter (UI) + Archivo (display)
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/archivo/800.css";
import "@fontsource/archivo/900.css";
import "./styles.css";

/**
 * Les données de la ligue ne changent qu'au sync MPG (cron hebdomadaire ou déclenchement admin) :
 * refetcher à chaque remontage de composant ne sert à rien. Le profil, dont les onglets remontent
 * le contenu, rejouait ainsi /h2h et /timeline à chaque clic.
 *
 * Corollaire : après un sync, tout est périmé d'un coup — c'est SyncSection qui invalide alors le
 * cache entier. Les mutations ciblées (cagnotte, rôles, ligues) invalident déjà leurs clés.
 */
const queryClient = new QueryClient({
    /**
     * Session expirée (30 jours) ou cookie perdu : sans ce traitement, toutes les requêtes
     * échouaient en 401 et l'utilisateur restait sur une page vide jusqu'à ce qu'il pense à
     * recharger. On oublie le `me` en cache → `App` bascule seul sur l'écran de connexion.
     * Pas de boucle : `useAuth` avale sa propre erreur et renvoie `null` sans passer par ici.
     */
    queryCache: new QueryCache({
        onError: (error) => {
            if (error instanceof ApiError && error.status === 401) {
                queryClient.setQueryData(["me"], null);
            }
        },
    }),
    defaultOptions: {
        /**
         * `networkMode: "always"` : par défaut, TanStack Query met une requête en PAUSE dès que son
         * détecteur de connexion la croit hors ligne — statut figé sur `pending`, et le bouton
         * « Réessayer » sans effet même une fois l'API revenue (observé en local : API à 200,
         * `navigator.onLine` à true, requêtes bloquées en `paused`). On ne parle qu'à notre propre
         * API : mieux vaut tenter et échouer franchement que rester suspendu.
         *
         * `retry: 0` : une tentative qui échoue et qu'on RÉESSAIE met le « retryer » en pause tant
         * que l'onglet n'est pas au premier plan (cas courant sur mobile : on quitte l'appli, on
         * revient). La requête reste alors bloquée en `pending`/`paused` et le bouton
         * « Réessayer » n'a plus aucun effet — vérifié en local. Sans réessai automatique, un échec
         * devient tout de suite une erreur affichable et le bouton repart sur une requête neuve.
         */
        queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false, networkMode: "always", retry: 0 },
        mutations: { networkMode: "always" },
    },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </QueryClientProvider>
        </ErrorBoundary>
    </React.StrictMode>,
);
