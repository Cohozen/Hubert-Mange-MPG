import { isSuperadmin, useAuth } from "@/auth/useAuth";
import { SyncSection } from "@/components/business/admin/SyncSection";
import { LeaguesSection } from "@/components/business/admin/LeaguesSection";
import { TournamentsSection } from "@/components/business/admin/TournamentsSection";
import { RolesSection } from "@/components/business/admin/RolesSection";

export default function AdminPage() {
  const { data: me } = useAuth();

  return (
    <div className="max-w-5xl columns-1 lg:columns-2 gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid">
      <SyncSection />

      <LeaguesSection canDelete={isSuperadmin(me)} />

      <TournamentsSection canDelete={isSuperadmin(me)} />

      {isSuperadmin(me) && <RolesSection />}
    </div>
  );
}
