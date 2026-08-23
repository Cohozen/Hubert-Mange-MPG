import axios from "axios";
import { authenticateMPG, MpgTokens, refreshMpgToken } from "./auth.js";

/**
 * Connecteur MPG : SEUL point de contact avec MPG.
 * Le reste de l'appli ne dépend que de cette interface, pas des détails HTTP.
 *
 * Après authentification (Auth0, cf. auth.ts), tous les accès aux données passent par
 * `apiGet(path)` sur api.mpg.football, avec le JWT en `Authorization: Bearer`.
 */

/** Headers du client web MPG (relevés dans leur bundle) — certaines routes les exigent. */
const CLIENT_HEADERS = {
    platform: "web",
    "client-version": "13.3.0",
    application: "mpg",
    "client-language": "fr-FR",
};

export class MpgConnector {
    private constructor(private readonly creds: MpgTokens) {}

    static async login(email: string, password: string): Promise<MpgConnector> {
        return new MpgConnector(await authenticateMPG(email, password));
    }

    /**
     * Construit un connecteur à partir d'un access token déjà obtenu (capturé au login d'un
     * membre et stocké chiffré).
     */
    static fromToken(token: string): MpgConnector {
        return new MpgConnector({ accessToken: token });
    }

    /** Renouvelle un access token depuis un refresh token, sans mot de passe. */
    static async fromRefreshToken(refreshToken: string): Promise<MpgConnector> {
        return new MpgConnector(await refreshMpgToken(refreshToken));
    }

    get token(): string {
        return this.creds.accessToken;
    }

    get refreshToken(): string | undefined {
        return this.creds.refreshToken;
    }

    get expiresAt(): Date | undefined {
        return this.creds.expiresAt;
    }

    /** Appelle l'API api.mpg.football (ex. "/user", "/dashboard", "/league/{id}"). */
    async apiGet<T = any>(path: string): Promise<T> {
        const url = path.startsWith("http") ? path : `https://api.mpg.football${path}`;
        const res = await axios.get<T>(url, {
            headers: { Authorization: `Bearer ${this.creds.accessToken}`, ...CLIENT_HEADERS },
        });
        return res.data;
    }
}

export type { MpgTokens } from "./auth.js";
export { authenticateMPG, MpgAuthError, refreshMpgToken } from "./auth.js";
