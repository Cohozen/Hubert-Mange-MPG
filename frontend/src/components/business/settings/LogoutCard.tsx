import { useLogout } from "@/auth/useAuth";
import { SETTINGS_BARS, SettingsCard } from "@/components/business/settings/SettingsCard";

/** Carte de déconnexion (ferme la session locale). */
export function LogoutCard() {
    const logout = useLogout();
    return (
        <SettingsCard bar={SETTINGS_BARS.logout} title="Déconnexion">
            <p className="mb-4 text-[13px] leading-relaxed text-texte-2">
                Tu fermeras ta session sur cet appareil et seras redirigé vers l'écran de connexion. Tes données restent
                sauvegardées.
            </p>
            <button
                type="button"
                onClick={() => logout()}
                className="rounded-[13px] border border-rouge/40 bg-rouge/[0.06] px-8 py-3 font-display text-[13px] font-black uppercase tracking-[1px] text-[#FF6B8A] transition hover:border-rouge/60 hover:bg-rouge/10 hover:text-[#FF8DA1]"
            >
                Se déconnecter
            </button>
        </SettingsCard>
    );
}
