import { Cron } from "croner";
import { config } from "../config.js";
import { decideSync, describeSlots, isMatchdayWindowOpen, lastSuccessAt, nextSlot, validateGrid } from "./planner.js";
import { executeSync, SYNC_BUSY_MSG } from "./service.js";

export interface ScheduleInfo {
    /** L'auto-sync tournera-t-il vraiment ? */
    enabled: boolean;
    /** Description lisible du déclenchement (grille de créneaux, ou expression cron en mode `cron`). */
    cron: string;
    tz: string;
    /** Prochaine exécution (ISO), `null` si l'auto-sync est inactif. */
    nextRun: string | null;
    /** Identifiants admin MPG présents — sans eux le cron s'arrête en silence. */
    credentialsOk: boolean;
    /** `matchday` (piloté par le calendrier des journées) ou `cron` (repli hebdomadaire). */
    mode: "matchday" | "cron";
    /** Une journée est-elle en cours ? `null` en mode `cron` (la notion n'y a pas de sens). */
    windowOpen: boolean | null;
    /** Début du dernier sync réussi, tous périmètres confondus (ISO). */
    lastSuccessAt: string | null;
    /** Début du dernier sync **complet** réussi (ISO). */
    lastFullSuccessAt: string | null;
}

/**
 * Décrit l'auto-sync tel qu'il tournera réellement, aux mêmes conditions que `startScheduler`.
 * L'admin affichait « Active » en dur : un `AUTO_SYNC=false` ou un `.env` incomplet passaient
 * inaperçus alors que plus rien ne se synchronisait.
 */
export async function describeSchedule(): Promise<ScheduleInfo> {
    const credentialsOk = Boolean(config.mpgAdminEmail && config.mpgAdminPassword);
    const enabled = config.autoSync && credentialsOk;
    const matchday = config.syncMode === "matchday";

    let nextRun: string | null = null;
    if (enabled) {
        if (matchday) {
            nextRun = nextSlot()?.at.toISOString() ?? null;
        } else {
            // Cron sans handler : sert uniquement à calculer la prochaine occurrence.
            const probe = new Cron(config.syncCron, { timezone: config.syncTz });
            nextRun = probe.nextRun()?.toISOString() ?? null;
            probe.stop();
        }
    }

    const [windowOpen, lastAny, lastFull] = await Promise.all([
        matchday ? isMatchdayWindowOpen(new Date()) : Promise.resolve(null),
        lastSuccessAt(),
        lastSuccessAt("full"),
    ]);

    return {
        enabled,
        cron: matchday ? describeSlots() : config.syncCron,
        tz: config.syncTz,
        nextRun,
        credentialsOk,
        mode: config.syncMode,
        windowOpen,
        lastSuccessAt: lastAny?.toISOString() ?? null,
        lastFullSuccessAt: lastFull?.toISOString() ?? null,
    };
}

/**
 * Planifie le sync automatique. Nécessite un process Node persistant (Railway) — pas du serverless.
 *
 * Mode `matchday` (défaut) : un tick régulier interroge le planner, qui croise une grille de
 * créneaux Ligue 1 avec l'état réel des journées en base. Mode `cron` : repli sur une unique
 * expression `SYNC_CRON`, le comportement historique.
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

    if (config.syncMode === "cron") {
        const job = new Cron(config.syncCron, { timezone: config.syncTz }, () => runAuto("full", config.syncCron));
        console.log(
            `Auto-sync planifié en mode cron (${config.syncCron}, ${config.syncTz}). ` +
                `Prochaine exécution : ${job.nextRun()?.toISOString() ?? "n/a"}`,
        );
        return;
    }

    if (config.syncCronSet) {
        console.warn(
            "SYNC_CRON est défini mais ignoré : le mode est `matchday`. " +
                "Utiliser SYNC_SLOTS pour ajuster les créneaux, ou SYNC_MODE=cron pour le repli.",
        );
    }

    for (const warning of validateGrid()) {
        console.warn(`SYNC_SLOTS : ${warning}`);
    }

    new Cron(config.syncTickCron, { timezone: config.syncTz }, async () => {
        let decision: Awaited<ReturnType<typeof decideSync>>;
        try {
            decision = await decideSync(new Date());
        } catch (err: any) {
            console.error("[auto-sync] décision impossible :", err?.message ?? err);
            return;
        }
        if (!decision.run) return; // silencieux : un tick à vide est le cas nominal.
        await runAuto(decision.scope, decision.reason);
    });

    const next = nextSlot();
    console.log(
        `Auto-sync planifié en mode matchday (tick ${config.syncTickCron}, ${config.syncTz}).\n` +
            `  Créneaux : ${describeSlots()}\n` +
            `  Prochain : ${next ? `${next.at.toISOString()} (${next.slot.label})` : "n/a"}`,
    );
}

/** Exécute un run automatique en journalisant l'issue — seule observabilité disponible sur Railway. */
async function runAuto(scope: "full" | "current", reason: string): Promise<void> {
    console.log(`[auto-sync] démarrage (${scope}) — ${reason}`);
    const startedAt = Date.now();
    try {
        const run = await executeSync("auto", { scope });
        console.log(`[auto-sync] succès en ${Math.round((Date.now() - startedAt) / 1000)} s :`, run.summary);
    } catch (err: any) {
        const message = err?.message ?? String(err);
        if (message === SYNC_BUSY_MSG) {
            // Un sync manuel est en cours : le créneau sera repris au tick suivant.
            console.log("[auto-sync] reporté : un sync est déjà en cours.");
            return;
        }
        // Pas de `lastSuccess` mis à jour ⇒ le tick suivant retentera le même créneau, jusqu'à
        // expiration de la fenêtre de rattrapage. Le message complet reste dans `SyncRun.error` :
        // les notes du sync le rendent très long, illisible dans les logs Railway.
        console.error("[auto-sync] échec :", message.length > 200 ? `${message.slice(0, 200)}…` : message);
    }
}
