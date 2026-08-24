import { ChevronLeft, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Me } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { cn } from "@/lib/utils";

/** Barre du haut (desktop) : titre de page + identité + déconnexion. */
export function Topbar({
    title,
    me,
    onLogout,
    back = false,
    className,
}: {
    title: string;
    me: Me;
    onLogout: () => void;
    back?: boolean;
    className?: string;
}) {
    const navigate = useNavigate();
    return (
        <header className={cn("h-[72px] items-center justify-between border-b border-bord px-8", className)}>
            <div className="flex min-w-0 items-center gap-3">
                {back && (
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Retour"
                        className="grid size-9 shrink-0 place-items-center rounded-full text-texte-2 transition hover:bg-carte-2 hover:text-texte"
                    >
                        <ChevronLeft size={22} />
                    </button>
                )}
                <h1 className="truncate font-display text-2xl font-black uppercase tracking-tight text-texte">
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <Link
                    to="/profil"
                    className="flex items-center gap-2.5 rounded-full px-2 py-1 transition hover:bg-carte-2"
                >
                    <InitialsAvatar name={me.displayName} seed={me.id} size={32} />
                    <span className="text-sm font-medium text-texte-2">{me.displayName}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Déconnexion">
                    <LogOut size={18} />
                </Button>
            </div>
        </header>
    );
}
