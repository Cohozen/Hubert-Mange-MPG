import { config } from "../config.js";
import { MpgConnector } from "../connector/index.js";
import { prisma } from "../db/client.js";
import { decrypt, encrypt, isEncryptionConfigured } from "../lib/crypto.js";
import type { SyncScope } from "./planner.js";
import { runSync } from "./sync.js";

/**
 * Wrapper autour de runSync, utilisé à la fois par le déclenchement manuel et par le cron.
 * - empêche deux syncs simultanés (verrou en mémoire),
 * - enregistre chaque exécution dans SyncRun (observabilité).
 */
let running = false;

/** Message du verrou : le planner le reconnaît pour ne pas logguer une erreur sur un skip normal. */
export const SYNC_BUSY_MSG = "Un sync est déjà en cours";

const TOKEN_EXPIRED_MSG = "Token MPG expiré ou absent — reconnecte-toi pour relancer la synchronisation.";

/**
 * Construit un connecteur MPG à partir des tokens (chiffrés) capturés au login d'un membre.
 * Valide l'access token par un appel /user ; s'il a expiré et qu'on dispose d'un refresh token,
 * on le renouvelle et on le re-persiste, de façon transparente. Sinon, throw explicite.
 */
export async function connectorForManager(managerId: string): Promise<MpgConnector> {
    if (!isEncryptionConfigured()) {
        throw new Error(TOKEN_EXPIRED_MSG);
    }
    const manager = await prisma.manager.findUnique({
        where: { id: managerId },
        select: { mpgTokenEncrypted: true, mpgRefreshTokenEncrypted: true },
    });

    const accessToken = safeDecrypt(manager?.mpgTokenEncrypted);
    if (accessToken) {
        const mpg = MpgConnector.fromToken(accessToken);
        try {
            await mpg.apiGet("/user"); // préflight : valide que le token est encore actif.
            return mpg;
        } catch {
            // Token expiré (ou révoqué) : on tente le renouvellement ci-dessous.
        }
    }

    const refreshToken = safeDecrypt(manager?.mpgRefreshTokenEncrypted);
    if (!refreshToken) {
        throw new Error(TOKEN_EXPIRED_MSG);
    }
    let mpg: MpgConnector;
    try {
        mpg = await MpgConnector.fromRefreshToken(refreshToken);
    } catch (err: any) {
        console.error("Renouvellement du token MPG échoué:", err?.message ?? err);
        throw new Error(TOKEN_EXPIRED_MSG);
    }
    await persistTokens(managerId, mpg);
    return mpg;
}

function safeDecrypt(enc: string | null | undefined): string | undefined {
    if (!enc) return undefined;
    try {
        return decrypt(enc);
    } catch {
        return undefined;
    }
}

/** Re-persiste les tokens après un renouvellement (Auth0 fait tourner les refresh tokens). */
async function persistTokens(managerId: string, mpg: MpgConnector): Promise<void> {
    try {
        await prisma.manager.update({
            where: { id: managerId },
            data: {
                mpgTokenEncrypted: encrypt(mpg.token),
                mpgTokenUpdatedAt: new Date(),
                ...(mpg.refreshToken ? { mpgRefreshTokenEncrypted: encrypt(mpg.refreshToken) } : {}),
            },
        });
    } catch (err: any) {
        // Le sync peut continuer avec le token en mémoire même si l'écriture échoue.
        console.error("Persistance du token MPG échouée:", err?.message ?? err);
    }
}

export async function executeSync(
    trigger: "manual" | "auto",
    opts?: { leagueId?: string; mpg?: MpgConnector; scope?: SyncScope },
) {
    if (running) {
        throw new Error(SYNC_BUSY_MSG);
    }
    // ⚠️ Le verrou se pose AVANT le login MPG : sinon deux runs concurrents (tick du planner et
    // sync manuel) déclenchent deux flows Auth0 chez Ligue1 — protégé par Cloudflare — avant que
    // l'un des deux ne soit rejeté.
    running = true;
    const scope: SyncScope = opts?.scope ?? "full";
    try {
        // Connecteur : fourni par l'appelant (sync manuel = token du membre connecté), sinon on
        // retombe sur les identifiants admin .env (cron auto-sync, non-attendu).
        let mpg = opts?.mpg;
        if (!mpg) {
            if (!config.mpgAdminEmail || !config.mpgAdminPassword) {
                throw new Error("Identifiants admin MPG non configurés (.env)");
            }
            mpg = await MpgConnector.login(config.mpgAdminEmail, config.mpgAdminPassword);
        }
        return await recordRun(trigger, scope, mpg, opts?.leagueId);
    } finally {
        running = false;
    }
}

/** Trace l'exécution dans `SyncRun` (observabilité) et relaie l'erreur éventuelle. */
async function recordRun(
    trigger: "manual" | "auto",
    scope: SyncScope,
    mpg: MpgConnector,
    leagueId: string | undefined,
) {
    const run = await prisma.syncRun.create({ data: { trigger, scope, status: "running" } });
    try {
        const result = await runSync(mpg, { leagueId, scope });
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
    }
}
