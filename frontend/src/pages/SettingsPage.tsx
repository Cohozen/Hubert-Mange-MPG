import { LogoutCard } from "@/components/business/settings/LogoutCard";
import { ProfileForm } from "@/components/business/settings/ProfileForm";

/** Espace personnel : profil, coordonnées de paiement, déconnexion. L'administration a sa page. */
export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-display text-[30px] font-black uppercase leading-none tracking-[-1px] text-white lg:text-[32px]">
                    Mon espace
                </h1>
                <p className="mt-1.5 text-[13px] text-texte-2 lg:text-sm">Gère ton profil et ton moyen de paiement.</p>
            </header>

            <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-[22px]">
                <ProfileForm />
                <LogoutCard />
            </div>
        </div>
    );
}
