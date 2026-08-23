import { Link } from "react-router-dom";
import type { DashboardCagnotte } from "@/components/business/accueil/types";

const euros = (cents: number) => `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;

/** Mini-carte cagnotte : gains déjà acquis sur la saison et état de la mise. */
export function CagnotteEstimateCard({ cagnotte }: { cagnotte: DashboardCagnotte | null }) {
    if (!cagnotte) {
        return (
            <div className="lhm-card relative overflow-hidden rounded-[18px] border border-bord bg-carte p-[18px]">
                <div className="absolute inset-x-0 top-0 h-1 grad-energy" />
                <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-texte-2">Cagnotte</div>
                <div className="font-display text-[34px] font-black leading-none text-texte-2">—</div>
                <div className="mt-1 text-[11px] text-texte-2">Pas encore ouverte cette saison</div>
            </div>
        );
    }
    return (
        <Link
            to="/cagnotte"
            className="lhm-card relative block overflow-hidden rounded-[18px] border border-bord bg-carte p-[18px] transition hover:brightness-110"
        >
            <div className="absolute inset-x-0 top-0 h-1 grad-energy" />
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-texte-2">Cagnotte · Mes gains</div>
            <div className="font-display text-[34px] font-black leading-none text-menthe">
                {cagnotte.gains > 0 ? `+${euros(cagnotte.gains)}` : euros(0)}
            </div>
            <div className="mt-1 text-[11px] text-texte-2">Sur la saison</div>
            <div
                className={`mt-4 rounded-xl px-3 py-2 text-[11px] font-semibold ${
                    cagnotte.paid ? "bg-menthe/10 text-menthe" : "bg-orange/10 text-orange"
                }`}
            >
                {cagnotte.paid ? "✓ Mise réglée" : "⏳ Mise à régler"} · {euros(cagnotte.buyIn)}
            </div>
        </Link>
    );
}
