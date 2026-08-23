import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { canEditCagnotte, useAuth } from "@/auth/useAuth";
import { SeasonView } from "@/components/business/cagnotte/SeasonView";
import type { SeasonRow } from "@/components/business/cagnotte/types";
import { Empty } from "@/components/ui/Empty";
import { PillTabs } from "@/components/ui/PillTabs";
import { useTabParam } from "@/lib/useTabParam";

export default function CagnottePage() {
    const { data: me } = useAuth();
    const editor = canEditCagnotte(me);
    const seasons = useQuery({
        queryKey: ["cagnotte-seasons"],
        queryFn: () => api<SeasonRow[]>("/api/cagnotte/seasons"),
    });

    // Onglets : membres → saisons avec cagnotte ; éditeurs → toutes les saisons (pour en créer).
    // Triés par année décroissante (plus récente en premier) ; par défaut on ouvre la plus récente.
    const tabs = (seasons.data ?? []).filter((s) => s.poolId || editor).sort((a, b) => b.year - a.year);
    // La saison ouverte vit dans l'URL sous son nom (`?saison=2025-2026`), plus lisible qu'un id.
    const names = tabs.map((s) => s.name);
    const [selName, setSelName] = useTabParam<string>("saison", names[0] ?? "", names);
    const current = tabs.find((s) => s.name === selName) ?? tabs[0];

    if (seasons.isLoading) return null;
    if (!tabs.length) {
        return <Empty>Aucune cagnotte disponible.</Empty>;
    }

    return (
        <div className="space-y-6">
            <header className="space-y-3.5">
                <div>
                    <h1 className="font-display text-[34px] font-black uppercase leading-[0.95] tracking-[-1.2px] text-white lg:hidden">
                        Cagnotte
                    </h1>
                    <p className="mt-1.5 text-xs text-texte-2 lg:text-sm">
                        Le pot commun de la ligue. Une mise, des trophées, une redistribution.
                    </p>
                </div>
                <PillTabs
                    value={current?.name ?? ""}
                    onChange={setSelName}
                    width="scroll"
                    items={tabs.map((s) => ({ key: s.name, label: `${s.name}${s.closed ? " 🔒" : ""}` }))}
                />
            </header>

            {current && <SeasonView key={current.id} season={current} editor={editor} />}
        </div>
    );
}
