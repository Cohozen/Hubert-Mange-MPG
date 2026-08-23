import type { TimelineSeason } from "@/components/business/profile/types";

/** Faits marquants dérivés de la trajectoire : point de départ, montée, relégations. */
function careerFacts(seasons: TimelineSeason[]): string[] {
    if (!seasons.length) return [];
    const first = seasons[0];
    const last = seasons[seasons.length - 1];
    let relegations = 0;
    for (let i = 1; i < seasons.length; i++) if (seasons[i].level > seasons[i - 1].level) relegations++;
    const facts = [`🚀 Parti de Division ${first.level} en ${first.year}`];
    if (last.level < first.level) facts.push(`📈 Montée D${first.level} → D${last.level} en ${seasons.length} saisons`);
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
