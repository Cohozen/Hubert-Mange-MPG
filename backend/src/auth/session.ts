import { Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

const COOKIE_NAME = "mpg_session";
const MAX_AGE_DAYS = 30;

export interface SessionPayload {
    managerId: string;
}

export function issueSession(res: Response, payload: SessionPayload): void {
    const token = jwt.sign(payload, config.sessionSecret, {
        expiresIn: `${MAX_AGE_DAYS}d`,
    });
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: config.cookieSecure,
        maxAge: MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    });
}

export function clearSession(res: Response): void {
    res.clearCookie(COOKIE_NAME);
}

export function readSession(cookieValue: string | undefined): SessionPayload | null {
    if (!cookieValue) return null;
    try {
        return jwt.verify(cookieValue, config.sessionSecret) as SessionPayload;
    } catch {
        return null;
    }
}

export const SESSION_COOKIE = COOKIE_NAME;
