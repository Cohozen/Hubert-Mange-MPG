import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function WinRateDonut({ w, d, l }: { w: number; d: number; l: number }) {
    const total = w + d + l;
    const winPct = total ? Math.round((w / total) * 100) : 0;
    const data = [
        { name: "Victoires", value: w, color: "var(--color-menthe)" },
        { name: "Nuls", value: d, color: "var(--color-bord)" },
        { name: "Défaites", value: l, color: "var(--color-rouge)" },
    ];

    return (
        <div className="rounded-2xl border border-bord bg-carte p-4">
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
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-black text-menthe">{winPct}%</span>
                    <span className="text-xs text-texte-2">victoires</span>
                </div>
            </div>
        </div>
    );
}
