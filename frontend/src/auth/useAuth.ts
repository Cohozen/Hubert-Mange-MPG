import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export interface Me {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  roles: string[];
}

export function isSuperadmin(me: Me | null | undefined): boolean {
  return !!me?.roles.includes("SUPERADMIN");
}

export function canEditCagnotte(me: Me | null | undefined): boolean {
  return !!me?.roles.some((r) => ["SUPERADMIN", "ADMIN", "TREASURER"].includes(r));
}

// Superadmin et admin de league : gestion des ligues/tournois suivis + sync (page Admin).
export function isLeagueAdmin(me: Me | null | undefined): boolean {
  return !!me?.roles.some((r) => ["SUPERADMIN", "ADMIN"].includes(r));
}

// Récupère l'utilisateur courant (null si non connecté).
export function useAuth() {
  return useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api<Me>("/auth/me");
      } catch {
        return null;
      }
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return async () => {
    await api("/auth/logout", { method: "POST" });
    qc.invalidateQueries({ queryKey: ["me"] });
  };
}
