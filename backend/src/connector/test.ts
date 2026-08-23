import { config } from "../config.js";
import { MpgConnector } from "./index.js";

/**
 * Script de diagnostic du connecteur : se connecte à MPG avec les identifiants admin (.env),
 * inspecte le token obtenu (audience, expiration, refresh token) et vérifie que l'API répond.
 *
 * C'est le premier point de contrôle quand la connexion MPG casse.
 *
 * Lancer : npm run connector:test
 */

/** Décode le payload d'un JWT sans vérifier la signature (diagnostic seulement). */
function decodeJwt(token: string): any | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
        return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    } catch {
        return null;
    }
}

async function main() {
    if (!config.mpgAdminEmail || !config.mpgAdminPassword) {
        throw new Error("Renseigne MPG_ADMIN_EMAIL et MPG_ADMIN_PASSWORD dans backend/.env avant de lancer ce test.");
    }

    console.log("→ Authentification MPG (Auth0)...");
    const mpg = await MpgConnector.login(config.mpgAdminEmail, config.mpgAdminPassword);
    console.log("✓ Authentifié.");

    console.log("\n=== Tokens ===");
    console.log("  access token  :", mpg.token ? `${mpg.token.slice(0, 16)}… (${mpg.token.length} car.)` : "(absent)");
    console.log("  refresh token :", mpg.refreshToken ? "OUI ✓ (renouvellement sans mot de passe possible)" : "NON");
    console.log("  expire le     :", mpg.expiresAt?.toISOString() ?? "(inconnu)");

    const claims = decodeJwt(mpg.token);
    if (claims) {
        const ttl = claims.exp && claims.iat ? Math.round((claims.exp - claims.iat) / 3600) : null;
        console.log("\n=== Claims du JWT ===");
        console.log("  aud   :", claims.aud);
        console.log("  iss   :", claims.iss);
        console.log("  scope :", claims.scope);
        console.log("  durée :", ttl !== null ? `${ttl} h` : "(inconnue)");
    } else {
        console.log("\n(le token n'est pas un JWT décodable)");
    }

    console.log("\n=== GET /user ===");
    const user = await mpg.apiGet("/user");
    console.log(`  ${user?.id} — ${user?.firstName ?? "?"} (@${user?.username ?? "?"})`);

    console.log("\n=== GET /dashboard (tuiles) ===");
    const dashboard = await mpg.apiGet("/dashboard");
    const tiles: any[] = dashboard?.orderedTiles ?? [];
    console.log(`  ${tiles.length} tuile(s)`);
    for (const t of tiles) {
        const id = t.leagueId ?? t.tournamentId ?? "?";
        console.log(`  [${t.type}] ${id} — ${t.name ?? "(sans nom)"}${t.season ? ` (saison ${t.season})` : ""}`);
    }
}

main().catch((err) => {
    console.error("✗ Erreur:", err?.message ?? err);
    if (err?.response) {
        console.error("  status:", err.response.status, "url:", err.response.config?.url);
    }
    process.exit(1);
});
