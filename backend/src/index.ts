import express from "express";
import "express-async-errors"; // permet de catcher les erreurs async des routes
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { attachSession, requireSuperadmin } from "./http/middleware.js";
import { authRouter } from "./auth/routes.js";
import { cagnotteRouter } from "./modules/cagnotte/routes.js";
import { palmaresRouter } from "./modules/palmares/routes.js";
import { adminRouter } from "./modules/admin/routes.js";
import { profileRouter } from "./modules/profile/routes.js";
import { prisma } from "./db/client.js";
import { executeSync } from "./sync/service.js";
import { startScheduler } from "./sync/scheduler.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

// CORS pour le front (credentials inclus pour le cookie de session).
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", config.frontendOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(attachSession);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/api/cagnotte", cagnotteRouter);
app.use("/api/palmares", palmaresRouter);
app.use("/api/admin", adminRouter);
app.use("/api/profile", profileRouter);

// Déclenchement manuel du sync (admin).
app.post("/api/sync", requireSuperadmin, async (req, res) => {
  try {
    const leagueId = typeof req.body?.leagueId === "string" ? req.body.leagueId : undefined;
    const run = await executeSync("manual", { leagueId });
    res.json({ ...run, summary: run.summary ? JSON.parse(run.summary) : null });
  } catch (err: any) {
    res.status(502).json({ error: "Sync MPG échoué", detail: err?.message });
  }
});

// Dernière exécution de sync (admin) — pour afficher l'état dans l'UI.
app.get("/api/sync/last", requireSuperadmin, async (_req, res) => {
  const run = await prisma.syncRun.findFirst({ orderBy: { startedAt: "desc" } });
  res.json(run ? { ...run, summary: run.summary ? JSON.parse(run.summary) : null } : null);
});

// Historique des syncs (admin).
app.get("/api/sync/history", requireSuperadmin, async (_req, res) => {
  const runs = await prisma.syncRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 });
  res.json(
    runs.map((r) => ({ ...r, summary: r.summary ? JSON.parse(r.summary) : null }))
  );
});

// Handler d'erreur global : renvoie 500 propre au lieu de crasher le process.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Erreur non gérée:", err?.message ?? err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Erreur serveur" });
});

app.listen(config.port, () => {
  console.log(`API Hubert Mange MPG sur http://localhost:${config.port}`);
  startScheduler();
});
