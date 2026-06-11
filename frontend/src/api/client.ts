// Client API minimal vers le backend.
// - En local : VITE_API_BASE_URL est vide → on reste same-origin, le proxy Vite route
//   /api et /auth vers :3001.
// - En prod : VITE_API_BASE_URL = https://api.ligue-hubert-mange.fr → appel direct du
//   sous-domaine API (front et API sont same-site, le cookie de session passe).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
        ...options,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : res.json();
}

/** Centimes → "12,50 €". */
export function formatMoney(cents: number, currency = "EUR"): string {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(cents / 100);
}

/** Saisie en euros (ex. "12,50" ou "12.5") → centimes (1250). */
export function eurosToCents(input: string): number {
    const n = Number(String(input).replace(",", ".").trim());
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
