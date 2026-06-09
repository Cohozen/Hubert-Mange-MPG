import { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { prisma } from "../db/client.js";
import { readSession, SESSION_COOKIE } from "../auth/session.js";
import { canEditCagnotte, canManageLeagues, isSuperadmin, parseRoles, ROLES } from "../auth/roles.js";

export interface AuthContext {
    managerId: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    roles: string[];
}

// Étend Request avec le contexte d'authentification courant.
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            auth?: AuthContext;
        }
    }
}

/**
 * Lit le cookie de session, charge le manager et calcule ses rôles (rôles stockés + rôle
 * SUPERADMIN si son userId MPG est en config). Recalculé à chaque requête → un changement
 * de rôle prend effet immédiatement, sans re-login.
 */
export async function attachSession(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const payload = readSession(req.cookies?.[SESSION_COOKIE]);
        if (payload) {
            const manager = await prisma.manager.findUnique({ where: { id: payload.managerId } });
            if (manager) {
                const roles = parseRoles(manager.roles);
                if (
                    manager.mpgUserId &&
                    config.superadminMpgUserIds.includes(manager.mpgUserId) &&
                    !roles.includes(ROLES.SUPERADMIN)
                ) {
                    roles.push(ROLES.SUPERADMIN);
                }
                req.auth = {
                    managerId: manager.id,
                    displayName: manager.displayName,
                    username: manager.username,
                    avatarUrl: manager.avatarUrl,
                    roles,
                };
            }
        }
    } catch {
        // En cas d'erreur DB on continue en non-authentifié.
    }
    next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (!req.auth) {
        res.status(401).json({ error: "Authentification requise" });
        return;
    }
    next();
}

export function requireSuperadmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.auth || !isSuperadmin(req.auth.roles)) {
        res.status(403).json({ error: "Accès superadmin requis" });
        return;
    }
    next();
}

export function requireLeagueAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.auth || !canManageLeagues(req.auth.roles)) {
        res.status(403).json({ error: "Droits admin de league requis" });
        return;
    }
    next();
}

export function requireCagnotteEditor(req: Request, res: Response, next: NextFunction): void {
    if (!req.auth || !canEditCagnotte(req.auth.roles)) {
        res.status(403).json({ error: "Droits cagnotte requis (banquier/admin)" });
        return;
    }
    next();
}
