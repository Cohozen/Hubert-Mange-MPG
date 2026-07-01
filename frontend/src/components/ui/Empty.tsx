export function Empty({ children = "Pas encore de données." }: { children?: React.ReactNode }) {
    return <div className="rounded-2xl border border-bord bg-carte p-6 text-sm text-texte-2">{children}</div>;
}
