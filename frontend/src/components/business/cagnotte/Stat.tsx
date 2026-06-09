export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="bg-base-100 rounded-box shadow p-4">
            <div className="text-xs opacity-60">{label}</div>
            <div className="text-lg font-bold text-base-content whitespace-nowrap">{value}</div>
            {sub && <div className="text-xs opacity-50 whitespace-nowrap">{sub}</div>}
        </div>
    );
}
