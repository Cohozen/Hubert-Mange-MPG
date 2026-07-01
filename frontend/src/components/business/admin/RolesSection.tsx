import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { ManagerLabel } from "@/components/ui/ManagerLabel";
import { cn } from "@/lib/utils";

interface ManagerRow {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    roles: string[];
}

const ASSIGNABLE = [
    { code: "ADMIN", label: "Admin league" },
    { code: "TREASURER", label: "Banquier" },
];

export function RolesSection() {
    const qc = useQueryClient();
    const managers = useQuery<ManagerRow[]>({
        queryKey: ["admin-managers"],
        queryFn: () => api<ManagerRow[]>("/api/admin/managers"),
    });

    async function toggle(m: ManagerRow, code: string) {
        const next = m.roles.includes(code)
            ? m.roles.filter((r) => r !== code)
            : [...m.roles.filter((r) => r !== "SUPERADMIN"), code];
        await api(`/api/admin/managers/${m.id}/roles`, {
            method: "PUT",
            body: JSON.stringify({ roles: next.filter((r) => r !== "SUPERADMIN") }),
        });
        qc.invalidateQueries({ queryKey: ["admin-managers"] });
    }

    return (
        <section className="rounded-2xl border border-bord bg-carte p-6">
            <h2 className="mb-1 font-display text-lg font-black text-white">Rôles</h2>
            <p className="mb-4 text-sm text-texte-2">
                Attribue les rôles. Le superadmin (toi) est défini par ton compte MPG en config.
            </p>
            <div className="max-h-96 divide-y divide-bord overflow-auto">
                {managers.data?.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="flex min-w-0 items-center gap-2 text-sm text-white">
                            <ManagerLabel
                                name={m.displayName}
                                username={m.username}
                                avatarUrl={m.avatarUrl}
                                size={26}
                            />
                            {m.roles.includes("SUPERADMIN") && (
                                <span className="shrink-0 text-xs font-medium text-rose">superadmin</span>
                            )}
                        </span>
                        <div className="flex shrink-0 gap-2">
                            {ASSIGNABLE.map((role) => {
                                const active = m.roles.includes(role.code);
                                return (
                                    <button
                                        key={role.code}
                                        type="button"
                                        onClick={() => toggle(m, role.code)}
                                        disabled={m.roles.includes("SUPERADMIN")}
                                        className={cn(
                                            "rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-40",
                                            active
                                                ? "grad-energy border-transparent text-white"
                                                : "border-bord bg-carte text-texte-2 hover:text-white",
                                        )}
                                    >
                                        {role.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
