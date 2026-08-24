import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
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
    defaultOptions: {
        queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false },
    },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>,
);
