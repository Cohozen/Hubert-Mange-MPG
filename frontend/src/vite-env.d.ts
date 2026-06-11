/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Base URL de l'API en prod (ex. https://api.ligue-hubert-mange.fr). Vide en local
    // (le proxy Vite gère /api et /auth vers :3001). Injectée au build par Vercel.
    readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
