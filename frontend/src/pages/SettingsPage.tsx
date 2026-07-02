import { isLeagueAdmin, isSuperadmin, useAuth } from "@/auth/useAuth";
import { LeaguesSection } from "@/components/business/admin/LeaguesSection";
import { RolesSection } from "@/components/business/admin/RolesSection";
import { SyncSection } from "@/components/business/admin/SyncSection";
import { TournamentsSection } from "@/components/business/admin/TournamentsSection";
import { LogoutCard } from "@/components/business/settings/LogoutCard";
import { PreferencesCard } from "@/components/business/settings/PreferencesCard";
import { ProfileForm } from "@/components/business/settings/ProfileForm";

function Divider({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-bord" />
            <span className="font-display text-sm font-black uppercase tracking-wide text-texte-2">{children}</span>
            <span className="h-px flex-1 bg-bord" />
        </div>
    );
}

export default function SettingsPage() {
    const { data: me } = useAuth();

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <header>
                    <h1 className="font-display text-[30px] font-black uppercase leading-none tracking-[-1px] text-white lg:text-[32px]">
                        Mon espace
                    </h1>
                    <p className="mt-1.5 text-[13px] text-texte-2 lg:text-sm">
                        Gère ton profil, ton paiement et tes préférences.
                    </p>
                </header>

                <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-[22px]">
                    <ProfileForm />
                    <div className="flex flex-col gap-3.5 lg:gap-[22px]">
                        <PreferencesCard />
                        <LogoutCard />
                    </div>
                </div>
            </div>

            {isLeagueAdmin(me) && (
                <section>
                    <Divider>Administration</Divider>
                    <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start lg:gap-[22px]">
                        <div className="flex flex-col gap-3.5 lg:gap-[22px]">
                            <SyncSection />
                            <LeaguesSection canDelete={isSuperadmin(me)} />
                            <TournamentsSection canDelete={isSuperadmin(me)} />
                        </div>
                        <div className="flex flex-col gap-3.5 lg:gap-[22px]">
                            {isSuperadmin(me) ? (
                                <RolesSection />
                            ) : (
                                <div className="rounded-[20px] border border-dashed border-bord bg-carte p-6 text-center">
                                    <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-rouge/30 bg-rouge/10 text-2xl">
                                        🔒
                                    </div>
                                    <div className="font-display text-lg font-black uppercase tracking-[-0.3px] text-white">
                                        Gestion des rôles
                                    </div>
                                    <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-texte-2">
                                        Réservé au <b className="text-[#FF6B8A]">Superadmin</b>. En tant qu'
                                        <b className="text-white">Admin</b>, tu pilotes la synchro, les ligues et les
                                        tournois.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
