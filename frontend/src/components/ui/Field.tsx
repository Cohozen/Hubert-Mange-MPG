export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-base-content">{label}</span>
            <div className="mt-1">{children}</div>
        </label>
    );
}
