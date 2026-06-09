// Client API minimal vers le backend. Le proxy Vite route /api et /auth vers :3001,
// donc on reste same-origin et le cookie de session est envoyé automatiquement.

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
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
