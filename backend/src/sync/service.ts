import { config } from "../config.js";
import { prisma } from "../db/client.js";
import { MpgConnector } from "../connector/index.js";
import { decrypt, isEncryptionConfigured } from "../lib/crypto.js";
import { runSync } from "./sync.js";

/**
 * Wrapper autour de runSync, utilisé à la fois par le déclenchement manuel et par le cron.
 * - empêche deux syncs simultanés (verrou en mémoire),
 * - enregistre chaque exécution dans SyncRun (observabilité).
 */
let running = false;

const TOKEN_EXPIRED_MSG =
  "Token MPG expiré ou absent — reconnecte-toi pour relancer la synchronisation.";

/**
 * Construit un connecteur MPG à partir du token (chiffré) capturé au login d'un membre.
 * Valide le token par un appel /user : si absent ou expiré (401), throw explicite.
 */
export async function connectorForManager(managerId: string): Promise<MpgConnector> {
  if (!isEncryptionConfigured()) {
    throw new Error(TOKEN_EXPIRED_MSG);
  }
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    select: { mpgTokenEncrypted: true },
  });
  if (!manager?.mpgTokenEncrypted) {
    throw new Error(TOKEN_EXPIRED_MSG);
  }
  let token: string;
  try {
    token = decrypt(manager.mpgTokenEncrypted);
  } catch {
    throw new Error(TOKEN_EXPIRED_MSG);
  }
  const mpg = MpgConnector.fromToken(token);
  try {
    await mpg.apiGet("/user"); // préflight : valide que le token est encore actif.
  } catch {
    throw new Error(TOKEN_EXPIRED_MSG);
  }
  return mpg;
}

export async function executeSync(
  trigger: "manual" | "auto",
  opts?: { leagueId?: string; mpg?: MpgConnector },
) {
  if (running) {
    throw new Error("Un sync est déjà en cours");
  }
  // Connecteur : fourni par l'appelant (sync manuel = token du membre connecté), sinon on
  // retombe sur les identifiants admin .env (cron auto-sync, non-attendu).
  let mpg = opts?.mpg;
  if (!mpg) {
    if (!config.mpgAdminEmail || !config.mpgAdminPassword) {
      throw new Error("Identifiants admin MPG non configurés (.env)");
    }
    mpg = await MpgConnector.login(config.mpgAdminEmail, config.mpgAdminPassword);
  }
  running = true;
  const run = await prisma.syncRun.create({ data: { trigger, status: "running" } });
  try {
    const result = await runSync(mpg, { leagueId: opts?.leagueId });
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
