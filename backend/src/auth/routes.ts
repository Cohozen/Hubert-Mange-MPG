import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { MpgConnector } from "../connector/index.js";
import { config } from "../config.js";
import { clearSession, issueSession } from "./session.js";
import { requireAuth } from "../http/middleware.js";
import { encrypt, isEncryptionConfigured } from "../lib/crypto.js";

export const authRouter = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

/**
 * "Se connecter avec MPG" : on vérifie les identifiants via le connecteur, on ne stocke
 * JAMAIS le mot de passe. On relie/crée le Manager puis on émet une session applicative.
 */
authRouter.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Email et mot de passe requis" });
        return;
    }
    const { email, password } = parsed.data;

    let mpgUserId: string | undefined;
    let displayName: string | undefined;
    let username: string | undefined;
    let avatarUrl: string | undefined;
    let userLeagueIds: string[] = [];
    let mpgToken: string | undefined;
    try {
        const mpg = await MpgConnector.login(email, password);
        mpgToken = mpg.token;
        // Endpoint réel confirmé : GET /user → { id, firstName, username, avatarUrl, email }.
        const u = await mpg.apiGet<any>("/user");
        mpgUserId = u?.id;
        username = u?.username;
        avatarUrl = u?.avatarUrl;
        displayName = u?.firstName || u?.username || email.split("@")[0];
        // Ligues de l'utilisateur (pour le garde-fou).
        const dash = await mpg.apiGet<any>("/dashboard").catch(() => null);
        userLeagueIds = (dash?.orderedTiles ?? [])
            .filter((t: any) => t.type === "league" && t.leagueId)
            .map((t: any) => t.leagueId);
    } catch {
        res.status(401).json({ error: "Identifiants MPG invalides" });
        return;
    }

    // Garde-fou : seuls les membres d'au moins une ligue SUIVIE (ou un superadmin) peuvent entrer.
    const tracked = await prisma.trackedLeague.findMany({ where: { active: true } });
    const trackedIds = new Set(tracked.map((t) => t.mpgLeagueId));
    const isConfigSuperadmin = !!mpgUserId && config.superadminMpgUserIds.includes(mpgUserId);
    let inTracked = userLeagueIds.some((id) => trackedIds.has(id));
    if (!inTracked && mpgUserId) {
        // Repli : déjà synchronisé dans une ligue suivie (cas d'une ligue masquée par l'utilisateur).
        const existing = await prisma.manager.findUnique({
            where: { mpgUserId },
            include: { participations: { include: { division: { include: { gameSeason: true } } } } },
        });
        inTracked = !!existing?.participations.some(
            (p) => p.division.gameSeason.mpgLeagueId && trackedIds.has(p.division.gameSeason.mpgLeagueId),
        );
    }
    if (!inTracked && !isConfigSuperadmin) {
        res.status(403).json({
            error: "Accès réservé aux membres d'une ligue suivie par l'appli.",
        });
        return;
    }

    // Token MPG chiffré (capturé au login) : sert au sync manuel + à la découverte admin.
    // On ne casse jamais le login si le chiffrement n'est pas configuré ou échoue.
    let tokenFields: { mpgTokenEncrypted: string; mpgTokenUpdatedAt: Date } | undefined;
    if (mpgToken && isEncryptionConfigured()) {
        try {
            tokenFields = { mpgTokenEncrypted: encrypt(mpgToken), mpgTokenUpdatedAt: new Date() };
        } catch {
            // chiffrement indisponible : on continue sans stocker le token.
        }
    }

    // Upsert du manager. On relie par mpgUserId si dispo, sinon par email.
    const manager = await prisma.manager.upsert({
        where: mpgUserId ? { mpgUserId } : { email },
        update: { email, displayName: displayName ?? email, username, avatarUrl, ...tokenFields },
        create: {
            mpgUserId,
            email,
            displayName: displayName ?? email,
            username,
            avatarUrl,
            ...tokenFields,
        },
    });

    issueSession(res, { managerId: manager.id });
    res.json({ id: manager.id, displayName: manager.displayName });
});

authRouter.post("/logout", (_req, res) => {
    clearSession(res);
    res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
    // req.auth (calculé par attachSession) contient déjà les rôles à jour.
    res.json({
        id: req.auth!.managerId,
        displayName: req.auth!.displayName,
        username: req.auth!.username,
        avatarUrl: req.auth!.avatarUrl,
        roles: req.auth!.roles,
    });
});
