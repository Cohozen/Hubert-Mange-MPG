import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { requireAuth, requireCagnotteEditor } from "../../http/middleware.js";

/**
 * Module cagnotte (par SAISON RÉELLE). Montants en CENTIMES.
 * - Mise annuelle unique (buyInAmount), identique pour tous.
 * - Le banquier coche qui a payé sa mise et marque les reversements payés.
 * - VERROU : seule la saison réelle la plus récente est éditable ; les années passées sont
 *   verrouillées (imposé côté serveur, pas seulement dans l'UI).
 * Lecture : membres connectés. Édition : banquier / admin / superadmin.
 */
export const cagnotteRouter = Router();

cagnotteRouter.use(requireAuth);

const sumPaid = (rows: { amount: number; paid: boolean }[]) =>
  rows.filter((r) => r.paid).reduce((a, r) => a + r.amount, 0);
const sumAll = (rows: { amount: number }[]) => rows.reduce((a, r) => a + r.amount, 0);

/** Charge la cagnotte et vérifie qu'elle est éditable (non clôturée). Sinon répond et renvoie null. */
async function loadEditablePool(prizePoolId: string, res: any) {
  const pool = await prisma.prizePool.findUnique({ where: { id: prizePoolId } });
  if (!pool) {
    res.status(404).json({ error: "Cagnotte introuvable" });
    return null;
  }
  if (pool.closed) {
    res.status(409).json({ error: "Cagnotte clôturée (lecture seule)" });
    return null;
  }
  return pool;
}

// Liste des cagnottes (une par saison réelle) avec totaux.
cagnotteRouter.get("/", async (_req, res) => {
  const pools = await prisma.prizePool.findMany({
    include: { realSeason: true, contributions: true, payouts: true },
    orderBy: { realSeason: { year: "desc" } },
  });
  res.json(
    pools.map((p) => ({
      id: p.id,
      realSeasonId: p.realSeasonId,
      season: p.realSeason.name,
      year: p.realSeason.year,
      closed: p.closed,
      currency: p.currency,
      buyInAmount: p.buyInAmount,
      contributors: p.contributions.length,
      paidContributors: p.contributions.filter((c) => c.paid).length,
      totalExpected: sumAll(p.contributions),
      totalCollected: sumPaid(p.contributions),
      totalPaidOut: sumPaid(p.payouts),
    }))
  );
});

// Saisons réelles (pour les onglets) + état de la cagnotte (existe ? clôturée ?).
cagnotteRouter.get("/seasons", async (_req, res) => {
  const seasons = await prisma.realSeason.findMany({
    orderBy: { year: "desc" },
    include: { prizePool: true },
  });
  res.json(
    seasons.map((s) => ({
      id: s.id,
      name: s.name,
      year: s.year,
      poolId: s.prizePool?.id ?? null,
      closed: s.prizePool?.closed ?? false,
    }))
  );
});

// Détail d'une cagnotte.
cagnotteRouter.get("/:id", async (req, res) => {
  const pool = await prisma.prizePool.findUnique({
    where: { id: req.params.id },
    include: {
      realSeason: true,
      contributions: { include: { manager: true }, orderBy: { manager: { displayName: "asc" } } },
      payouts: { include: { manager: true, gameSeason: true } },
    },
  });
  if (!pool) {
    res.status(404).json({ error: "Cagnotte introuvable" });
    return;
  }
  const totalCollected = sumPaid(pool.contributions);
  const totalPaidOut = sumPaid(pool.payouts);
  res.json({
    id: pool.id,
    season: pool.realSeason.name,
    year: pool.realSeason.year,
    closed: pool.closed,
    currency: pool.currency,
    buyInAmount: pool.buyInAmount,
    totalExpected: sumAll(pool.contributions),
    totalCollected,
    totalPaidOut,
    balance: totalCollected - totalPaidOut,
    contributions: pool.contributions.map((c) => ({
      id: c.id,
      managerId: c.managerId,
      manager: c.manager.displayName,
      username: c.manager.username,
      avatarUrl: c.manager.avatarUrl,
      amount: c.amount,
      paid: c.paid,
    })),
    payouts: pool.payouts.map((p) => ({
      id: p.id,
      managerId: p.managerId,
      manager: p.manager.displayName,
      username: p.manager.username,
      avatarUrl: p.manager.avatarUrl,
      amount: p.amount,
      reason: p.reason,
      paid: p.paid,
      gameSeasonId: p.gameSeasonId,
      gameSeason: p.gameSeason?.name ?? null,
    })),
  });
});

// ---- Édition (banquier / admin / superadmin) ----

cagnotteRouter.post("/", requireCagnotteEditor, async (req, res) => {
  const schema = z.object({
    realSeasonId: z.string().min(1),
    buyInAmount: z.number().int().nonnegative().default(0),
    currency: z.string().default("EUR"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "realSeasonId requis" });
    return;
  }
  const pool = await prisma.prizePool.create({ data: parsed.data });
  res.status(201).json(pool);
});

