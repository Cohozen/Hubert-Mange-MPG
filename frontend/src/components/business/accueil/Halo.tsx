import { cn } from "@/lib/utils";

/** Halo lumineux animé (blob radial flouté) pour les cartes hero. */
export function Halo({ className, color = "rgba(255,45,120,.4)" }: { className?: string; color?: string }) {
    return (
        <div
            aria-hidden
            className={cn("pointer-events-none absolute rounded-full", className)}
            style={{
                background: `radial-gradient(circle, ${color}, transparent 70%)`,
                filter: "blur(6px)",
                animation: "lhmHalo 10s ease-in-out infinite",
            }}
        />
    );
}
