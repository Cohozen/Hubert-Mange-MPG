export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="font-display text-[11px] font-extrabold uppercase tracking-wider text-texte-2">
                {label}
            </span>
            <div className="mt-1.5">{children}</div>
        </label>
    );
}
