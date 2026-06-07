import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  sessionSecret: required("SESSION_SECRET", "dev-insecure-secret"),
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  mpgAdminEmail: process.env.MPG_ADMIN_EMAIL ?? "",
  mpgAdminPassword: process.env.MPG_ADMIN_PASSWORD ?? "",
  isProd: process.env.NODE_ENV === "production",
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
