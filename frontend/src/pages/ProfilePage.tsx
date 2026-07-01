import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { ProfileConfrontationsTab } from "@/components/business/profile/ProfileConfrontationsTab";
import { ProfileHeader } from "@/components/business/profile/ProfileHeader";
import { ProfileStatsTab } from "@/components/business/profile/ProfileStatsTab";
import { ProfileSummaryTab } from "@/components/business/profile/ProfileSummaryTab";
import { ProfileTrophiesTab } from "@/components/business/profile/ProfileTrophiesTab";

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

    // Amène l'onglet actif dans la vue en douceur (sans scroller verticalement la page).
    const activeRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, [tab]);

    if (!targetId) {
        return (
            <div className="grid min-h-[40vh] place-items-center">
                <div className="size-10 animate-spin rounded-full border-4 border-bord border-t-rose" />
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
                            type="button"
                            ref={active ? activeRef : undefined}
                            onClick={() => setTab(t.key)}
                            className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                                active
                                    ? "grad-energy font-display text-white"
                                    : "border border-bord bg-carte text-texte-2 hover:text-white"
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
