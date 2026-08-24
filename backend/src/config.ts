import "dotenv/config";

/** Valeur de repli du secret de session : tolérée en local, refusée en prod. */
const DEV_SESSION_SECRET = "dev-insecure-secret";

const databaseUrl = process.env.DATABASE_URL ?? "";

/**
 * Postgres ⇒ on tourne en prod (Railway + Supabase).
 *
 * ⚠️ On ne peut PAS se fier à NODE_ENV : DEPLOY.md interdit de le poser sur Railway (sinon les
 * devDeps prisma/tsc ne s'installent pas au build), donc `isProd` y est faux. Le `file:` de SQLite
 * est le marqueur fiable du local — c'est déjà le garde-fou de `scripts/clone-prod.mjs`.
 */
const isPostgres = databaseUrl !== "" && !databaseUrl.startsWith("file:");

export const config = {
    port: Number(process.env.PORT ?? 3001),
    sessionSecret: process.env.SESSION_SECRET ?? DEV_SESSION_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY ?? "",
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    // Identifiants admin MPG : requis uniquement pour l'auto-sync (cron) et le CLI `npm run sync`.
    // Le sync manuel + la découverte admin passent par le token du superadmin connecté.
    mpgAdminEmail: process.env.MPG_ADMIN_EMAIL ?? "",
    mpgAdminPassword: process.env.MPG_ADMIN_PASSWORD ?? "",
    isProd: process.env.NODE_ENV === "production",
    isPostgres,
    // Cookie de session en Secure (HTTPS). Mettre COOKIE_SECURE=true en prod.
    cookieSecure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    // Auto-sync : activé par défaut. Lundi 08:30 Europe/Paris (résultats publiés vers 8h).
    autoSync: process.env.AUTO_SYNC !== "false",
    syncCron: process.env.SYNC_CRON ?? "30 8 * * 1",
    syncTz: process.env.SYNC_TZ ?? "Europe/Paris",
    // userId MPG des superadmins (séparés par des virgules). Ex: "user_3482203".
    superadminMpgUserIds: (process.env.SUPERADMIN_MPG_USER_IDS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
};

/**
 * Garde-fou de démarrage. Un secret manquant en prod ne se rattrape pas au runtime :
 *  - SESSION_SECRET absent (ou laissé au repli de dev) ⇒ n'importe qui peut forger un cookie de
 *    session et se faire passer pour le superadmin ;
 *  - ENCRYPTION_KEY absente ⇒ IBAN et tokens MPG ne sont plus stockés, le sync manuel casse.
 * Mieux vaut refuser de démarrer que servir une appli ouverte ou muette.
 */
if (config.isPostgres) {
    const missing: string[] = [];
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === DEV_SESSION_SECRET) {
        missing.push("SESSION_SECRET");
    }
    if (!config.encryptionKey) missing.push("ENCRYPTION_KEY");
    if (missing.length > 0) {
        throw new Error(
            `Démarrage refusé : ${missing.join(" et ")} ${
                missing.length > 1 ? "sont obligatoires" : "est obligatoire"
            } sur une base Postgres (prod). Voir DEPLOY.md.`,
        );
    }
} else if (!config.encryptionKey) {
    console.warn("ENCRYPTION_KEY absente : IBAN et tokens MPG ne seront pas stockés (dev uniquement).");
}
