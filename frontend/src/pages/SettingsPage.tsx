import { isLeagueAdmin, isSuperadmin, useAuth } from "@/auth/useAuth";
import { LeaguesSection } from "@/components/business/admin/LeaguesSection";
import { RolesSection } from "@/components/business/admin/RolesSection";
import { SyncSection } from "@/components/business/admin/SyncSection";
import { TournamentsSection } from "@/components/business/admin/TournamentsSection";
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
        <div className="mx-auto max-w-5xl space-y-8">
            <ProfileForm />

            {isLeagueAdmin(me) && (
                <section>
                    <Divider>Administration</Divider>
                    <div className="columns-1 gap-6 lg:columns-2 [&>*]:mb-6 [&>*]:break-inside-avoid">
                        <SyncSection />
                        <LeaguesSection canDelete={isSuperadmin(me)} />
                        <TournamentsSection canDelete={isSuperadmin(me)} />
                    </div>
                </section>
            )}

            {isSuperadmin(me) && (
                <section>
                    <Divider>Superadmin</Divider>
                    <RolesSection />
                </section>
            )}
        </div>
    );
}
