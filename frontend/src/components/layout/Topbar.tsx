import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import type { Me } from "@/auth/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Barre du haut (desktop) : titre de page + identité + déconnexion. */
export function Topbar({
    title,
    me,
    onLogout,
    className,
}: {
    title: string;
    me: Me;
    onLogout: () => void;
    className?: string;
}) {
    return (
        <header className={cn("items-center justify-between border-b border-bord px-8 py-5", className)}>
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-texte">{title}</h1>
            <div className="flex items-center gap-2">
                <Link
                    to="/profil"
                    className="flex items-center gap-2.5 rounded-full px-2 py-1 transition hover:bg-carte-2"
                >
                    <Avatar url={me.avatarUrl} name={me.displayName} size={32} />
                    <span className="text-sm font-medium text-texte-2">{me.displayName}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Déconnexion">
                    <LogOut size={18} />
                </Button>
            </div>
        </header>
    );
}
