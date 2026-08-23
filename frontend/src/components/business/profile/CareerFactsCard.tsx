import type { TimelineSeason } from "@/components/business/profile/types";

/**
 * Faits marquants dérivés de la trajectoire : point de départ, montée, relégations.
 *
 * La montée se mesure sur le MEILLEUR niveau atteint et sur le temps qu'il a fallu pour y
 * arriver — pas sur la dernière saison : un joueur monté en D1 tôt puis redescendu méritait
 * quand même son fait d'armes, et « en N saisons » comptait à tort toute sa carrière.
 */
function careerFacts(seasons: TimelineSeason[]): string[] {
    if (!seasons.length) return [];
    const first = seasons[0];
    let relegations = 0;
    for (let i = 1; i < seasons.length; i++) if (seasons[i].level > seasons[i - 1].level) relegations++;

    // On date avec la saison réelle (« 2024-2025 ») : plusieurs saisons MPG tombent dans la même
    // année, et « en 2024 » deux fois de suite laisse croire à une erreur.
    const facts = [`🚀 Parti de Division ${first.level} en ${first.realSeason}`];

    const bestLevel = Math.min(...seasons.map((s) => s.level));
    const climbIdx = seasons.findIndex((s) => s.level === bestLevel);
    if (bestLevel < first.level) {
        const nb = climbIdx + 1; // saisons jouées, celle de l'arrivée incluse
        facts.push(
            `📈 Montée D${first.level} → D${bestLevel} en ${nb} saison${nb > 1 ? "s" : ""} (${seasons[climbIdx].realSeason})`,
        );
    }

    facts.push(
        relegations === 0
            ? `🛡️ Aucune relégation en ${seasons.length} saisons`
            : `📉 ${relegations} relégation${relegations > 1 ? "s" : ""}`,
    );
    return facts;
}

/** Card « Faits de carrière » du résumé du profil (rien à afficher → pas de card). */
export function CareerFactsCard({ seasons }: { seasons: TimelineSeason[] }) {
    const facts = careerFacts(seasons);
    if (!facts.length) return null;

    return (
        <div className="rounded-[18px] border border-dashed border-bord bg-gradient-to-br from-carte-2 to-carte p-4 lg:p-5">
            <div className="mb-3 font-display text-[10px] font-extrabold uppercase tracking-[1.5px] text-texte-2">
                Faits de carrière
            </div>
            <div className="flex flex-col gap-2.5 text-xs text-[#C7CEEF] lg:flex-row lg:flex-wrap lg:gap-x-8">
                {facts.map((f) => (
                    <div key={f}>{f}</div>
                ))}
            </div>
        </div>
    );
}
