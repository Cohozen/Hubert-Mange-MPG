// Clone les données de la prod (Postgres/Supabase) vers la base SQLite locale.
//
// Usage :
//   PROD_DATABASE_URL="postgresql://...:...@db.<ref>.supabase.co:5432/postgres" \
//     npm run clone:prod
//   (ou bien définir PROD_DATABASE_URL dans backend/.env)
//
// Lecture de la prod en direct via `pg`, écriture en local via le client Prisma
// (provider sqlite). On vide la base locale puis on réinsère dans l'ordre des
// dépendances de clés étrangères. Les montants restent en centimes (Int).
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const PROD_URL = process.env.PROD_DATABASE_URL;
if (!PROD_URL) {
    console.error(
        "❌ PROD_DATABASE_URL manquant.\n" +
            "   Récupère la chaîne de connexion sur Supabase → Connect → ORM/psql,\n" +
            "   puis : PROD_DATABASE_URL='postgresql://...' npm run clone:prod\n" +
            "   (ou ajoute-la dans backend/.env).",
    );
    process.exit(1);
}

// Garde-fou : refuser de tourner si la base "locale" pointe en réalité sur Postgres.
if (!String(process.env.DATABASE_URL || "").startsWith("file:")) {
    console.error(`❌ DATABASE_URL local doit pointer sur SQLite (file:...), trouvé : ${process.env.DATABASE_URL}`);
    process.exit(1);
}

// Ordre d'insertion : parents avant enfants (FK). La suppression se fait à l'envers.
// [nom table Postgres, delegate Prisma]
const TABLES = [
    ["Manager", "manager"],
    ["RealSeason", "realSeason"],
    ["GameSeason", "gameSeason"],
    ["Division", "division"],
    ["Participation", "participation"],
    ["DivisionAward", "divisionAward"],
    ["Match", "match"],
    ["Tournament", "tournament"],
    ["Cup", "cup"],
    ["CupRound", "cupRound"],
    ["CupMatch", "cupMatch"],
    ["PrizePool", "prizePool"],
    ["PayoutRule", "payoutRule"],
    ["Contribution", "contribution"],
    ["Payout", "payout"],
    ["SyncRun", "syncRun"],
    ["TrackedLeague", "trackedLeague"],
    ["TrackedTournament", "trackedTournament"],
];

const pgClient = new pg.Client({
    connectionString: PROD_URL,
    ssl: { rejectUnauthorized: false }, // Supabase impose TLS
});
const prisma = new PrismaClient();

async function main() {
    await pgClient.connect();
    console.log("→ Connecté à la prod. Lecture des tables…");

    // 1) Lire toute la prod en mémoire (volume faible).
    const data = {};
    for (const [table] of TABLES) {
        const { rows } = await pgClient.query(`SELECT * FROM "${table}"`);
        data[table] = rows;
        console.log(`   ${table}: ${rows.length}`);
    }

    // 2) Vider la base locale (enfants → parents).
    console.log("→ Purge de la base SQLite locale…");
    for (const [, delegate] of [...TABLES].reverse()) {
        await prisma[delegate].deleteMany();
    }

    // 3) Réinsérer (parents → enfants). pg renvoie déjà des Date/boolean/number natifs.
    console.log("→ Insertion en local…");
    for (const [table, delegate] of TABLES) {
        const rows = data[table];
        if (rows.length === 0) continue;
        // createMany par lots pour rester confortable même si une table grossit.
        const BATCH = 500;
        for (let i = 0; i < rows.length; i += BATCH) {
            await prisma[delegate].createMany({ data: rows.slice(i, i + BATCH) });
        }
        console.log(`   ${table}: ${rows.length} insérés`);
    }

    console.log("✓ Clone terminé. Base locale alignée sur la prod.");
}

main()
    .catch((e) => {
        console.error("❌ Échec du clone :", e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pgClient.end();
    });
