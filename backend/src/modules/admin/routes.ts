import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { requireSuperadmin, requireAuth } from "../../http/middleware.js";
import { ASSIGNABLE_ROLES, serializeRoles } from "../../auth/roles.js";
import { config } from "../../config.js";
import { MpgConnector } from "../../connector/index.js";

/**
 * Routes d'administration de la structure de la ligue. Servent au backfill manuel des
 * saisons antérieures à l'appli (MPG ne fournit pas cet historique) et à la gestion
 * courante. Lecture pour les membres connectés, écriture réservée à l'admin.
 */
export const adminRouter = Router();

adminRouter.use(requireAuth);

// ---- Managers ----
adminRouter.get("/managers", async (_req, res) => {
  const managers = await prisma.manager.findMany({
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true, username: true, avatarUrl: true, email: true, roles: true, mpgUserId: true },
  });
  res.json(managers.map((m) => ({ ...m, roles: m.roles ? m.roles.split(",") : [] })));
});

adminRouter.post("/managers", requireSuperadmin, async (req, res) => {
  const schema = z.object({
    displayName: z.string().min(1),
    email: z.string().email().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "displayName requis" });
    return;
  }
  const manager = await prisma.manager.create({ data: parsed.data });
  res.status(201).json(manager);
});

// Attribution des rôles (superadmin uniquement). On ne stocke que les rôles attribuables
// (ADMIN, TREASURER) ; SUPERADMIN se configure via SUPERADMIN_MPG_USER_IDS.
adminRouter.put("/managers/:id/roles", requireSuperadmin, async (req, res) => {
  const schema = z.object({
    roles: z.array(z.enum(["ADMIN", "TREASURER"])).default([]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "roles doit être un tableau parmi ADMIN, TREASURER" });
    return;
  }
  const valid = parsed.data.roles.filter((r) => ASSIGNABLE_ROLES.includes(r));
  const manager = await prisma.manager.update({
    where: { id: req.params.id },
    data: { roles: serializeRoles(valid) },
    select: { id: true, displayName: true, roles: true },
  });
  res.json({ ...manager, roles: manager.roles ? manager.roles.split(",") : [] });
});

// Fusionne deux managers (ex. un membre revenu avec un autre compte MPG).
// Toutes les données de `sourceId` sont repointées vers `targetId`, puis source est supprimé.
adminRouter.post("/managers/merge", requireSuperadmin, async (req, res) => {
  const schema = z.object({ sourceId: z.string().min(1), targetId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || parsed.data.sourceId === parsed.data.targetId) {
    res.status(400).json({ error: "sourceId et targetId (différents) requis" });
    return;
  }
  const { sourceId, targetId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    // Participations : éviter le conflit d'unicité (managerId, divisionId).
    const parts = await tx.participation.findMany({ where: { managerId: sourceId } });
    for (const p of parts) {
      const clash = await tx.participation.findUnique({
        where: { managerId_divisionId: { managerId: targetId, divisionId: p.divisionId } },
      });
      if (clash) await tx.participation.delete({ where: { id: p.id } });
      else await tx.participation.update({ where: { id: p.id }, data: { managerId: targetId } });
    }
    // Contributions : éviter le conflit (prizePoolId, managerId).
    const contribs = await tx.contribution.findMany({ where: { managerId: sourceId } });
    for (const c of contribs) {
      const clash = await tx.contribution.findUnique({
        where: { prizePoolId_managerId: { prizePoolId: c.prizePoolId, managerId: targetId } },
      });
      if (clash) await tx.contribution.delete({ where: { id: c.id } });
      else await tx.contribution.update({ where: { id: c.id }, data: { managerId: targetId } });
    }
    await tx.payout.updateMany({ where: { managerId: sourceId }, data: { managerId: targetId } });
    await tx.manager.delete({ where: { id: sourceId } });
  });

  res.json({ ok: true, mergedInto: targetId });
});

// ---- Ligues suivies (sélection des ligues à synchroniser) ----
adminRouter.get("/leagues", requireSuperadmin, async (_req, res) => {
  const leagues = await prisma.trackedLeague.findMany({ orderBy: { createdAt: "asc" } });
  res.json(leagues);
});

// Ligues disponibles côté MPG (dashboard) + indicateur "suivie".
adminRouter.get("/leagues/available", requireSuperadmin, async (_req, res) => {
  if (!config.mpgAdminEmail || !config.mpgAdminPassword) {
    res.status(400).json({ error: "Identifiants admin MPG non configurés (.env)" });
    return;
  }
  try {
    const mpg = await MpgConnector.login(config.mpgAdminEmail, config.mpgAdminPassword);
    const dashboard = await mpg.apiGet<any>("/dashboard");
    const tracked = new Set(
      (await prisma.trackedLeague.findMany()).map((t) => t.mpgLeagueId)
    );
    const tiles = (dashboard?.orderedTiles ?? [])
      .filter((t: any) => t.type === "league" && t.leagueId)
      .map((t: any) => ({
        mpgLeagueId: t.leagueId,
        shortId: t.shortId,
        name: t.name,
        totalUsers: t.totalUsers,
        totalDivisions: t.totalDivisions,
        season: t.season,
        tracked: tracked.has(t.leagueId),
      }));
    res.json(tiles);
  } catch (err: any) {
    res.status(502).json({ error: "Lecture MPG échouée", detail: err?.message });
  }
});

