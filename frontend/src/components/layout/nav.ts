import { History, Home, type LucideIcon, Settings, Trophy, User, Wallet } from "lucide-react";

export interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    end?: boolean;
}

/** Navigation principale (sidebar desktop + bottom bar mobile). */
export const MAIN_NAV: NavItem[] = [
    { to: "/", label: "Accueil", icon: Home, end: true },
    { to: "/palmares", label: "Palmarès", icon: Trophy },
    { to: "/stats", label: "Rétro", icon: History },
    { to: "/cagnotte", label: "Cagnotte", icon: Wallet },
    { to: "/profil", label: "Profil", icon: User },
];

/** Navigation secondaire (bas de sidebar). */
export const SECONDARY_NAV: NavItem[] = [{ to: "/parametres", label: "Paramètres", icon: Settings }];

/** Titre de page à partir du pathname courant (topbar desktop). */
export function pageTitle(pathname: string): string {
    if (pathname === "/") return "Accueil";
    if (pathname.startsWith("/palmares")) return "Palmarès";
    if (pathname.startsWith("/stats")) return "Rétro";
    if (pathname.startsWith("/cagnotte")) return "Cagnotte";
    if (pathname.startsWith("/profil")) return "Profil";
    if (pathname.startsWith("/parametres")) return "Paramètres";
    return "Ligue Hubert Mange";
}
