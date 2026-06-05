import { config } from "../config.js";
import { prisma } from "../db/client.js";
import { runSync } from "./sync.js";

/**
 * Wrapper autour de runSync, utilisé à la fois par le déclenchement manuel et par le cron.
 * - empêche deux syncs simultanés (verrou en mémoire),
 * - enregistre chaque exécution dans SyncRun (observabilité).
 */
let running = false;

export async function executeSync(trigger: "manual" | "auto", opts?: { leagueId?: string }) {
  if (!config.mpgAdminEmail || !config.mpgAdminPassword) {
    throw new Error("Identifiants admin MPG non configurés (.env)");
  }
  if (running) {
    throw new Error("Un sync est déjà en cours");
  }
  running = true;
  const run = await prisma.syncRun.create({ data: { trigger, status: "running" } });
  try {
    const result = await runSync(config.mpgAdminEmail, config.mpgAdminPassword, opts);
    return await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "success", finishedAt: new Date(), summary: JSON.stringify(result) },
    });
  } catch (err: any) {
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "error", finishedAt: new Date(), error: err?.message ?? String(err) },
    });
    throw err;
  } finally {
    running = false;
  }
}
