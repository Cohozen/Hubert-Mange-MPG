import { NextFunction, Request, Response } from "express";

/**
 * Limiteur de tentatives en mémoire (fenêtre glissante par IP).
 *
 * Pourquoi maison plutôt qu'`express-rate-limit` : un seul process Node (Railway), donc rien à
 * partager entre instances — la dépendance n'apporterait que sa surface.
 *
 * ⚠️ On ne compte QUE les échecs (`registerFailure`), jamais les connexions réussies : plusieurs
 * membres peuvent partager une même IP publique (NAT d'un opérateur mobile), et une soirée
 * d'inscription ne doit pas se bloquer toute seule.
 */
export interface FailureRateLimit {
    /** À placer devant la route : refuse la requête si le quota d'échecs est atteint. */
    middleware: (req: Request, res: Response, next: NextFunction) => void;
    /** À appeler quand la tentative a échoué (mauvais identifiants, flow cassé). */
    registerFailure: (req: Request) => void;
}

export function failureRateLimit(options: { windowMs: number; max: number; message: string }): FailureRateLimit {
    const { windowMs, max, message } = options;
    const failures = new Map<string, number[]>();

    const keyOf = (req: Request) => req.ip ?? "inconnu";
    const recentOf = (key: string, now: number) => (failures.get(key) ?? []).filter((t) => now - t < windowMs);

    return {
        middleware(req, res, next) {
            const now = Date.now();
            const key = keyOf(req);
            const recent = recentOf(key, now);
            failures.set(key, recent);
            if (recent.length >= max) {
                const retryAfter = Math.ceil((windowMs - (now - recent[0])) / 1000);
                res.setHeader("Retry-After", String(retryAfter));
                res.status(429).json({ error: message });
                return;
            }
            next();
        },
        registerFailure(req) {
            const now = Date.now();
            const key = keyOf(req);
            failures.set(key, [...recentOf(key, now), now]);
            // Ménage : sans ça la Map garde une entrée par IP vue depuis le démarrage.
            if (failures.size > 1000) {
                for (const [k, times] of failures) {
                    if (times.every((t) => now - t >= windowMs)) failures.delete(k);
                }
            }
        },
    };
}
