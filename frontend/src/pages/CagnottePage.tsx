import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api/client";
import { canEditCagnotte, useAuth } from "@/auth/useAuth";
import { SeasonView } from "@/components/business/cagnotte/SeasonView";
import type { SeasonRow } from "@/components/business/cagnotte/types";
import { Empty } from "@/components/ui/Empty";

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

    if (seasons.isLoading) return null;
    if (!tabs.length) {
        return <Empty>Aucune cagnotte disponible.</Empty>;
    }

    return (
        <div className="space-y-6">
            <label className="block max-w-full lg:max-w-xs">
                <span className="mb-1.5 block font-display text-[11px] font-extrabold uppercase tracking-wider text-texte-2">
                    Saison
                </span>
                <select
                    value={current?.id ?? ""}
                    onChange={(e) => setSelId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-bord bg-carte px-3 text-sm text-white outline-none focus:border-rose"
                >
                    {tabs.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                            {s.closed ? " 🔒" : ""}
                        </option>
                    ))}
                </select>
            </label>

            {current && <SeasonView key={current.id} season={current} editor={editor} />}
        </div>
    );
}
