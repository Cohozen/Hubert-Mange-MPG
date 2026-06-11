import axios from "axios";
import { authenticateMPG, MpgSession } from "./auth.js";

/**
 * Connecteur MPG : SEUL point de contact avec MPG.
 * Le reste de l'appli ne dépend que de cette interface, pas des détails HTTP.
 *
 * Deux chemins d'accès aux données après authentification :
 *  - `getData(path)`  : routes Remix de mpg.football avec le cookie __session (ex. "/dashboard?_data=root")
 *  - `apiGet(path)`   : API api.mpg.football avec le token (header Authorization)
 *
 * Les endpoints exacts (divisions, classements) sont à confirmer via `npm run connector:test`
 * une fois authentifié — voir src/connector/test.ts.
 */
export class MpgConnector {
    private constructor(private readonly creds: MpgSession) {}

    static async login(email: string, password: string): Promise<MpgConnector> {
        const creds = await authenticateMPG(email, password);
        return new MpgConnector(creds);
    }

    /**
     * Construit un connecteur à partir d'un token API déjà obtenu (capturé au login d'un membre
     * et stocké chiffré). Seul `apiGet` est alors utilisable — `getData` (cookie __session) ne
     * l'est pas, ce qui suffit pour le sync et la découverte des ligues/tournois.
     */
    static fromToken(token: string): MpgConnector {
        return new MpgConnector({ session: "", token, dashboard: null });
    }

    get session(): string {
        return this.creds.session;
    }

    get token(): string {
        return this.creds.token;
    }

    get dashboard(): any {
        return this.creds.dashboard;
    }

    /** Lit une route Remix de mpg.football (ex. "/dashboard?_data=root"). */
    async getData<T = any>(path: string): Promise<T> {
        const url = path.startsWith("http") ? path : `https://mpg.football${path}`;
        const res = await axios.get<T>(url, {
            headers: { Cookie: `__session=${this.creds.session}` },
        });
        return res.data;
    }

    /**
     * Appelle l'API api.mpg.football avec le token (ex. "/user", "/dashboard").
     * Le site envoie le token en Bearer + quelques headers client. On tente Bearer, et en
     * cas de 401 on retombe sur le token brut (ancienne convention MPG).
     */
    async apiGet<T = any>(path: string): Promise<T> {
        const url = path.startsWith("http") ? path : `https://api.mpg.football${path}`;
        const clientHeaders = {
            "client-version": "5.3.0",
            platform: "web",
            language: "fr",
        };
        try {
            const res = await axios.get<T>(url, {
                headers: { Authorization: `Bearer ${this.creds.token}`, ...clientHeaders },
            });
            return res.data;
        } catch (err: any) {
            if (err?.response?.status === 401) {
                const res = await axios.get<T>(url, {
                    headers: { Authorization: this.creds.token, ...clientHeaders },
                });
                return res.data;
            }
            throw err;
        }
    }
}

export type { MpgSession } from "./auth.js";
export { authenticateMPG } from "./auth.js";
