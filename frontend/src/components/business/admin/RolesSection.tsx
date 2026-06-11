import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { ManagerLabel } from "@/components/ui/ManagerLabel";

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
        <section className="bg-base-100 rounded-box shadow p-6">
            <h2 className="text-lg font-bold text-base-content mb-1">Rôles</h2>
            <p className="text-sm opacity-60 mb-4">
                Attribue les rôles. Le superadmin (toi) est défini par ton compte MPG en config.
            </p>
            <div className="max-h-96 overflow-auto divide-y">
                {managers.data?.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="flex items-center gap-2 min-w-0 text-sm">
                            <ManagerLabel
                                name={m.displayName}
                                username={m.username}
                                avatarUrl={m.avatarUrl}
                                size={26}
                            />
                            {m.roles.includes("SUPERADMIN") && (
                                <span className="text-xs text-primary font-medium shrink-0">superadmin</span>
                            )}
                        </span>
                        <div className="flex gap-2 shrink-0">
                            {ASSIGNABLE.map((role) => {
                                const active = m.roles.includes(role.code);
                                return (
                                    <button
                                        key={role.code}
                                        onClick={() => toggle(m, role.code)}
                                        disabled={m.roles.includes("SUPERADMIN")}
                                        className={`text-xs rounded-full px-3 py-1 border disabled:opacity-40 ${
                                            active
                                                ? "bg-primary text-primary-content border-primary"
                                                : "bg-base-100 opacity-60 border-base-300 hover:border-base-content/40"
                                        }`}
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
