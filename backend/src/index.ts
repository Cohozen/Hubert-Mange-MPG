import express from "express";
import "express-async-errors"; // permet de catcher les erreurs async des routes
import cookieParser from "cookie-parser";
import { authRouter } from "./auth/routes.js";
import { config } from "./config.js";
import { prisma } from "./db/client.js";
import { attachSession, requireLeagueAdmin } from "./http/middleware.js";
import { adminRouter } from "./modules/admin/routes.js";
import { cagnotteRouter } from "./modules/cagnotte/routes.js";
import { dashboardRouter } from "./modules/dashboard/routes.js";
import { palmaresRouter } from "./modules/palmares/routes.js";
import { profileRouter } from "./modules/profile/routes.js";
import { publicRouter } from "./modules/public/routes.js";
import { startScheduler } from "./sync/scheduler.js";
import { connectorForManager, executeSync } from "./sync/service.js";

const app = express();

// Railway place un proxy devant l'app : sans ça, `req.ip` vaut celle du proxy pour tout le
// monde et le limiteur de tentatives du login devient un compteur global.
app.set("trust proxy", 1);

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
// Routes sans authentification (chiffres du hero de la page de connexion).
app.use("/api/public", publicRouter);
app.use("/api/cagnotte", cagnotteRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/palmares", palmaresRouter);
app.use("/api/admin", adminRouter);
app.use("/api/profile", profileRouter);

// Déclenchement manuel du sync (admin) — via le token MPG de l'admin connecté.
app.post("/api/sync", requireLeagueAdmin, async (req, res) => {
    const leagueId = typeof req.body?.leagueId === "string" ? req.body.leagueId : undefined;
    let mpg;
    try {
        mpg = await connectorForManager(req.auth!.managerId);
    } catch (err: any) {
        res.status(401).json({ error: err?.message });
        return;
    }
    try {
        const run = await executeSync("manual", { leagueId, mpg });
        res.json({ ...run, summary: run.summary ? JSON.parse(run.summary) : null });
    } catch (err: any) {
        res.status(502).json({ error: "Sync MPG échoué", detail: err?.message });
    }
});

// Dernière exécution de sync (admin) — pour afficher l'état dans l'UI.
app.get("/api/sync/last", requireLeagueAdmin, async (_req, res) => {
    const run = await prisma.syncRun.findFirst({ orderBy: { startedAt: "desc" } });
    res.json(run ? { ...run, summary: run.summary ? JSON.parse(run.summary) : null } : null);
});

// Historique des syncs (admin).
app.get("/api/sync/history", requireLeagueAdmin, async (_req, res) => {
    const runs = await prisma.syncRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 });
    res.json(runs.map((r) => ({ ...r, summary: r.summary ? JSON.parse(r.summary) : null })));
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
