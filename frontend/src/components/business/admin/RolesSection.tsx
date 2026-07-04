import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { SettingsCard } from "@/components/business/settings/SettingsCard";
import { cn } from "@/lib/utils";

interface ManagerRow {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    roles: string[];
}

const ASSIGNABLE = [
    { code: "ADMIN", label: "Admin" },
    { code: "TREASURER", label: "Banquier" },
];

function initials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

function Avatar({ name }: { name: string }) {
    return (
        <div className="grid size-[38px] shrink-0 place-items-center rounded-full font-display text-xs font-black text-white grad-banner">
            {initials(name)}
        </div>
    );
}

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

    const all = managers.data ?? [];
    const superadmins = all.filter((m) => m.roles.includes("SUPERADMIN"));
    const members = all.filter((m) => !m.roles.includes("SUPERADMIN"));

    return (
        <SettingsCard
            bar="linear-gradient(90deg,#FF2D78,#FF6B35)"
            title="Gestion des rôles"
            right={
                <span className="rounded-full border border-rouge/40 bg-rouge/[0.12] px-2.5 py-1 font-display text-[9px] font-black uppercase tracking-[1px] text-[#FF6B8A]">
                    Superadmin
                </span>
            }
        >
            <p className="mb-4 text-[13px] text-texte-2">Attribue les rôles Admin et Banquier à chaque manager.</p>

            <div className="flex flex-col gap-2.5">
                {members.map((m) => (
                    <div
                        key={m.id}
                        className="lhm-row flex items-center gap-3 rounded-[14px] border border-bord bg-nuit p-3 transition"
                    >
                        <Avatar name={m.displayName} />
                        <div className="min-w-0 flex-1">
                            <div className="truncate font-display text-[13px] font-black tracking-[0.2px] text-white">
                                {m.displayName}
                            </div>
                            {m.username && <div className="mt-0.5 truncate text-[10px] text-texte-2">{m.username}</div>}
                        </div>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                            {ASSIGNABLE.map((role) => {
                                const active = m.roles.includes(role.code);
                                return (
                                    <button
                                        key={role.code}
                                        type="button"
                                        onClick={() => toggle(m, role.code)}
                                        className={cn(
                                            "rounded-full border px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-[0.5px] transition",
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

            {superadmins.length > 0 && (
                <>
                    <div className="my-4 flex items-center gap-3">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-rouge/45" />
                        <span className="font-display text-[10px] font-black uppercase tracking-[2px] text-[#FF6B8A]">
                            ⬩ Superadmin ⬩
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-rouge/45" />
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {superadmins.map((m) => (
                            <div
                                key={m.id}
                                className="flex items-center gap-3 rounded-[14px] border border-rouge/30 bg-rouge/[0.05] p-3"
                            >
                                <Avatar name={m.displayName} />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-display text-[13px] font-black tracking-[0.2px] text-white">
                                        {m.displayName}
                                    </div>
                                    {m.username && (
                                        <div className="mt-0.5 truncate text-[10px] text-texte-2">{m.username}</div>
                                    )}
                                </div>
                                <span className="rounded-full border border-rouge/40 bg-rouge/[0.12] px-3 py-1.5 font-display text-[9px] font-black uppercase tracking-[0.8px] text-[#FF6B8A]">
                                    Superadmin
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <p className="mt-4 border-t border-bord pt-4 text-[11px] leading-relaxed text-[#5A6293]">
                Le rôle <b className="text-texte-2">Superadmin</b> ne s'attribue que depuis la console serveur (config).
                Les suppressions de ligue ou tournoi lui sont réservées.
            </p>
        </SettingsCard>
    );
}