// Clôturer / rouvrir une cagnotte (non bloqué par l'état clôturé, pour pouvoir rouvrir).
cagnotteRouter.put("/:id/closed", requireCagnotteEditor, async (req, res) => {
  const schema = z.object({ closed: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "closed (booléen) requis" });
    return;
  }
  const exists = await prisma.prizePool.findUnique({ where: { id: req.params.id } });
  if (!exists) {
    res.status(404).json({ error: "Cagnotte introuvable" });
    return;
  }
  const pool = await prisma.prizePool.update({
    where: { id: req.params.id },
    data: { closed: parsed.data.closed },
  });
  res.json(pool);
});

cagnotteRouter.put("/:id", requireCagnotteEditor, async (req, res) => {
  const schema = z.object({
    buyInAmount: z.number().int().nonnegative().optional(),
    currency: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }
  if (!(await loadEditablePool(req.params.id, res))) return;
  const pool = await prisma.prizePool.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(pool);
});

// Crée les contributions pour tous les membres actifs de la saison réelle, au montant de la mise.
cagnotteRouter.post("/:id/init-participants", requireCagnotteEditor, async (req, res) => {
  const pool = await loadEditablePool(req.params.id, res);
  if (!pool) return;
  const participations = await prisma.participation.findMany({
    where: { division: { gameSeason: { realSeasonId: pool.realSeasonId } } },
    select: { managerId: true },
    distinct: ["managerId"],
  });
  let created = 0;
  for (const { managerId } of participations) {
    const existing = await prisma.contribution.findUnique({
      where: { prizePoolId_managerId: { prizePoolId: pool.id, managerId } },
    });
    if (!existing) {
      await prisma.contribution.create({
        data: { prizePoolId: pool.id, managerId, amount: pool.buyInAmount },
      });
      created++;
    }
  }
  res.json({ participants: participations.length, created });
});

cagnotteRouter.put("/:id/contributions/:managerId", requireCagnotteEditor, async (req, res) => {
  const schema = z.object({
    paid: z.boolean().optional(),
    amount: z.number().int().nonnegative().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }
  const pool = await loadEditablePool(req.params.id, res);
  if (!pool) return;
  const { paid, amount } = parsed.data;
  const data = {
    ...(paid !== undefined ? { paid, paidAt: paid ? new Date() : null } : {}),
    ...(amount !== undefined ? { amount } : {}),
  };
  const contribution = await prisma.contribution.upsert({
    where: { prizePoolId_managerId: { prizePoolId: pool.id, managerId: req.params.managerId } },
    update: data,
    create: {
      prizePoolId: pool.id,
      managerId: req.params.managerId,
      amount: amount ?? pool.buyInAmount,
      paid: paid ?? false,
      paidAt: paid ? new Date() : null,
    },
  });
  res.json(contribution);
});

cagnotteRouter.post("/:id/payouts", requireCagnotteEditor, async (req, res) => {
  const schema = z.object({
    managerId: z.string().min(1),
    amount: z.number().int().nonnegative(),
    reason: z.string().min(1),
    gameSeasonId: z.string().optional(),
    paid: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "managerId, amount (centimes) et reason requis" });
    return;
  }
  if (!(await loadEditablePool(req.params.id, res))) return;
  const { paid, ...rest } = parsed.data;
  const payout = await prisma.payout.create({
    data: {
      prizePoolId: req.params.id,
      ...rest,
      paid: paid ?? false,
      paidAt: paid ? new Date() : null,
    },
  });
  res.status(201).json(payout);
});

cagnotteRouter.put("/payouts/:payoutId", requireCagnotteEditor, async (req, res) => {
  const schema = z.object({
    paid: z.boolean().optional(),
    amount: z.number().int().nonnegative().optional(),
    reason: z.string().min(1).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }
  const existing = await prisma.payout.findUnique({ where: { id: req.params.payoutId } });
  if (!existing || !(await loadEditablePool(existing.prizePoolId, res))) {
    if (!existing) res.status(404).json({ error: "Reversement introuvable" });
    return;
  }
  const { paid, ...rest } = parsed.data;
  const payout = await prisma.payout.update({
    where: { id: req.params.payoutId },
    data: { ...rest, ...(paid !== undefined ? { paid, paidAt: paid ? new Date() : null } : {}) },
  });
  res.json(payout);
});

// ---- Grille de gains fixes + génération automatique ----

// Règles + niveaux de division présents dans la saison réelle.
cagnotteRouter.get("/:id/rules", requireCagnotteEditor, async (req, res) => {
  const pool = await prisma.prizePool.findUnique({
    where: { id: req.params.id },
    include: { rules: true },
  });
  if (!pool) {
    res.status(404).json({ error: "Cagnotte introuvable" });
    return;
  }
  const divisions = await prisma.division.findMany({
    where: { gameSeason: { realSeasonId: pool.realSeasonId } },
    select: { level: true },
    distinct: ["level"],
    orderBy: { level: "asc" },
  });
  const tournaments = await prisma.tournament.findMany({
    where: { realSeasonId: pool.realSeasonId },
    select: { competition: true, name: true, year: true },
  });
  res.json({
    rules: pool.rules,
    divisionLevels: divisions.map((d) => d.level),
    competitions: [...new Set(tournaments.map((t) => t.competition))],
  });
});

// Remplace la grille (montants fixes).
cagnotteRouter.put("/:id/rules", requireCagnotteEditor, async (req, res) => {
  const schema = z.object({
    rules: z.array(
      z.object({
        scope: z.enum(["DIVISION", "LDC", "UEFA"]),
        divisionLevel: z.number().int().positive().nullable().optional(),
        amount: z.number().int().nonnegative(),
        label: z.string().min(1),
      })
    ),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Grille invalide" });
    return;
  }
  if (!(await loadEditablePool(req.params.id, res))) return;

  await prisma.$transaction([
    prisma.payoutRule.deleteMany({ where: { prizePoolId: req.params.id } }),
    prisma.payoutRule.createMany({
      data: parsed.data.rules.map((r) => ({
        prizePoolId: req.params.id,
        scope: r.scope,
        divisionLevel: r.scope === "DIVISION" ? (r.divisionLevel ?? null) : null,
        amount: r.amount,
        label: r.label,
      })),
    }),
  ]);
  const rules = await prisma.payoutRule.findMany({ where: { prizePoolId: req.params.id } });
  res.json({ rules });
});

// Génère les reversements des vainqueurs depuis les classements (idempotent).
cagnotteRouter.post("/:id/generate-payouts", requireCagnotteEditor, async (req, res) => {
  const pool = await loadEditablePool(req.params.id, res);
  if (!pool) return;

  const allRules = await prisma.payoutRule.findMany({ where: { prizePoolId: pool.id } });
  const ruleByLevel = new Map(
    allRules.filter((r) => r.scope === "DIVISION").map((r) => [r.divisionLevel, r])
  );
  const cupRule = (comp: string) => allRules.find((r) => r.scope === comp);
  if (allRules.length === 0) {
    res.status(400).json({ error: "Définis d'abord la grille de gains." });
    return;
  }

  // Seules les saisons jeu TERMINÉES sont payées.
  const gameSeasons = await prisma.gameSeason.findMany({
    where: { realSeasonId: pool.realSeasonId, status: "finished" },
    include: {
      divisions: { include: { participations: { where: { finalRank: 1 } } } },
    },
  });

  let created = 0;
  let updated = 0;
  for (const gs of gameSeasons) {
    for (const div of gs.divisions) {
      const winner = div.participations[0];
      const rule = ruleByLevel.get(div.level);
      if (!winner || !rule) continue;
      const reason = `${rule.label} — ${gs.name}`;
      const existing = await prisma.payout.findFirst({
        where: { prizePoolId: pool.id, gameSeasonId: gs.id, divisionLevel: div.level, auto: true },
      });
      if (existing) {
        if (existing.paid) continue; // déjà versé : on n'y touche pas
        await prisma.payout.update({
          where: { id: existing.id },
          data: { managerId: winner.managerId, amount: rule.amount, reason },
        });
        updated++;
      } else {
        await prisma.payout.create({
          data: {
            prizePoolId: pool.id,
            gameSeasonId: gs.id,
            divisionLevel: div.level,
            managerId: winner.managerId,
            amount: rule.amount,
            reason,
            auto: true,
          },
        });
        created++;
      }
    }
  }

  // Reversements de coupe : LDC + UEFA de la saison réelle (coupes terminées = winner connu).
  const tournaments = await prisma.tournament.findMany({
    where: { realSeasonId: pool.realSeasonId },
  });
  for (const t of tournaments) {
    const rule = cupRule(t.competition); // règle LDC ou UEFA
    if (!rule || !t.winnerManagerId) continue;
    const reason = `${rule.label} ${t.year}`;
    const existing = await prisma.payout.findFirst({
      where: { prizePoolId: pool.id, tournamentId: t.id, auto: true },
    });
    if (existing) {
      if (existing.paid) continue; // déjà versé : on n'y touche pas
      await prisma.payout.update({
        where: { id: existing.id },
        data: { managerId: t.winnerManagerId, amount: rule.amount, reason },
      });
      updated++;
    } else {
      await prisma.payout.create({
        data: {
          prizePoolId: pool.id,
          tournamentId: t.id,
          managerId: t.winnerManagerId,
          amount: rule.amount,
          reason,
          auto: true,
        },
      });
      created++;
    }
  }

  res.json({ created, updated });
});

cagnotteRouter.delete("/payouts/:payoutId", requireCagnotteEditor, async (req, res) => {
  const existing = await prisma.payout.findUnique({ where: { id: req.params.payoutId } });
  if (!existing) {
    res.status(404).json({ error: "Reversement introuvable" });
    return;
  }
  if (!(await loadEditablePool(existing.prizePoolId, res))) return;
  await prisma.payout.delete({ where: { id: req.params.payoutId } });
  res.json({ ok: true });
});
