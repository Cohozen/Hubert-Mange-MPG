import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Dialog « méthode JO » (tri du classement all-time). `children` = déclencheur. */
export function StatsInfoDialog({ children }: { children: ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-[480px] rounded-[22px] border-bord bg-carte">
                <div className="flex items-center gap-3.5">
                    <div className="grid size-[50px] shrink-0 place-items-center rounded-[14px] grad-banner text-2xl">
                        🏅
                    </div>
                    <div>
                        <DialogTitle className="font-display text-[22px] font-black uppercase tracking-[-0.3px] text-white">
                            La méthode JO
                        </DialogTitle>
                        <DialogDescription className="mt-0.5 text-xs text-texte-2">
                            Comment on classe les légendes de la LHM
                        </DialogDescription>
                    </div>
                </div>
                <p className="text-[15px] leading-[1.65] text-[#C7CEEF]">
                    Le classement all-time est trié <b className="text-white">façon Jeux Olympiques</b> : on compare
                    d'abord les titres de <b className="text-jaune">Division 1</b>, puis on descend marche par marche
                    jusqu'à la <b style={{ color: "#8B92C4" }}>Division 6</b>. À égalité, on départage par les{" "}
                    <b className="text-white">trois coupes</b> dans l'ordre : <b className="text-menthe">LDC ⭐ (C1)</b>
                    , <b className="text-jaune">Europa 🎖️ (C3)</b>,{" "}
                    <b className="text-violet-clair">Conférence 🍐 (C4)</b>.
                </p>
                <p className="text-sm leading-[1.6] text-texte-2">
                    Un seul titre de division supérieure vaut donc plus que toutes les coupes : c'est le palmarès en
                    championnat qui fait la légende. À égalité parfaite, l'ancienneté dans la ligue tranche.
                </p>
            </DialogContent>
        </Dialog>
    );
}
