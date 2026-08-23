import { NavLink } from "react-router-dom";
import { isLeagueAdmin, useAuth } from "@/auth/useAuth";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { MAIN_NAV, type NavItem, SECONDARY_NAV } from "./nav";

function SideItem({ item }: { item: NavItem }) {
    return (
        <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                    isActive ? "grad-energy font-display font-extrabold text-white" : "text-texte-2 hover:text-texte",
                )
            }
        >
            <item.icon size={18} />
            {item.label}
        </NavLink>
    );
}

/** Sidebar de navigation (desktop). */
export function Sidebar({ className }: { className?: string }) {
    const { data: me } = useAuth();
    const secondary = SECONDARY_NAV.filter((it) => !it.adminOnly || isLeagueAdmin(me));
    return (
        <aside
            className={cn(
                "sticky top-0 h-screen w-[230px] shrink-0 self-start flex-col overflow-y-auto border-r border-bord bg-carte px-4 pb-5",
                className,
            )}
        >
            <div className="mb-3 flex h-[72px] items-center gap-3 border-b border-bord px-2">
                <Logo size={38} />
                <div>
                    <div className="font-display text-base font-black leading-none text-texte">LHM</div>
                    <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-texte-2">
                        Ligue Hubert Mange
                    </div>
                </div>
            </div>
            <nav className="flex flex-col gap-1.5">
                {MAIN_NAV.map((it) => (
                    <SideItem key={it.to} item={it} />
                ))}
            </nav>
            <div className="flex-1" />
            <div className="flex flex-col gap-1.5 border-t border-bord pt-3">
                {secondary.map((it) => (
                    <SideItem key={it.to} item={it} />
                ))}
            </div>
        </aside>
    );
}
