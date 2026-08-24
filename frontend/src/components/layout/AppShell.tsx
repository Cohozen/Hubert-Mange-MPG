import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import type { Me } from "@/auth/useAuth";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { Sidebar } from "./Sidebar";

/**
 * Coquille de l'app : sidebar (desktop) + header et bottom nav (mobile).
 * Pas de barre en haut en desktop — la sidebar porte la navigation ET le compte.
 */
export function AppShell({ me, onLogout, children }: { me: Me; onLogout: () => void; children: ReactNode }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    // Pages « détail » (profil d'un autre, paramètres, administration) : bouton retour,
    // pas de bottom-nav — elles ne font pas partie de la navigation principale.
    const otherProfile = useMatch("/profil/:managerId");
    const isDetail = pathname === "/parametres" || pathname === "/administration" || otherProfile !== null;
    return (
        <div className="min-h-screen overflow-x-clip bg-nuit text-texte">
            <div className="flex min-h-screen">
                <Sidebar me={me} onLogout={onLogout} className="hidden lg:flex" />
                <div className="flex min-w-0 flex-1 flex-col">
                    <MobileHeader me={me} onLogout={onLogout} back={isDetail} className="lg:hidden" />
                    <main className={cn("flex-1 px-5 py-6 lg:px-8 lg:py-8", isDetail ? "pb-10" : "pb-28")}>
                        <div
                            key={pathname}
                            className="mx-auto w-full max-w-6xl motion-safe:animate-[lhmPageIn_.28s_ease] lg:animate-none"
                        >
                            {/* Le retour vivait dans la topbar : en desktop il ouvre désormais la page. */}
                            {isDetail && (
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="mb-5 hidden items-center gap-1.5 rounded-full py-1 pr-3 text-sm font-semibold text-texte-2 transition hover:text-texte lg:inline-flex"
                                >
                                    <ChevronLeft size={18} />
                                    Retour
                                </button>
                            )}
                            {children}
                        </div>
                    </main>
                </div>
            </div>
            {!isDetail && <BottomNav className="lg:hidden" />}
        </div>
    );
}
