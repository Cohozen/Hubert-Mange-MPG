import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TimelineSeason } from "@/components/business/profile/types";

function useIsMobile() {
    const query = "(max-width: 639px)";
    const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return isMobile;
}

// "2024-2025" → "24-25"
const shortYear = (realSeason: string) =>
    realSeason
        .split("-")
        .map((y) => y.slice(2))
        .join("-");

type Point = TimelineSeason & { label: string };

function CareerTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
    if (!active || !payload?.length) return null;
    const s = payload[0].payload;
    return (
        <div className="bg-base-100 rounded-box shadow-lg border border-base-300 p-3 text-xs space-y-0.5">
            <div className="font-semibold">
                {s.realSeason} — {s.gameSeason}
            </div>
            <div>
                {s.division}
                {s.finalRank != null && <span className="opacity-60"> · {s.finalRank}ᵉ</span>}
                {s.finalRank === 1 && " 🥇"}
            </div>
            <div className="opacity-70">
                {s.points ?? 0} pts · <span className="text-success">{s.won ?? 0}V</span> {s.drawn ?? 0}N{" "}
                <span className="text-error">{s.lost ?? 0}D</span>
            </div>
            <div className="opacity-70">
                Buts {s.goalsFor ?? 0}:{s.goalsAgainst ?? 0}
            </div>
        </div>
    );
}

export function CareerChart({ seasons }: { seasons: TimelineSeason[] }) {
    const data: Point[] = seasons.map((s) => ({ ...s, label: `${shortYear(s.realSeason)}·S${s.mpgSeason ?? "?"}` }));
    const maxLevel = Math.max(1, ...seasons.map((s) => s.level));
    const yTicks = Array.from({ length: maxLevel }, (_, i) => i + 1);

    // Mobile : on espace les libellés X (~6 max) pour rester lisible ; desktop : tous.
    const isMobile = useIsMobile();
    const xInterval = isMobile ? Math.max(0, Math.ceil(data.length / 6) - 1) : 0;

    return (
        <div className="bg-base-100 rounded-box shadow p-4 h-72 [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 16, bottom: 28, left: -8 }} accessibilityLayer={false}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" />
                    <XAxis
                        dataKey="label"
                        angle={-35}
                        textAnchor="end"
                        height={50}
                        interval={xInterval}
                        tick={{ fontSize: 10, fill: "var(--color-base-content)" }}
                    />
                    <YAxis
                        reversed
                        domain={[1, maxLevel]}
                        ticks={yTicks}
                        allowDecimals={false}
                        tickFormatter={(v) => `D${v}`}
                        tick={{ fontSize: 11, fill: "var(--color-base-content)" }}
                    />
                    <Tooltip content={<CareerTooltip />} />
                    <Line
                        type="linear"
                        dataKey="level"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        isAnimationActive={false}
                        dot={(props: any) => {
                            const { cx, cy, index, payload } = props;
                            if (payload.finalRank === 1) {
                                return (
                                    <text key={index} x={cx} y={cy} dy={5} textAnchor="middle" fontSize={15}>
                                        🥇
                                    </text>
                                );
                            }
                            return <circle key={index} cx={cx} cy={cy} r={4} fill="var(--color-primary)" />;
                        }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
