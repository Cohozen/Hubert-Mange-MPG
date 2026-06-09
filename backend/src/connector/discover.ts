import { mkdir, writeFile } from "node:fs/promises";
import { config } from "../config.js";
import { MpgConnector } from "./index.js";

/**
 * Crawler de découverte de l'API MPG. Se connecte (identifiants admin .env), suit
 * automatiquement dashboard → ligues → divisions → classements/équipes, et SAUVEGARDE
 * tous les JSON dans backend/discovery/parsed/ pour inspection.
 *
 * Endpoints confirmés via HAR :
 *   GET /user                                 -> utilisateur courant
 *   GET /dashboard                            -> ligues de l'utilisateur
 *   GET /championships/active                 -> championnats actifs
 *   GET /league/{leagueId}                    -> détail ligue (divisions, saisons)
 *   GET /league/{leagueId}/winners?season=N   -> vainqueurs d'une saison
 *   GET /division/{divisionId}                -> détail division
 *   GET /division/{divisionId}/ranking/standings -> classement
 *   GET /teams/division/{divisionId}          -> équipes/managers de la division
 *
 * Format des IDs : mpg_league_XXXX, mpg_division_XXXX_{saison}_{division}
 *
 * Lancer : npm run discover
 * ⚠️ Les fichiers générés (données perso + token) sont gitignorés (discovery/).
 */

const OUT_DIR = new URL("../../discovery/parsed/", import.meta.url).pathname;

async function main() {
  if (!config.mpgAdminEmail || !config.mpgAdminPassword) {
    throw new Error("Renseigne MPG_ADMIN_EMAIL et MPG_ADMIN_PASSWORD dans backend/.env.");
  }
  await mkdir(OUT_DIR, { recursive: true });

  console.log("→ Authentification MPG...");
  const mpg = await MpgConnector.login(config.mpgAdminEmail, config.mpgAdminPassword);
  console.log("✓ Authentifié. Token présent:", Boolean(mpg.token));

  const dump = async (name: string, data: unknown) => {
    await writeFile(`${OUT_DIR}${name}.json`, JSON.stringify(data, null, 2), "utf8");
    console.log(`  ✓ ${name}.json`);
  };

  const tryGet = async (name: string, path: string): Promise<any | null> => {
    try {
      const data = await mpg.apiGet(path);
      await dump(name, data);
      return data;
    } catch (err: any) {
      console.log(`  ✗ ${path} → ${err?.response?.status ?? err?.message}`);
      return null;
    }
  };

  // Niveau 0 : compte + ligues.
  await tryGet("user", "/user");
  const dashboard = await tryGet("dashboard", "/dashboard");
  await tryGet("championships-active", "/championships/active");
  await tryGet("badge-config", "/badge/config");

  // Extraction générique des IDs de ligue depuis le JSON du dashboard.
  const dashStr = JSON.stringify(dashboard ?? {});
  const leagueIds = [...new Set(dashStr.match(/mpg_league_[A-Za-z0-9]+/g) ?? [])];
  console.log(`\n→ Ligues détectées : ${leagueIds.length ? leagueIds.join(", ") : "aucune"}`);

  for (const leagueId of leagueIds) {
    const league = await tryGet(`league_${leagueId}`, `/league/${leagueId}`);
    const leagueStr = JSON.stringify(league ?? {});

    // Saisons présentes (pour winners).
    const seasons = [
      ...new Set((leagueStr.match(/"season"\s*:\s*(\d+)/g) ?? []).map((s) => s.match(/\d+/)![0])),
    ];
    for (const season of seasons.length ? seasons : ["1"]) {
      await tryGet(
        `winners_${leagueId}_s${season}`,
        `/league/${leagueId}/winners?season=${season}`,
      );
    }

    // Divisions : mpg_division_{league}_{saison}_{division}
    const divisionIds = [...new Set(leagueStr.match(/mpg_division_[A-Za-z0-9_]+/g) ?? [])];
    console.log(`  Divisions de ${leagueId} : ${divisionIds.length}`);
    for (const divId of divisionIds) {
      await tryGet(`division_${divId}`, `/division/${divId}`);
      await tryGet(`standings_${divId}`, `/division/${divId}/ranking/standings`);
      await tryGet(`teams_${divId}`, `/teams/division/${divId}`);
      await tryGet(`users_${divId}`, `/division/${divId}/users`);
      await tryGet(`seasonBadges_${divId}`, `/division/${divId}/ranking/seasonBadges`);
      await tryGet(`seasonStats_${divId}`, `/division-season-stats/${divId}`);
      // Résultats par journée : on sonde quelques journées pour capter la structure.
      for (const gw of [1, 5, 10]) {
        await tryGet(`matches_${divId}_gw${gw}`, `/division/${divId}/game-week/${gw}/matches`);
      }
    }
  }

  // Tournois (coupes). On sonde plusieurs endpoints candidats par tournoi.
  const tournamentIds = [...new Set(dashStr.match(/mpg_tournament_[A-Za-z0-9]+/g) ?? [])];
  console.log(
    `\n→ Tournois détectés : ${tournamentIds.length ? tournamentIds.join(", ") : "aucun"}`,
  );
  for (const tId of tournamentIds) {
    await tryGet(`tournament_${tId}`, `/tournament/${tId}`);
    await tryGet(`tournament_${tId}_ranking`, `/tournament/${tId}/ranking`);
    await tryGet(`tournament_${tId}_standings`, `/tournament/${tId}/ranking/standings`);
    await tryGet(`tournament_${tId}_calendar`, `/tournament/${tId}/calendar`);
    await tryGet(`tournament_${tId}_teams`, `/teams/tournament/${tId}`);
    await tryGet(`tournament_${tId}_winners`, `/tournament/${tId}/winners`);
    await tryGet(`tournament_${tId}_phases`, `/tournament/${tId}/phases`);
    await tryGet(`tournament_${tId}_brackets`, `/tournament/${tId}/brackets`);
  }

  console.log("\nTerminé. Inspecte backend/discovery/parsed/ (ou demande-moi de le lire).");
}

main().catch((err) => {
  console.error("✗ Erreur:", err?.message ?? err);
  process.exit(1);
});
