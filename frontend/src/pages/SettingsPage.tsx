import { isLeagueAdmin, isSuperadmin, useAuth } from "@/auth/useAuth";
import { ProfileForm } from "@/components/business/settings/ProfileForm";
import { SyncSection } from "@/components/business/admin/SyncSection";
import { LeaguesSection } from "@/components/business/admin/LeaguesSection";
import { TournamentsSection } from "@/components/business/admin/TournamentsSection";
import { RolesSection } from "@/components/business/admin/RolesSection";

export default function SettingsPage() {
    const { data: me } = useAuth();

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <ProfileForm />

            {isLeagueAdmin(me) && (
                <section>
                    <div className="divider text-sm font-semibold uppercase opacity-60">Administration</div>
                    <div className="columns-1 lg:columns-2 gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid">
                        <SyncSection />
                        <LeaguesSection canDelete={isSuperadmin(me)} />
                        <TournamentsSection canDelete={isSuperadmin(me)} />
                    </div>
                </section>
            )}

            {isSuperadmin(me) && (
                <section>
                    <div className="divider text-sm font-semibold uppercase opacity-60">Rôles (superadmin)</div>
                    <RolesSection />
                </section>
            )}
        </div>
    );
}
