import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { ProfileHeader } from "@/components/business/profile/ProfileHeader";
import { ProfileSummaryTab } from "@/components/business/profile/ProfileSummaryTab";
import { ProfileTrophiesTab } from "@/components/business/profile/ProfileTrophiesTab";
import { ProfileStatsTab } from "@/components/business/profile/ProfileStatsTab";
import { ProfileConfrontationsTab } from "@/components/business/profile/ProfileConfrontationsTab";

type TabKey = "resume" | "trophees" | "stats" | "confrontations";

const TABS: { key: TabKey; label: string }[] = [
    { key: "resume", label: "Résumé" },
    { key: "trophees", label: "Salle des trophées" },
    { key: "stats", label: "Stats" },
    { key: "confrontations", label: "Confrontations" },
];

export default function ProfilePage() {
    const { managerId } = useParams<{ managerId?: string }>();
    const { data: me } = useAuth();
    const targetId = managerId ?? me?.id;
    const [tab, setTab] = useState<TabKey>("resume");

    // Repart sur l'onglet Résumé quand on consulte un autre manager.
    useEffect(() => setTab("resume"), [targetId]);

    if (!targetId) {
        return (
            <div className="min-h-[40vh] grid place-items-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ProfileHeader key={`header-${targetId}`} managerId={targetId} />

            <div className="flex flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                                active
                                    ? "bg-primary text-primary-content shadow"
                                    : "bg-base-100 border border-base-300 hover:bg-base-200"
                            }`}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <div key={`${targetId}-${tab}`}>
                {tab === "resume" && <ProfileSummaryTab managerId={targetId} />}
                {tab === "trophees" && <ProfileTrophiesTab managerId={targetId} />}
                {tab === "stats" && <ProfileStatsTab managerId={targetId} />}
                {tab === "confrontations" && <ProfileConfrontationsTab managerId={targetId} />}
            </div>
        </div>
    );
}
