import { useAuth } from "@/auth/useAuth";

/** Dashboard « Accueil » — placeholder (sera construit en phase 2). */
export default function AccueilPage() {
    const { data: me } = useAuth();
    const first = me?.displayName?.split(" ")[0] ?? "";
    return (
        <div className="space-y-4">
            <div className="lhm-card relative overflow-hidden rounded-2xl p-6 grad-primary">
                <div
                    className="absolute -right-16 -top-20 size-56 rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(255,45,120,.4), transparent 70%)",
                        animation: "lhmHalo 10s ease-in-out infinite",
                    }}
                />
                <div className="relative">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-violet-clair">Accueil</div>
                    <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-white">
                        Salut {first} 👋
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-[#c4b5fd]">
                        Ton plateau d'avant-match arrive bientôt : rang en cours, mercato, cagnotte et palmarès.
                    </p>
                </div>
            </div>
        </div>
    );
}
