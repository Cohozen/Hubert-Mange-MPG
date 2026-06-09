import { Cron } from "croner";
import { config } from "../config.js";
import { executeSync } from "./service.js";

/**
 * Planifie le sync automatique (par défaut lundi 08:30 Europe/Paris).
 * Nécessite un process Node persistant (Railway/Render/VPS) — pas du serverless.
 */
export function startScheduler(): void {
    if (!config.autoSync) {
        console.log("Auto-sync désactivé (AUTO_SYNC=false).");
        return;
    }
    if (!config.mpgAdminEmail || !config.mpgAdminPassword) {
        console.warn("Auto-sync ignoré : identifiants admin MPG absents (.env).");
        return;
    }

    const job = new Cron(config.syncCron, { timezone: config.syncTz }, async () => {
        console.log(`[auto-sync] démarrage ${new Date().toISOString()}`);
        try {
            const run = await executeSync("auto");
            console.log("[auto-sync] succès :", run.summary);
        } catch (err: any) {
            console.error("[auto-sync] échec :", err?.message ?? err);
        }
    });

    const next = job.nextRun();
    console.log(
        `Auto-sync planifié (${config.syncCron}, ${config.syncTz}). Prochaine exécution : ${
            next ? next.toISOString() : "n/a"
        }`,
    );
}
