import { executeSync } from "./service.js";

/** CLI du sync : npm run sync */
async function main() {
    console.log("→ Sync MPG...");
    const run = await executeSync("manual");
    console.log("Statut:", run.status);
    console.log(run.summary);
}

main()
    .catch((err) => {
        console.error("✗ Sync échoué:", err?.message ?? err);
        process.exit(1);
    })
    .finally(() => process.exit(0));
