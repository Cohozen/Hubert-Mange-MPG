import crypto from "node:crypto";
import axios, { AxiosResponse } from "axios";

/**
 * Flow d'authentification MPG.
 *
 * ⚠️ Flow non officiel et fragile : si MPG/Ligue1 change son auth, c'est ICI qu'on corrige.
 *
 * Depuis la refonte MPG d'août 2026, mpg.football est une SPA Expo statique : les routes Remix
 * (`?_data=...`, `/auth/callback`) ont disparu et l'authentification est déléguée à
 * **Auth0 Universal Login** sur connect.ligue1.fr. On rejoue donc côté serveur un
 * Authorization Code + PKCE complet :
 *
 *   1. GET  /authorize            → 302 vers /u/login?state=… (+ cookies did/auth0/__cf_bm)
 *   2. GET  /u/login?state=…      → page de login, on en extrait le `state` du formulaire
 *   3. POST /u/login?state=…      → 302 vers /authorize/resume?state=…
 *   4. GET  /authorize/resume     → 302 vers https://mpg.football/?code=…
 *   5. POST /oauth/token          → { access_token, refresh_token, expires_in }
 *
 * Le token obtenu est un JWT Auth0 (audience https://mpg.ligue1.fr) à passer en Bearer sur
 * api.mpg.football. Constantes extraites du bundle du client web MPG.
 */

const AUTH0_ORIGIN = "https://connect.ligue1.fr";
const CLIENT_ID = "XNNUupMREjh0ULck1InJRC6gb8kyMfdg";
const AUDIENCE = "https://mpg.ligue1.fr";
const REDIRECT_URI = "https://mpg.football/";
const SCOPE = "openid profile email offline_access";

/** Sans User-Agent crédible, Cloudflare (devant connect.ligue1.fr) peut nous filtrer. */
const USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/** Erreur d'authentification, avec la cause distinguée pour la route de login. */
export class MpgAuthError extends Error {
    constructor(
        message: string,
        /** `credentials` = identifiants refusés par Auth0 ; `flow` = le flow lui-même a cassé. */
        readonly kind: "credentials" | "flow",
    ) {
        super(message);
        this.name = "MpgAuthError";
    }
}

export interface MpgTokens {
    /** JWT Auth0 à envoyer en `Authorization: Bearer` sur api.mpg.football. */
    accessToken: string;
    /** Présent si le client Auth0 autorise offline_access — permet de renouveler sans mot de passe. */
    refreshToken?: string;
    /** Date d'expiration estimée de l'access token. */
    expiresAt?: Date;
}

/** Bocal à cookies minimal, partagé sur toute la durée du flow (did, auth0, __cf_bm…). */
type Jar = Map<string, string>;

function absorb(jar: Jar, res: AxiosResponse): void {
    for (const raw of res.headers["set-cookie"] ?? []) {
        const [pair] = raw.split(";");
        const eq = pair.indexOf("=");
        if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
    }
}

