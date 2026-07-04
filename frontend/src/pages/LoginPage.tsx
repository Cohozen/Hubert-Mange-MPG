import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/Logo";

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="mb-1.5 block font-display text-[11px] font-extrabold uppercase tracking-[1.5px] text-texte-2">
            {children}
        </span>
    );
}

/* Champ commun ; fond nuit dans la carte mobile, carte sur le panneau desktop. */
const fieldClass =
    "h-[50px] lg:h-[52px] rounded-[13px] border-[1.5px] border-bord px-4 text-[15px] text-white " +
    "dark:bg-nuit lg:dark:bg-carte placeholder:text-[#5a6196]";

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
            {/* ===== Panneau immersif (desktop only) ===== */}
            <div
                className="relative hidden w-[54%] flex-col justify-between overflow-hidden px-14 py-[52px] lg:flex"
                style={{ background: "linear-gradient(135deg,#2d1b69 0%,#6d28d9 48%,#ff2d78 100%)" }}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-10"
                    style={{ background: "repeating-linear-gradient(115deg, #fff 0 2px, transparent 2px 64px)" }}
                />
                <div
                    className="pointer-events-none absolute -right-32 -top-40 size-[480px] rounded-full blur-[10px]"
                    style={{
                        background: "radial-gradient(circle, rgba(255,107,53,.6), transparent 70%)",
                        animation: "lhmHalo 10s ease-in-out infinite",
                    }}
                />
                <div
                    className="pointer-events-none absolute -bottom-44 -left-32 size-[460px] rounded-full blur-[10px]"
                    style={{
                        background: "radial-gradient(circle, rgba(0,229,160,.28), transparent 70%)",
                        animation: "lhmHalo 14s ease-in-out infinite reverse",
                    }}
                />

                {/* Lockup logo */}
                <div className="relative z-10 flex items-center gap-3.5">
                    <Logo size={58} className="drop-shadow-[0_6px_16px_rgba(0,0,0,.35)]" />
                    <div className="h-[34px] w-0.5 rounded bg-white/45" />
                    <div>
                        <div className="font-display text-[15px] font-black tracking-wide text-white">
                            LIGUE HUBERT MANGE
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">
                            Saison 2025/2026
                        </div>
                    </div>
                </div>

                {/* Accroche */}
                <div className="relative z-10">
                    <h1 className="font-display text-[68px] font-black uppercase leading-[0.92] tracking-[-2.5px] text-white drop-shadow-[0_6px_30px_rgba(0,0,0,.25)]">
                        Prêt pour
                        <br />
                        la saison&nbsp;?
                    </h1>
                    <p className="mt-5 max-w-[440px] text-[17px] leading-[1.55] text-white/90">
                        Palmarès, classements, cagnotte et profils de toute la ligue. Le show commence dès que tu te
                        connectes.
                    </p>
                </div>

                {/* Ticker stats */}
                <div className="relative z-10 flex gap-[38px]">
                    {[
                        { v: "36", l: "Équipes" },
                        { v: "3", l: "Editions" },
                        { v: "6", l: "Divisions" },
                    ].map((s) => (
                        <div key={s.l}>
                            <div className="font-display text-[34px] font-black leading-none text-white">{s.v}</div>
                            <div className="mt-1 text-[10px] font-bold uppercase tracking-[1.5px] text-white/70">
                                {s.l}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== Panneau formulaire (desktop) / écran complet (mobile) ===== */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-7 py-12 lg:px-12">
                <div className="absolute inset-x-0 top-0 h-[5px] grad-banner lg:h-1" />

                {/* Halos diffus mobile */}
                <div
                    className="pointer-events-none absolute -left-32 -top-44 size-[460px] rounded-full blur-[20px] lg:hidden"
                    style={{
                        background: "radial-gradient(circle, rgba(109,40,217,.55), transparent 70%)",
                        animation: "lhmHalo 9s ease-in-out infinite",
                    }}
                />
                <div
                    className="pointer-events-none absolute -right-40 top-16 size-[420px] rounded-full blur-[20px] lg:hidden"
                    style={{
                        background: "radial-gradient(circle, rgba(255,45,120,.5), transparent 70%)",
                        animation: "lhmHalo 11s ease-in-out infinite reverse",
                    }}
                />
                <div
                    className="pointer-events-none absolute -bottom-36 left-8 size-[420px] rounded-full blur-[20px] lg:hidden"
                    style={{
                        background: "radial-gradient(circle, rgba(255,107,53,.4), transparent 70%)",
                        animation: "lhmHalo 13s ease-in-out infinite",
                    }}
                />
                {/* Halo violet desktop */}
                <div
                    className="pointer-events-none absolute -right-32 -top-32 hidden size-[340px] rounded-full blur-[20px] lg:block"
                    style={{ background: "radial-gradient(circle, rgba(109,40,217,.3), transparent 70%)" }}
                />

                <div className="relative z-10 w-full max-w-[380px]">
                    {/* Héros mobile : shield + nom + accroche */}
                    <div className="mb-[30px] flex flex-col items-center text-center lg:hidden">
                        <Logo
                            variant="full"
                            size={190}
                            className="mb-[30px] drop-shadow-[0_14px_34px_rgba(255,45,120,.4)]"
                        />
                        <h1 className="font-display text-[38px] font-black uppercase leading-[0.96] tracking-[-1.5px] text-white">
                            Prêt pour
                            <br />
                            la saison&nbsp;?
                        </h1>
                        <p className="mt-3 max-w-[280px] text-[14px] leading-[1.5] text-texte-2">
                            Connecte-toi avec ton compte{" "}
                            <span className="font-semibold text-white">Mon Petit Gazon</span>
                        </p>
                    </div>

                    {/* Carte / formulaire */}
                    <form
                        onSubmit={onSubmit}
                        className="relative overflow-hidden rounded-[22px] border border-bord bg-carte p-[22px] pt-6 shadow-[0_18px_44px_rgba(0,0,0,.4)] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
                    >
                        <div className="absolute inset-x-0 top-0 h-[5px] grad-energy lg:hidden" />

                        {/* En-tête desktop */}
                        <div className="hidden lg:block">
                            <h2 className="font-display text-[28px] font-black uppercase tracking-[-1px] text-white">
                                Connexion
                            </h2>
                            <p className="mt-2 text-sm text-texte-2">
                                Avec ton compte <span className="font-semibold text-white">Mon Petit Gazon</span>
                            </p>
                        </div>

                        <div className="lg:mt-[26px]">
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

                        <div className="mt-4 lg:mt-[18px]">
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
                            <div className="mt-4 flex items-center gap-2 rounded-[11px] border border-rouge/40 bg-rouge/10 px-3.5 py-2.5">
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
                            className="mt-[18px] h-[54px] w-full rounded-[14px] text-[15px] tracking-[1px] shadow-[0_12px_28px_rgba(255,45,120,.4)] lg:mt-[22px] lg:h-14 lg:text-base"
                        >
                            {loading ? "Connexion…" : "SE CONNECTER"}
                        </Button>

                        <div className="mt-4 flex items-center justify-center gap-2 lg:mt-[18px]">
                            <span className="grid size-[14px] shrink-0 place-items-center rounded-[4px] border-[1.5px] border-menthe">
                                <span className="size-[5px] rounded-full bg-menthe" />
                            </span>
                            <span className="text-[12px] text-texte-2">Tes identifiants ne sont jamais stockés.</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
