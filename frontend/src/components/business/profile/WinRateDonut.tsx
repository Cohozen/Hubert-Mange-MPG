import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function WinRateDonut({ w, d, l }: { w: number; d: number; l: number }) {
    const total = w + d + l;
    const winPct = total ? Math.round((w / total) * 100) : 0;
    const data = [
        { name: "Victoires", value: w, color: "var(--color-success)" },
        { name: "Nuls", value: d, color: "var(--color-base-300)" },
        { name: "Défaites", value: l, color: "var(--color-error)" },
    ];

    return (
        <div className="bg-base-100 rounded-box shadow p-4">
            <div className="relative h-48 [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="65%"
                            outerRadius="90%"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                            isAnimationActive={false}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-success">{winPct}%</span>
                    <span className="text-xs opacity-60">victoires</span>
                </div>
            </div>
        </div>
    );
}
