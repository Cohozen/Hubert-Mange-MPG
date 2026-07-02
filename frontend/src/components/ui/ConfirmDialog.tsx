import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Modale de confirmation d'action destructive (remplace `window.confirm`).
 * Contrôlée : rendue tant que `open`, fermée via `onOpenChange(false)`.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Supprimer",
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    confirmLabel?: string;
    onConfirm: () => void;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onOpenChange]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6 duration-150 animate-in fade-in-0"
            onClick={() => onOpenChange(false)}
            role="presentation"
        >
            <div
                className="w-full max-w-[420px] rounded-[20px] border border-bord bg-carte p-6 shadow-[0_30px_70px_rgba(0,0,0,.6)]"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-rouge/40 bg-rouge/10 text-xl">
                        ⚠️
                    </div>
                    <h2 className="font-display text-lg font-black uppercase tracking-[-0.3px] text-white">{title}</h2>
                </div>
                <div className="mt-3 text-sm leading-relaxed text-texte-2">{description}</div>
                <div className="mt-5 flex justify-end gap-2">
                    <Button variant="soft" size="sm" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
