import { History, Home, type LucideIcon, Settings, ShieldCheck, Trophy, User, Wallet } from "lucide-react";

export interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    end?: boolean;
    /** Visible uniquement pour les ADMIN / SUPERADMIN. */
    adminOnly?: boolean;
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
export const SECONDARY_NAV: NavItem[] = [
    { to: "/parametres", label: "Paramètres", icon: Settings },
    { to: "/administration", label: "Administration", icon: ShieldCheck, adminOnly: true },
];
