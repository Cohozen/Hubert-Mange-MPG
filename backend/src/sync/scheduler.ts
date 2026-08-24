import { Cron } from "croner";
import { config } from "../config.js";
import { executeSync } from "./service.js";

export interface ScheduleInfo {
    /** L'auto-sync tournera-t-il vraiment ? */
    enabled: boolean;
    cron: string;
    tz: string;
    /** Prochaine exécution (ISO), `null` si l'auto-sync est inactif. */
    nextRun: string | null;
    /** Identifiants admin MPG présents — sans eux le cron s'arrête en silence. */
    credentialsOk: boolean;
}

/**
 * Décrit l'auto-sync tel qu'il tournera réellement, aux mêmes conditions que `startScheduler`.
 * L'admin affichait « Active » en dur : un `AUTO_SYNC=false` ou un `.env` incomplet passaient
 * inaperçus alors que plus rien ne se synchronisait.
 */
export function describeSchedule(): ScheduleInfo {
    const credentialsOk = Boolean(config.mpgAdminEmail && config.mpgAdminPassword);
    const enabled = config.autoSync && credentialsOk;
    let nextRun: string | null = null;
    if (enabled) {
        // Cron sans handler : sert uniquement à calculer la prochaine occurrence.
        const probe = new Cron(config.syncCron, { timezone: config.syncTz });
        nextRun = probe.nextRun()?.toISOString() ?? null;
        probe.stop();
    }
    return { enabled, cron: config.syncCron, tz: config.syncTz, nextRun, credentialsOk };
}

/**
 * Planifie le sync automatique (par défaut lundi 08:30 Europe/Paris).
 * Nécessite un process Node persistant (Railway/Render/VPS) — pas du serverless.
 */
export function startScheduler(): void {
    if (!config.autoSync) {
        console.log("Auto-sync désactivé (AUTO_SYNC=false).");
        return;
    }
    if (!describeSchedule().credentialsOk) {
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
