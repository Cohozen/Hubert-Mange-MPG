import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { canEditCagnotte, useAuth } from "@/auth/useAuth";
import { SeasonView } from "@/components/business/cagnotte/SeasonView";
import { SeasonRow } from "@/components/business/cagnotte/types";

export default function CagnottePage() {
    const { data: me } = useAuth();
    const editor = canEditCagnotte(me);
    const [selId, setSelId] = useState<string | null>(null);

    const seasons = useQuery({
        queryKey: ["cagnotte-seasons"],
        queryFn: () => api<SeasonRow[]>("/api/cagnotte/seasons"),
    });

    // Onglets : membres → saisons avec cagnotte ; éditeurs → toutes les saisons (pour en créer).
    // Triés par année croissante ; par défaut on ouvre la saison la plus récente.
    const tabs = (seasons.data ?? []).filter((s) => s.poolId || editor).sort((a, b) => a.year - b.year);
    const current = tabs.find((s) => s.id === selId) ?? tabs[tabs.length - 1];

    // Amène l'onglet actif dans la vue en douceur (sans scroller verticalement la page).
    const activeRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, [current?.id]);

    if (seasons.isLoading) return null;
    if (!tabs.length) {
        return <p className="text-sm opacity-60 bg-base-100 rounded-box shadow p-6">Aucune cagnotte disponible.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tabs.map((s) => {
                    const active = current?.id === s.id;
                    return (
                        <button
                            key={s.id}
                            ref={active ? activeRef : undefined}
                            onClick={() => setSelId(s.id)}
                            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                                active
                                    ? "bg-primary text-primary-content shadow"
                                    : "bg-base-100 border border-base-300 hover:bg-base-200"
                            }`}
                        >
                            {s.name}
                            {s.closed && <span className="ml-1">🔒</span>}
                        </button>
                    );
                })}
            </div>

            {current && <SeasonView key={current.id} season={current} editor={editor} />}
        </div>
    );
}
