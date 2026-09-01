import { executeSync } from "./service.js";

/** CLI du sync : npm run sync [-- --scope current] */
async function main() {
    const scope =
        process.argv.includes("--scope") && process.argv[process.argv.indexOf("--scope") + 1] === "current"
            ? ("current" as const)
            : ("full" as const);
    console.log(`→ Sync MPG (${scope})...`);
    const startedAt = Date.now();
    const run = await executeSync("manual", { scope });
    console.log("Statut:", run.status, `— ${Math.round((Date.now() - startedAt) / 1000)} s`);
    console.log(run.summary);
}

main()
    .catch((err) => {
        console.error("✗ Sync échoué:", err?.message ?? err);
        process.exit(1);
    })
    .finally(() => process.exit(0));
