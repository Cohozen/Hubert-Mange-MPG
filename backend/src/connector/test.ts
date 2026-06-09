import { config } from "../config.js";
import { MpgConnector } from "./index.js";

/**
 * Script de découverte : se connecte à MPG avec les identifiants admin (.env) et imprime
 * la structure du dashboard pour repérer les leagues / divisions / IDs à synchroniser.
 *
 * Lancer : npm run connector:test
 */
async function main() {
    if (!config.mpgAdminEmail || !config.mpgAdminPassword) {
        throw new Error("Renseigne MPG_ADMIN_EMAIL et MPG_ADMIN_PASSWORD dans backend/.env avant de lancer ce test.");
    }

    console.log("→ Authentification MPG...");
    const mpg = await MpgConnector.login(config.mpgAdminEmail, config.mpgAdminPassword);

    console.log("✓ Authentifié.");
    console.log("  token (api.mpg.football) :", mpg.token ? `${mpg.token.slice(0, 12)}…` : "(absent)");
    console.log("\n=== dashboard?_data=root (clés) ===");
    console.log(Object.keys(mpg.dashboard ?? {}));
    console.log("\n=== dashboard (JSON, tronqué) ===");
    console.log(JSON.stringify(mpg.dashboard, null, 2).slice(0, 4000));

    // Piste pour l'API classique (à décommenter/ajuster selon ce qu'on trouve) :
    // const apiDash = await mpg.apiGet("/user/dashboard");
    // console.log("\n=== api /user/dashboard ===");
    // console.log(JSON.stringify(apiDash, null, 2).slice(0, 4000));
}

main().catch((err) => {
    console.error("✗ Erreur:", err?.message ?? err);
    if (err?.response) {
        console.error("  status:", err.response.status);
    }
    process.exit(1);
});
