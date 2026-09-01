import { config } from "../config.js";
import { prisma } from "../db/client.js";
import type { SyncScope } from "./planner.js";
import { crossedSlot, decide, describeSlots, isMatchdayWindowOpen, lastSuccessAt, nextSlot } from "./planner.js";

/**
 * Script de diagnostic du planificateur : affiche la décision de sync à un instant donné, puis
 * **simule** les ticks des N prochains jours à partir des dates de journées réellement en base.
 *
 * Le repo n'a pas de framework de test : c'est le moyen de valider une grille de créneaux sans
 * attendre un vrai week-end ni toucher à l'API MPG.
 *
 * Lancer : npm run sync:plan [-- --at 2026-09-04T22:50:00+02:00] [-- --days 14]
 */

const TICK_MS = 15 * 60 * 1000;

function arg(name: string): string | undefined {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
}

function fmt(d: Date): string {
    return d.toLocaleString("fr-FR", { timeZone: config.syncTz, dateStyle: "short", timeStyle: "short" });
}

async function main() {
    const atRaw = arg("at");
    const now = atRaw ? new Date(atRaw) : new Date();
    if (Number.isNaN(now.getTime())) throw new Error(`--at invalide : ${atRaw}`);
    const days = Number(arg("days") ?? 14);

    console.log("=== Configuration ===");
    console.log("  mode      :", config.syncMode);
    console.log("  fuseau    :", config.syncTz);
    console.log("  tick      :", config.syncTickCron);
    console.log("  créneaux  :", describeSlots());

    console.log(`\n=== Décision à ${fmt(now)} ===`);
    const crossed = crossedSlot(now);
    const [windowOpen, lastAnyAt, lastFullAt] = await Promise.all([
        isMatchdayWindowOpen(now),
        lastSuccessAt(),
        lastSuccessAt("full"),
    ]);
    console.log("  créneau franchi :", crossed ? `${crossed.slot.label} à ${fmt(crossed.at)}` : "aucun");
    console.log("  journée en cours:", windowOpen ? "OUI" : "non");
    console.log("  dernier succès  :", lastAnyAt ? fmt(lastAnyAt) : "jamais");
    console.log("  dont complet    :", lastFullAt ? fmt(lastFullAt) : "jamais");
    const decision = decide({ crossed, windowOpen, lastAnyAt, lastFullAt });
    console.log("  →", decision.run ? `SYNC (${decision.scope}) — ${decision.reason}` : `skip — ${decision.reason}`);

    // Repères : dates de journées connues, sur lesquelles s'appuie la garde « journée en cours ».
    const upcoming = await prisma.match.findMany({
        where: { kickoffAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
        select: { gameWeek: true, kickoffAt: true },
        distinct: ["kickoffAt"],
        orderBy: { kickoffAt: "asc" },
        take: 12,
    });
    console.log("\n=== Journées datées en base ===");
    if (upcoming.length === 0) console.log("  (aucune — la garde restera fermée)");
    for (const m of upcoming) {
        if (m.kickoffAt) console.log(`  J${m.gameWeek} — ${fmt(m.kickoffAt)}`);
    }

    console.log(`\n=== Simulation des ${days} prochains jours ===`);
    // On rejoue les ticks en faisant avancer `lastSuccess` à chaque sync décidé, exactement comme
    // le ferait le scheduler. La garde « journée en cours » est relue en base pour chaque instant.
    let simAny = lastAnyAt;
    let simFull = lastFullAt;
    let runs = 0;
    const counts: Record<SyncScope, number> = { full: 0, current: 0 };
    for (let t = now.getTime(); t < now.getTime() + days * 86400000; t += TICK_MS) {
        const at = new Date(t);
        const c = crossedSlot(at);
        if (!c) continue;
        const open = c.slot.requiresWindow ? await isMatchdayWindowOpen(at) : true;
        const d = decide({ crossed: c, windowOpen: open, lastAnyAt: simAny, lastFullAt: simFull });
        if (!d.run) continue;
        console.log(`  ${fmt(at)}  ${d.scope.padEnd(7)}  ${d.reason}`);
        simAny = at;
        if (d.scope === "full") simFull = at;
        runs++;
        counts[d.scope]++;
    }
    console.log(`\n  ${runs} sync(s) sur ${days} jours — ${counts.full} complet(s), ${counts.current} léger(s).`);

    const next = nextSlot(now);
    console.log(`\nProchain créneau réel : ${next ? `${fmt(next.at)} (${next.slot.label})` : "n/a"}`);
}

main()
    .catch((err) => {
        console.error("✗ Erreur:", err?.message ?? err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
