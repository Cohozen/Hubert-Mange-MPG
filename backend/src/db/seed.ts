import { prisma } from "./client.js";

/**
 * Données de démonstration pour tester l'appli sans MPG.
 * Lancer : npx tsx src/db/seed.ts
 */
async function main() {
    // Repart de zéro (ordre respectant les FK).
    await prisma.payout.deleteMany();
    await prisma.contribution.deleteMany();
    await prisma.prizePool.deleteMany();
    await prisma.participation.deleteMany();
    await prisma.division.deleteMany();
    await prisma.gameSeason.deleteMany();
    await prisma.realSeason.deleteMany();
    await prisma.manager.deleteMany();

    const names = ["Alice", "Bob", "Chloé", "David", "Emma", "Franck"];
    const managers = await Promise.all(
        names.map((displayName, i) =>
            prisma.manager.create({
                data: {
                    displayName,
                    email: `${displayName.toLowerCase()}@example.com`,
                    roles: i === 0 ? "SUPERADMIN,TREASURER" : "", // Alice = superadmin + banquier
                },
            }),
        ),
    );

    const realSeason = await prisma.realSeason.create({
        data: { name: "2024-2025", year: 2024 },
    });

    const gameSeason = await prisma.gameSeason.create({
        data: { realSeasonId: realSeason.id, index: 1, name: "Saison 1", status: "finished" },
    });

    const d1 = await prisma.division.create({
        data: { gameSeasonId: gameSeason.id, level: 1, name: "Division 1" },
    });

    // Classement final D1.
    await Promise.all(
        managers.map((m, i) =>
            prisma.participation.create({
                data: {
                    managerId: m.id,
                    divisionId: d1.id,
                    finalRank: i + 1,
                    points: 50 - i * 5,
                },
            }),
        ),
    );

    // Cagnotte de la saison réelle : mise unique 20 €, 4/6 ont payé.
    const pool = await prisma.prizePool.create({
        data: { realSeasonId: realSeason.id, buyInAmount: 2000, currency: "EUR" },
    });
    await Promise.all(
        managers.map((m, i) =>
            prisma.contribution.create({
                data: { prizePoolId: pool.id, managerId: m.id, amount: 2000, paid: i < 4 },
            }),
        ),
    );
    await prisma.payout.create({
        data: {
            prizePoolId: pool.id,
            managerId: managers[0].id,
            gameSeasonId: gameSeason.id,
            amount: 8000,
            reason: "Vainqueur D1",
        },
    });

    const admin = managers[0];
    console.log("✓ Seed terminé.");
    console.log("  Admin:", admin.displayName, admin.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => process.exit(0));
