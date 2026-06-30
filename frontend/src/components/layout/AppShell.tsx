import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type { Me } from "@/auth/useAuth";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { pageTitle } from "./nav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Coquille de l'app : sidebar (desktop) + topbar / header mobile + bottom nav. */
export function AppShell({ me, onLogout, children }: { me: Me; onLogout: () => void; children: ReactNode }) {
    const { pathname } = useLocation();
    return (
        <div className="min-h-screen bg-nuit text-texte">
            <div className="flex min-h-screen">
                <Sidebar className="hidden lg:flex" />
                <div className="flex min-w-0 flex-1 flex-col">
                    <MobileHeader me={me} onLogout={onLogout} className="lg:hidden" />
                    <Topbar title={pageTitle(pathname)} me={me} onLogout={onLogout} className="hidden lg:flex" />
                    <main className="flex-1 px-5 py-6 pb-28 lg:px-8 lg:pb-10">
                        <div className="mx-auto w-full max-w-6xl">{children}</div>
                    </main>
                </div>
            </div>
            <BottomNav className="lg:hidden" />
        </div>
    );
}
