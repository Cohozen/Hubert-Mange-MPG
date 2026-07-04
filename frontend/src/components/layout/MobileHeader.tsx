import { ChevronLeft, LogOut, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Me } from "@/auth/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

/** En-tête compact (mobile) : logo + accès Paramètres / Déconnexion / Profil. */
export function MobileHeader({
    me,
    onLogout,
    back = false,
    className,
}: {
    me: Me;
    onLogout: () => void;
    back?: boolean;
    className?: string;
}) {
    const navigate = useNavigate();
    return (
        <header
            className={cn(
                "sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-bord bg-nuit/85 px-5 backdrop-blur",
                className,
            )}
        >
            {back ? (
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Retour"
                    className="grid size-9 place-items-center rounded-full text-texte-2 transition hover:bg-carte hover:text-texte"
                >
                    <ChevronLeft size={22} />
                </button>
            ) : (
                <Link to="/" className="flex items-center gap-2.5">
                    <Logo size={32} />
                    <span className="font-display text-[13px] font-black uppercase leading-[1.05] tracking-tight text-texte">
                        Ligue Hubert
                        <br />
                        Mange
                    </span>
                </Link>
            )}
            <div className="flex items-center gap-1">
                <Link
                    to="/parametres"
                    aria-label="Paramètres"
                    className="grid size-9 place-items-center rounded-full text-texte-2 transition hover:bg-carte hover:text-texte"
                >
                    <Settings size={18} />
                </Link>
                <button
                    type="button"
                    onClick={onLogout}
                    aria-label="Déconnexion"
                    className="grid size-9 place-items-center rounded-full text-texte-2 transition hover:bg-carte hover:text-texte"
                >
                    <LogOut size={18} />
                </button>
                <Link to="/profil" aria-label="Profil" className="ml-1">
                    <Avatar url={me.avatarUrl} name={me.displayName} size={36} />
                </Link>
            </div>
        </header>
    );
}
