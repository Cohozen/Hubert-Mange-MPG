export function MiniStat({ label, value, accent }: { label: string; value: number; accent?: string }) {
    return (
        <div className="bg-base-100 rounded-box shadow p-3 text-center">
            <div className={`text-lg font-bold ${accent ?? "text-base-content"}`}>{value}</div>
            <div className="text-[11px] opacity-60">{label}</div>
        </div>
    );
}
