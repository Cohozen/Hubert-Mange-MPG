/**
 * Rôles applicatifs.
 *  - SUPERADMIN : toi (le dev). Tout. Attribué via config (userId MPG) ou rôle stocké.
 *  - ADMIN      : admin de league. Peut éditer la cagnotte, gérer les ligues/tournois suivis
 *                 et déclencher le sync (pas la structure ni l'attribution des rôles).
 *  - TREASURER  : banquier. Peut éditer la cagnotte.
 * MEMBER = aucun rôle (lecture seule).
 */
export const ROLES = {
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN",
  TREASURER: "TREASURER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Rôles attribuables depuis l'UI (le superadmin se configure via son userId MPG). */
export const ASSIGNABLE_ROLES: Role[] = [ROLES.ADMIN, ROLES.TREASURER];

export function parseRoles(csv: string | null | undefined): string[] {
  return (csv ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializeRoles(roles: string[]): string {
  return [...new Set(roles)].filter((r) => r).join(",");
}

export function isSuperadmin(roles: string[]): boolean {
  return roles.includes(ROLES.SUPERADMIN);
}

/** Superadmin, admin de league et banquier peuvent éditer la cagnotte. */
export function canEditCagnotte(roles: string[]): boolean {
  return roles.some((r) =>
    [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TREASURER].includes(r as Role)
  );
}

/** Superadmin et admin de league peuvent gérer les ligues/tournois suivis et lancer le sync. */
export function canManageLeagues(roles: string[]): boolean {
  return roles.includes(ROLES.SUPERADMIN) || roles.includes(ROLES.ADMIN);
}
