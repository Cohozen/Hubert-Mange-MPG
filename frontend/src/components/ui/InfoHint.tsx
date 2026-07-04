import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Petite icône d'aide (ⓘ) qui ouvre un popover au clic/tap (fermeture au clic
 * extérieur ou Échap). Tap-friendly, contrairement à un tooltip hover-only.
 */
export function InfoHint({
    children,
    label = "Aide",
    className,
}: {
    children: React.ReactNode;
    label?: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const id = useId();

    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={ref} className={cn("relative inline-flex", className)}>
            <button
                type="button"
                aria-label={label}
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((v) => !v)}
                className="grid size-[18px] place-items-center rounded-full text-white/60 transition hover:text-white"
            >
                <Info size={14} />
            </button>
            {open && (
                <div
                    id={id}
                    role="tooltip"
                    className="absolute left-0 top-[calc(100%+8px)] z-50 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-bord bg-carte px-3 py-2.5 text-left text-[11px] font-medium leading-snug text-texte-2 shadow-[0_12px_32px_rgba(0,0,0,.5)]"
                >
                    {children}
                </div>
            )}
        </div>
    );
}
