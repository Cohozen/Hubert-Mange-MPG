export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-2xl border border-bord bg-carte p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-texte-2">{label}</div>
            <div className="mt-1 whitespace-nowrap font-display text-lg font-black text-white">{value}</div>
            {sub && <div className="whitespace-nowrap text-xs text-texte-2">{sub}</div>}
        </div>
    );
}
