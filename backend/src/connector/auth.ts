import axios, { AxiosResponse } from "axios";
import crypto from "node:crypto";

/**
 * Flow d'authentification MPG, reproduit depuis le gist de référence
 * (https://gist.github.com/ClementRoyer/d8eeaf8f05253f7618db3b49a8594af3).
 *
 * Le flow passe par l'OAuth Ligue1 (connect.ligue1.fr) puis renvoie :
 *  - `session` : le cookie __session de mpg.football (pour lire les routes Remix ?_data=...)
 *  - `token`   : le token de l'API api.mpg.football (header Authorization)
 *
 * ⚠️ Flow non officiel et fragile : si MPG/Ligue1 change son OAuth, c'est ICI qu'on corrige.
 */

const accept = (status: number) => status < 400;

function cookieHeader(setCookie: string[] | undefined): string {
    return (setCookie ?? []).map((c) => c.split(";")[0]).join("; ");
}

export interface MpgSession {
    /** Cookie __session de mpg.football (routes Remix ?_data=...). */
    session: string;
    /** Token de l'API api.mpg.football (header Authorization). */
    token: string;
    /** Données brutes du dashboard renvoyées par mpg.football/dashboard?_data=root. */
    dashboard: any;
}

export async function authenticateMPG(email: string, password: string): Promise<MpgSession> {
    const amplitudeId = crypto.randomUUID();

    // Étape 1 : init auth côté MPG → renvoie un redirect x-remix-redirect vers Ligue1.
    const auth = await axios.post(
        `https://mpg.football/auth?_data=routes%2F__home%2F__auth%2Fauth&ext-amplitudeId=${amplitudeId}`,
        new URLSearchParams({ email, password }).toString(),
        {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            maxRedirects: 0,
            validateStatus: accept,
        },
    );

    const remixRedirect = auth.headers["x-remix-redirect"];
    if (!remixRedirect) {
        throw new Error("MPG auth: header x-remix-redirect absent (identifiants invalides ?)");
    }

    // Étape 2 : suivre le redirect vers l'OAuth Ligue1.
    const redirectUrl = remixRedirect.replace("ext-amplitudeId=", `ext-amplitudeId=${amplitudeId}`);
    const oauth: AxiosResponse = await axios.get(redirectUrl, {
        maxRedirects: 0,
        validateStatus: accept,
    });

    // Étape 3 : soumettre les identifiants au login Ligue1.
    const loginUrl = `https://connect.ligue1.fr${oauth.headers.location}`;
    const stateMatch = loginUrl.match(/state=([^&]+)/);
    if (!stateMatch) {
        throw new Error("MPG auth: paramètre 'state' introuvable dans l'URL de login Ligue1");
    }
    const state = stateMatch[1];
    const cookies = cookieHeader(oauth.headers["set-cookie"]);

    const login: AxiosResponse = await axios.post(
        loginUrl,
        new URLSearchParams({ state, username: email, password }).toString(),
        {
            headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookies },
            maxRedirects: 0,
            validateStatus: accept,
        },
    );

    // Étape 4 : récupérer le code d'autorisation via l'URL "resume".
    const resumeUrl = `https://connect.ligue1.fr${login.headers.location}`;
    const resumeCookies = cookieHeader(login.headers["set-cookie"]);
    const resume: AxiosResponse<string> = await axios.get(resumeUrl, {
        headers: { Cookie: resumeCookies },
    });

    const codeMatch = String(resume.data).match(/name="code"\s+value="([^"]+)"/);
    if (!codeMatch) {
        throw new Error("MPG auth: code d'autorisation introuvable (login Ligue1 échoué ?)");
    }
    const code = codeMatch[1];

    // Étape 5 : échanger le code contre une session côté MPG.
    const callback: AxiosResponse = await axios.post("https://mpg.football/auth/callback", `code=${code}`, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        maxRedirects: 0,
        validateStatus: accept,
    });

    const sessionCookie = (callback.headers["set-cookie"] ?? []).find((c) => c.startsWith("__session="));
    if (!sessionCookie) {
        throw new Error("MPG auth: cookie __session absent dans la réponse du callback");
    }
    const session = sessionCookie.split(";")[0].split("=")[1];

    // Étape 6 : lire le dashboard pour récupérer le token d'API.
    const dashboard: AxiosResponse = await axios.get("https://mpg.football/dashboard?_data=root", {
        headers: { Cookie: `__session=${session}` },
    });

    return {
        session,
        token: dashboard.data?.token,
        dashboard: dashboard.data,
    };
}
