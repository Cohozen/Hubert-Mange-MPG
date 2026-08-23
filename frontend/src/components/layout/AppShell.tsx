import type { ReactNode } from "react";
import { useLocation, useMatch } from "react-router-dom";
import type { Me } from "@/auth/useAuth";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { pageTitle } from "./nav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Coquille de l'app : sidebar (desktop) + topbar / header mobile + bottom nav. */
export function AppShell({ me, onLogout, children }: { me: Me; onLogout: () => void; children: ReactNode }) {
    const { pathname } = useLocation();
    // Pages « détail » (profil d'un autre, paramètres, administration) : bouton retour,
    // pas de bottom-nav — elles ne font pas partie de la navigation principale.
    const otherProfile = useMatch("/profil/:managerId");
    const isDetail = pathname === "/parametres" || pathname === "/administration" || otherProfile !== null;
    return (
        <div className="min-h-screen overflow-x-clip bg-nuit text-texte">
            <div className="flex min-h-screen">
                <Sidebar className="hidden lg:flex" />
                <div className="flex min-w-0 flex-1 flex-col">
                    <MobileHeader me={me} onLogout={onLogout} back={isDetail} className="lg:hidden" />
                    <Topbar
                        title={pageTitle(pathname)}
                        me={me}
                        onLogout={onLogout}
                        back={isDetail}
                        className="hidden lg:flex"
                    />
                    <main className={cn("flex-1 px-5 py-6 lg:px-8 lg:pb-10", isDetail ? "pb-10" : "pb-28")}>
                        <div
                            key={pathname}
                            className="mx-auto w-full max-w-6xl motion-safe:animate-[lhmPageIn_.28s_ease] lg:animate-none"
                        >
                            {children}
                        </div>
                    </main>
                </div>
            </div>
            {!isDetail && <BottomNav className="lg:hidden" />}
        </div>
    );
}
