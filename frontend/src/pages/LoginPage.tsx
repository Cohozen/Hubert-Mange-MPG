import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/Logo";

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="mb-1.5 block font-display text-[11px] font-extrabold uppercase tracking-wider text-texte-2">
            {children}
        </span>
    );
}

const fieldClass = "h-12 rounded-xl border-bord bg-carte px-4 text-[15px] text-white placeholder:text-[#5a6196]";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const qc = useQueryClient();
    const navigate = useNavigate();

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
            await qc.invalidateQueries({ queryKey: ["me"] });
            navigate("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-nuit">
            {/* Panneau immersif (desktop) */}
            <div
                className="relative hidden w-[54%] flex-col justify-between overflow-hidden p-14 lg:flex"
                style={{ background: "linear-gradient(135deg,#2d1b69 0%,#6d28d9 48%,#ff2d78 100%)" }}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-10"
                    style={{ background: "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 64px)" }}
                />
                <div
                    className="pointer-events-none absolute -right-28 -top-40 size-[480px] rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(255,107,53,.55), transparent 70%)",
                        animation: "lhmHalo 10s ease-in-out infinite",
                    }}
                />
                <div className="relative z-10 flex items-center gap-3.5">
                    <Logo size={56} />
                    <div className="h-8 w-0.5 rounded bg-white/45" />
                    <div>
                        <div className="font-display text-[15px] font-black tracking-wide text-white">
                            LIGUE HUBERT MANGE
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">
                            Saison 2025/2026
                        </div>
                    </div>
                </div>
                <div className="relative z-10">
                    <h1 className="font-display text-6xl font-black uppercase leading-[0.92] tracking-tight text-white">
                        Prêt pour
                        <br />
                        la saison ?
                    </h1>
                    <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/90">
                        Palmarès, classements, cagnotte et profils de toute la ligue. Le show commence dès que tu te
                        connectes.
                    </p>
                </div>
                <div className="relative z-10 flex gap-10">
                    {[
                        { v: "36", l: "Équipes" },
                        { v: "3", l: "Editions" },
                        { v: "6", l: "Divisions" },
                    ].map((s) => (
                        <div key={s.l}>
                            <div className="font-display text-3xl font-black leading-none text-white">{s.v}</div>
                            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                                {s.l}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panneau formulaire */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
                <div className="absolute inset-x-0 top-0 h-1 grad-banner" />
                <div
                    className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full lg:hidden"
                    style={{ background: "radial-gradient(circle, rgba(255,45,120,.4), transparent 70%)" }}
                />
                <form onSubmit={onSubmit} className="relative z-10 w-full max-w-sm">
                    <Logo size={92} variant="full" className="mx-auto mb-6 lg:hidden" />
                    <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white">Connexion</h2>
                    <p className="mt-2 text-sm text-texte-2">
                        Avec ton compte <span className="font-semibold text-white">Mon Petit Gazon</span>
                    </p>

                    <div className="mt-6">
                        <FieldLabel>Email MPG</FieldLabel>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ton@email.com"
                            className={fieldClass}
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <FieldLabel>Mot de passe MPG</FieldLabel>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={fieldClass}
                            required
                        />
                    </div>

                    {error && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rouge/40 bg-rouge/10 px-3.5 py-2.5">
                            <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-rouge text-xs font-extrabold text-white">
                                !
                            </span>
                            <span className="text-[13px] font-medium text-[#ff8da1]">{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="energy"
                        disabled={loading}
                        className="mt-5 h-14 w-full text-base shadow-[0_14px_32px_rgba(255,45,120,.4)]"
                    >
                        {loading ? "Connexion…" : "SE CONNECTER"}
                    </Button>

                    <p className="mt-4 text-center text-xs text-texte-2">
                        Tes identifiants servent uniquement à vérifier ton compte MPG. Ils ne sont jamais stockés.
                    </p>
                </form>
            </div>
        </div>
    );
}
