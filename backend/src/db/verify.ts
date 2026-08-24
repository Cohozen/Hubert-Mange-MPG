/**
 * Contrôle de bon fonctionnement des endpoints de lecture : forge une session superadmin et
 * appelle l'API locale. C'est le seul filet du repo (pas de tests) — à lancer avant un push,
 * backend démarré : `npx tsx src/db/verify.ts`.
 */
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { prisma } from "./client.js";

const BASE = `http://localhost:${config.port}`;

let ok = 0;
let ko = 0;

async function main() {
    const admin = await prisma.manager.findFirst({
        where: {
            OR: [
                { roles: { contains: "SUPERADMIN" } },
                ...(config.superadminMpgUserIds.length ? [{ mpgUserId: { in: config.superadminMpgUserIds } }] : []),
            ],
        },
    });
    if (!admin) throw new Error("Aucun superadmin en base (lance le seed ou connecte-toi une fois).");
    const cookie = `mpg_session=${jwt.sign({ managerId: admin.id }, config.sessionSecret)}`;

    /** Appelle un endpoint et vérifie son code HTTP. Renvoie le corps pour enchaîner. */
    const check = async (path: string, expected = 200): Promise<any> => {
        let status = 0;
        let body: any = null;
        try {
            const res = await fetch(`${BASE}${path}`, { headers: { Cookie: cookie } });
            status = res.status;
            body = res.status === 204 ? null : await res.json().catch(() => null);
        } catch (err: any) {
            console.log(`  ✗ ${path} — injoignable (${err?.message ?? err})`);
            ko++;
            return null;
        }
        const size = Array.isArray(body)
            ? `${body.length} éléments`
            : body
              ? `${Object.keys(body).length} clés`
              : "vide";
        if (status === expected) {
            console.log(`  ✓ ${path} → ${status} (${size})`);
            ok++;
        } else {
            console.log(`  ✗ ${path} → ${status}, attendu ${expected}`);
            ko++;
        }
        return body;
    };

    console.log(`\nSession forgée pour ${admin.displayName} (superadmin).\n`);

    console.log("Identité & accueil");
    await check("/auth/me");
    await check("/api/dashboard");
    await check("/api/profile/me");

    console.log("\nPalmarès & rétro");
    await check("/api/palmares/winners");
    await check("/api/palmares/all-time");
    await check("/api/palmares/fun-stats");
    await check("/api/palmares/tournaments");
    await check(`/api/palmares/timeline/${admin.id}`);
    await check(`/api/palmares/h2h/${admin.id}`);

    console.log("\nCagnotte");
    const pools = await check("/api/cagnotte");
    await check("/api/cagnotte/seasons");
    const poolId = Array.isArray(pools) ? pools[0]?.id : null;
    if (poolId) await check(`/api/cagnotte/${poolId}`);
    else console.log("  – aucune cagnotte en base, détail non testé");

    console.log("\nPublic (sans authentification) & administration");
    await check("/api/public/teaser");
    await check("/api/sync/last");
    await check("/api/sync/config");
    await check("/api/admin/managers");

    console.log(`\n${ok} ok · ${ko} échec(s)\n`);
}

main()
    .catch((e) => {
        console.error(e);
        ko++;
    })
    .finally(() => process.exit(ko > 0 ? 1 : 0));
