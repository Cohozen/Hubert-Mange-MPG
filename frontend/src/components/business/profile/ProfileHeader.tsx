import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import type { TimelineSeason } from "@/components/business/profile/types";
import type { AllTimeRow, CupCount } from "@/components/business/stats/types";

function initials(name?: string | null) {
    if (!name) return "—";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Fiche « collectible » du manager : note, division, badges, stats clés. */
export function ProfileHeader({ managerId }: { managerId: string }) {
    const { data: me } = useAuth();
    const { data } = useQuery({
        queryKey: ["all-time"],
        queryFn: () => api<{ ranking: AllTimeRow[]; maxLevel: number }>("/api/palmares/all-time"),
    });
    const { data: cups } = useQuery({
        queryKey: ["tournaments"],
        queryFn: () => api<{ ranking: CupCount[] }>("/api/palmares/tournaments"),
    });
    const { data: tl } = useQuery({
        queryKey: ["timeline", managerId],
        queryFn: () => api<{ seasons: TimelineSeason[] }>(`/api/palmares/timeline/${managerId}`),
    });

    const row = data?.ranking.find((r) => r.managerId === managerId);
    const isMe = managerId === me?.id;
    const cup = cups?.ranking.find((c) => c.managerId === managerId);
    const ldc = cup?.ldc ?? 0;
    const trophies = (row?.totalTitles ?? 0) + (cup?.total ?? 0);

    const name = row?.manager ?? (isMe ? me?.displayName : null) ?? "—";
    const username = row?.username ?? (isMe ? me?.username : null);

    const seasons = tl?.seasons ?? [];
    const current = seasons.at(-1);
    const memberSince = seasons[0]?.year ?? null;
    const played = seasons.reduce((s, x) => s + (x.played ?? 0), 0);
    const won = seasons.reduce((s, x) => s + (x.won ?? 0), 0);
    const winPct = played ? Math.round((won / played) * 100) : 0;
    const divLevel = current?.level ?? 0;
    const divLabel = divLevel ? `D${divLevel}` : "—";
    const rating = clamp(60 + trophies * 4 + Math.round(winPct / 5), 55, 99);

    return (
        <div
            className="relative overflow-hidden rounded-[22px] border p-5 shadow-[0_18px_46px_rgba(109,40,217,.4)] lg:rounded-3xl lg:p-8"
            style={{
                background: "linear-gradient(150deg,#2D1B69,#6D28D9 78%)",
                borderColor: "rgba(167,139,250,.35)",
            }}
        >
            <div
                className="pointer-events-none absolute -right-24 -top-28 size-[260px] rounded-full lg:size-[420px]"
                style={{
                    background: "radial-gradient(circle, rgba(255,45,120,.5), transparent 70%)",
                    animation: "lhmHalo 10s ease-in-out infinite",
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{ background: "repeating-linear-gradient(118deg,#fff 0 2px, transparent 2px 24px)" }}
            />

            <div className="relative flex items-center gap-4 lg:gap-7">
                {/* Colonne note */}
                <div className="flex shrink-0 flex-col items-center rounded-2xl border border-white/15 bg-nuit/[0.34] px-3 py-[11px] lg:px-5 lg:py-[18px]">
                    <div className="font-display text-[38px] font-black leading-[0.8] text-jaune lg:text-[64px]">
                        {rating}
                    </div>
                    <div className="mt-1 font-display text-[10px] font-black tracking-[1.5px] text-white lg:mt-1.5 lg:text-[13px] lg:tracking-[2px]">
                        MNG
                    </div>
                    <div className="my-[7px] h-px w-6 bg-white/25 lg:my-[11px] lg:w-11" />
                    <div className="font-display text-sm font-black leading-none text-jaune lg:text-[22px]">
                        {divLabel}
                    </div>
                    {ldc > 0 && <div className="mt-1 text-[13px] lg:mt-1.5 lg:text-lg">⭐</div>}
                </div>

                {/* Avatar + identité */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 lg:gap-[13px]">
                        <div className="relative size-16 shrink-0 lg:size-[108px]">
                            <div
                                className="absolute -inset-[3px] rounded-full lg:-inset-1"
                                style={{ background: "linear-gradient(135deg,#FFD23F,#FF2D78,#6D28D9)" }}
                            />
                            <div
                                className="absolute inset-0 grid place-items-center rounded-full border-[3px] border-[#2D1B69] font-display text-2xl font-black text-white lg:border-[5px] lg:text-[40px]"
                                style={{ background: "linear-gradient(135deg,#6D28D9,#FF2D78,#FF6B35)" }}
                            >
                                {initials(name)}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-[9px] font-bold uppercase tracking-[2px] text-[#C9B8F5] lg:text-[11px] lg:tracking-[2.5px]">
                                Fiche manager · LHM
                            </div>
                            <h1 className="mt-1 font-display text-[26px] font-black uppercase leading-[0.92] tracking-[-0.8px] text-white [overflow-wrap:anywhere] lg:text-[44px] lg:tracking-[-1.5px]">
                                {name}
                            </h1>
                            {username && <p className="truncate text-xs text-[#C9B8F5] lg:text-sm">{username}</p>}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5 lg:mt-3.5 lg:gap-2">
                        {divLevel > 0 && (
                            <span
                                className="rounded-full px-2.5 py-1 font-display text-[9px] font-black tracking-[0.5px] lg:px-[15px] lg:py-[7px] lg:text-[11px]"
                                style={{ background: "linear-gradient(135deg,#FFD23F,#FF6B35)", color: "#3D2E00" }}
                            >
                                DIVISION {divLevel}
                                {divLevel === 1 ? " · ÉLITE" : ""}
                            </span>
                        )}
                        {ldc > 0 && (
                            <span className="rounded-full border border-menthe/50 bg-menthe/[0.16] px-2.5 py-1 font-display text-[9px] font-black text-menthe lg:px-[15px] lg:py-[7px] lg:text-[11px]">
                                {ldc}× LIGUE DES CRAMPONS
                            </span>
                        )}
                        {isMe && (
                            <span className="rounded-full border border-white/20 bg-nuit/40 px-2.5 py-1 font-display text-[9px] font-black text-white lg:px-[15px] lg:py-[7px] lg:text-[11px]">
                                TOI
                            </span>
                        )}
                        {memberSince && (
                            <span className="rounded-full border border-white/20 bg-nuit/40 px-2.5 py-1 font-display text-[9px] font-bold text-[#C9B8F5] lg:px-[15px] lg:py-[7px] lg:text-[11px]">
                                Membre depuis {memberSince}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats clés (desktop) */}
                <div className="hidden shrink-0 gap-2.5 lg:flex">
                    <HeadlineStat value={row ? `${row.rank}e` : "—"} label="Rang all-time" color="text-white" />
                    <HeadlineStat value={trophies} label="Trophées" color="text-jaune" />
                    <HeadlineStat value={`${winPct}%`} label="Réussite" color="text-menthe" />
                </div>
            </div>

            {/* Bandeau bas */}
            <div className="relative mt-3.5 flex items-center gap-2 border-t border-white/15 pt-3.5">
                <div
                    className="h-[4px] flex-1 rounded-[3px]"
                    style={{ background: "linear-gradient(90deg,#6D28D9,#FF2D78,#FF6B35,#FFD23F)" }}
                />
                <div className="text-[11px] text-[#C9B8F5]">
                    {divLevel ? `Division ${divLevel}${divLevel === 1 ? " · Élite" : ""}` : "Nouveau membre"}
                    {row ? ` · ${row.seasonsPlayed} saison${row.seasonsPlayed > 1 ? "s" : ""}` : ""}
                </div>
            </div>
        </div>
    );
}

function HeadlineStat({ value, label, color }: { value: string | number; label: string; color: string }) {
    return (
        <div className="w-16 rounded-2xl border border-white/10 bg-nuit/[0.34] px-2.5 py-4 text-center">
            <div className={`font-display text-[26px] font-black leading-none ${color}`}>{value}</div>
            <div className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.5px] text-[#C9B8F5]">{label}</div>
        </div>
    );
}
