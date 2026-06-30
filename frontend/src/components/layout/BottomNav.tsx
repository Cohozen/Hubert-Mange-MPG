import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MAIN_NAV } from "./nav";

/** Barre de navigation du bas (mobile). */
export function BottomNav({ className }: { className?: string }) {
    return (
        <nav
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 flex items-center gap-1.5 border-t border-bord bg-carte px-3 pt-2",
                "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
                className,
            )}
        >
            {MAIN_NAV.map((it) => (
                <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end}
                    className={({ isActive }) =>
                        cn(
                            "flex items-center justify-center rounded-2xl transition",
                            isActive
                                ? "flex-[1.5] grad-energy flex-row gap-2 px-2 py-3 font-display text-xs font-black text-white"
                                : "flex-1 flex-col gap-1 px-1 py-2 text-[10px] font-semibold text-texte-2",
                        )
                    }
                >
                    {({ isActive }) => (
                        <>
                            <it.icon size={isActive ? 16 : 20} />
                            <span className="leading-none">{it.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}
