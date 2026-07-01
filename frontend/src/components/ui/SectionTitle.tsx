import { cn } from "@/lib/utils";

/** Titre de section « Broadcast » : petit trait d'accent + libellé Archivo. */
export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h2 className={cn("flex items-center gap-3", className)}>
            <span className="h-4 w-1 rounded-full grad-energy" />
            <span className="font-display text-lg font-black uppercase tracking-wide text-white">{children}</span>
        </h2>
    );
}
