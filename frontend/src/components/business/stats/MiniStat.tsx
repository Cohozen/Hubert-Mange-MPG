import { cn } from "@/lib/utils";

export function MiniStat({ label, value, accent }: { label: string; value: number; accent?: string }) {
    return (
        <div className="rounded-2xl border border-bord bg-carte p-3 text-center">
            <div className={cn("font-display text-lg font-black", accent ?? "text-white")}>{value}</div>
            <div className="text-[11px] text-texte-2">{label}</div>
        </div>
    );
}