adminRouter.post("/leagues", requireSuperadmin, async (req, res) => {
  const schema = z.object({
    mpgLeagueId: z.string().min(1),
    name: z.string().min(1),
    shortId: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "mpgLeagueId et name requis" });
    return;
  }
  const league = await prisma.trackedLeague.upsert({
    where: { mpgLeagueId: parsed.data.mpgLeagueId },
    update: { name: parsed.data.name, shortId: parsed.data.shortId, active: true },
    create: parsed.data,
  });
  res.status(201).json(league);
});

adminRouter.put("/leagues/:id", requireSuperadmin, async (req, res) => {
  const schema = z.object({ active: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "active (booléen) requis" });
    return;
  }
  const league = await prisma.trackedLeague.update({
    where: { id: req.params.id },
    data: { active: parsed.data.active },
  });
  res.json(league);
});

adminRouter.delete("/leagues/:id", requireSuperadmin, async (req, res) => {
  await prisma.trackedLeague.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---- Tournois suivis (sélection des coupes à synchroniser) ----
adminRouter.get("/tournaments", requireSuperadmin, async (_req, res) => {
  const tournaments = await prisma.trackedTournament.findMany({ orderBy: { createdAt: "asc" } });
  res.json(tournaments);
});

// Tournois disponibles côté MPG (dashboard) + indicateur "suivi".
adminRouter.get("/tournaments/available", requireSuperadmin, async (_req, res) => {
  if (!config.mpgAdminEmail || !config.mpgAdminPassword) {
    res.status(400).json({ error: "Identifiants admin MPG non configurés (.env)" });
    return;
  }
  try {
    const mpg = await MpgConnector.login(config.mpgAdminEmail, config.mpgAdminPassword);
    const dashboard = await mpg.apiGet<any>("/dashboard");
    const tracked = new Set(
      (await prisma.trackedTournament.findMany()).map((t) => t.mpgTournamentId)
    );
    const tiles = (dashboard?.orderedTiles ?? [])
      .filter((t: any) => t.type === "tournament" && t.tournamentId)
      .map((t: any) => ({
        mpgTournamentId: t.tournamentId,
        name: t.name,
        winner: t.finishedState?.winner?.firstName ?? t.finishedState?.winner?.username ?? null,
        tracked: tracked.has(t.tournamentId),
      }));
    res.json(tiles);
  } catch (err: any) {
    res.status(502).json({ error: "Lecture MPG échouée", detail: err?.message });
  }
});

adminRouter.post("/tournaments", requireSuperadmin, async (req, res) => {
  const schema = z.object({ mpgTournamentId: z.string().min(1), name: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "mpgTournamentId et name requis" });
    return;
  }
  const t = await prisma.trackedTournament.upsert({
    where: { mpgTournamentId: parsed.data.mpgTournamentId },
    update: { name: parsed.data.name, active: true },
    create: parsed.data,
  });
  res.status(201).json(t);
});

adminRouter.put("/tournaments/:id", requireSuperadmin, async (req, res) => {
  const schema = z.object({ active: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "active (booléen) requis" });
    return;
  }
  const t = await prisma.trackedTournament.update({
    where: { id: req.params.id },
    data: { active: parsed.data.active },
  });
  res.json(t);
});

adminRouter.delete("/tournaments/:id", requireSuperadmin, async (req, res) => {
  await prisma.trackedTournament.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---- Saisons réelles + saisons jeu ----
adminRouter.get("/structure", async (_req, res) => {
  const realSeasons = await prisma.realSeason.findMany({
    orderBy: { year: "desc" },
    include: {
      gameSeasons: {
        orderBy: { index: "asc" },
        include: { divisions: { orderBy: { level: "asc" } } },
      },
    },
  });
  res.json(realSeasons);
});

adminRouter.post("/real-seasons", requireSuperadmin, async (req, res) => {
  const schema = z.object({ name: z.string().min(1), year: z.number().int() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "name et year requis" });
    return;
  }
  const rs = await prisma.realSeason.create({ data: parsed.data });
  res.status(201).json(rs);
});

adminRouter.post("/game-seasons", requireSuperadmin, async (req, res) => {
  const schema = z.object({
    realSeasonId: z.string().min(1),
    index: z.number().int().min(1).max(3),
    name: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "realSeasonId, index (1-3) et name requis" });
    return;
  }
  const gs = await prisma.gameSeason.create({ data: parsed.data });
  res.status(201).json(gs);
});

adminRouter.post("/divisions", requireSuperadmin, async (req, res) => {
  const schema = z.object({
    gameSeasonId: z.string().min(1),
    level: z.number().int().min(1),
    name: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "gameSeasonId, level et name requis" });
    return;
  }
  const div = await prisma.division.create({ data: parsed.data });
  res.status(201).json(div);
});

// Upsert d'une participation (résultat d'un manager dans une division).
adminRouter.put("/participations", requireSuperadmin, async (req, res) => {
  const schema = z.object({
    managerId: z.string().min(1),
    divisionId: z.string().min(1),
    finalRank: z.number().int().positive().optional(),
    points: z.number().int().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "managerId et divisionId requis" });
    return;
  }
  const { managerId, divisionId, ...rest } = parsed.data;
  const participation = await prisma.participation.upsert({
    where: { managerId_divisionId: { managerId, divisionId } },
    update: rest,
    create: { managerId, divisionId, ...rest },
  });
  res.json(participation);
});