function jarHeader(jar: Jar): string {
    return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

function base64url(buf: Buffer): string {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Requêtes du flow : on gère les redirects à la main et on accepte tous les statuts. */
function hop(jar: Jar, extra?: Record<string, string>) {
    return {
        maxRedirects: 0,
        validateStatus: () => true,
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "fr-FR,fr;q=0.9",
            Cookie: jarHeader(jar),
            ...extra,
        },
    };
}

export async function authenticateMPG(email: string, password: string): Promise<MpgTokens> {
    const jar: Jar = new Map();
    const verifier = base64url(crypto.randomBytes(32));
    const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());

    // Étape 1 : /authorize → redirige vers la page de login Auth0.
    const authorizeUrl = `${AUTH0_ORIGIN}/authorize?${new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: SCOPE,
        audience: AUDIENCE,
        code_challenge: challenge,
        code_challenge_method: "S256",
        state: base64url(crypto.randomBytes(16)),
    })}`;
    const authorize = await axios.get(authorizeUrl, hop(jar));
    absorb(jar, authorize);
    const loginPath = authorize.headers.location;
    if (!loginPath?.includes("/u/login")) {
        throw new MpgAuthError(
            `MPG auth (1/5) : /authorize n'a pas redirigé vers la page de login (status ${authorize.status}, location "${loginPath ?? "absente"}"). Auth0 a peut-être changé.`,
            "flow",
        );
    }

    // Étape 2 : charger la page de login pour en extraire le `state` du formulaire.
    const loginUrl = `${AUTH0_ORIGIN}${loginPath}`;
    const loginPage = await axios.get<string>(loginUrl, hop(jar));
    absorb(jar, loginPage);
    const stateMatch = String(loginPage.data).match(/name="state"\s+value="([^"]+)"/);
    if (!stateMatch) {
        throw new MpgAuthError(
            `MPG auth (2/5) : champ 'state' introuvable dans le formulaire de login (status ${loginPage.status}). La page Universal Login a changé.`,
            "flow",
        );
    }

    // Étape 3 : soumettre les identifiants.
    const login = await axios.post(
        loginUrl,
        new URLSearchParams({
            state: stateMatch[1],
            username: email,
            password,
            action: "default",
        }).toString(),
        hop(jar, { "Content-Type": "application/x-www-form-urlencoded", Origin: AUTH0_ORIGIN, Referer: loginUrl }),
    );
    absorb(jar, login);
    const resumePath = login.headers.location ?? "";
    if (!resumePath.includes("/authorize/resume")) {
        // Auth0 renvoie sur /u/login (ou re-rend la page en 4xx) quand les identifiants sont refusés.
        if (resumePath.includes("/u/login") || login.status >= 400) {
            throw new MpgAuthError("Identifiants MPG refusés par Ligue1.", "credentials");
        }
        if (resumePath.includes("/u/mfa") || resumePath.includes("/u/verify")) {
            throw new MpgAuthError(
                "MPG auth (3/5) : Ligue1 demande une vérification supplémentaire (MFA / e-mail) — impossible à automatiser.",
                "flow",
            );
        }
        throw new MpgAuthError(
            `MPG auth (3/5) : le formulaire de login n'a pas abouti (status ${login.status}, location "${resumePath || "absente"}").`,
            "flow",
        );
    }

    // Étape 4 : /authorize/resume délivre le code d'autorisation dans le redirect final.
    const resume = await axios.get(`${AUTH0_ORIGIN}${resumePath}`, hop(jar));
    absorb(jar, resume);
    const finalLocation = resume.headers.location ?? "";
    const code = new URL(finalLocation, REDIRECT_URI).searchParams.get("code");
    if (!code) {
        throw new MpgAuthError(
            `MPG auth (4/5) : code d'autorisation absent du redirect final (status ${resume.status}, location "${finalLocation || "absente"}").`,
            "flow",
        );
    }

    // Étape 5 : échanger le code contre les tokens (PKCE, client public → pas de secret).
    return exchange(
        {
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            code,
            code_verifier: verifier,
            redirect_uri: REDIRECT_URI,
        },
        "5/5",
    );
}

/** Renouvelle un access token à partir d'un refresh token (aucun mot de passe requis). */
export async function refreshMpgToken(refreshToken: string): Promise<MpgTokens> {
    return exchange(
        {
            grant_type: "refresh_token",
            client_id: CLIENT_ID,
            refresh_token: refreshToken,
        },
        "refresh",
    );
}

async function exchange(body: Record<string, string>, step: string): Promise<MpgTokens> {
    const res = await axios.post(`${AUTH0_ORIGIN}/oauth/token`, body, {
        validateStatus: () => true,
        headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
    });
    if (res.status !== 200 || !res.data?.access_token) {
        const detail = res.data?.error_description ?? res.data?.error ?? `status ${res.status}`;
        throw new MpgAuthError(`MPG auth (${step}) : échec de l'échange de token Auth0 (${detail}).`, "flow");
    }
    return {
        accessToken: res.data.access_token,
        refreshToken: res.data.refresh_token ?? undefined,
        expiresAt: res.data.expires_in ? new Date(Date.now() + res.data.expires_in * 1000) : undefined,
    };
}
