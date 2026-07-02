import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { SETTINGS_BARS, SettingsCard } from "@/components/business/settings/SettingsCard";
import { Button } from "@/components/ui/button";

interface Profile {
    displayName: string;
    phone: string | null;
    weroUrl: string | null;
    ibanHolder: string | null;
    ibanMasked: string | null;
    hasIban: boolean;
}

const inputClass =
    "w-full rounded-xl border border-bord bg-nuit px-[15px] py-[13px] text-[15px] font-semibold text-white outline-none transition placeholder:text-[#5A6293] focus:border-rose";

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
    return (
        <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-[10px] font-extrabold uppercase tracking-[1.5px] text-texte-2">
                {children}
            </span>
            {optional && (
                <span className="rounded-full border border-bord bg-nuit px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.5px] text-[#5A6293]">
                    Optionnel
                </span>
            )}
        </div>
    );
}

function initials(name?: string | null) {
    if (!name) return "—";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

export function ProfileForm() {
    const qc = useQueryClient();
    const { data: me } = useAuth();
    const { data } = useQuery<Profile>({
        queryKey: ["profile"],
        queryFn: () => api<Profile>("/api/profile/me"),
    });

    const [phone, setPhone] = useState("");
    const [weroUrl, setWeroUrl] = useState("");
    const [ibanHolder, setIbanHolder] = useState("");
    const [iban, setIban] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data) {
            setPhone(data.phone ?? "");
            setWeroUrl(data.weroUrl ?? "");
            setIbanHolder(data.ibanHolder ?? "");
        }
    }, [data]);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setMsg(null);
        setErr(null);
        setSaving(true);
        try {
            await api("/api/profile/me", {
                method: "PUT",
                body: JSON.stringify({ phone, weroUrl, ibanHolder, ...(iban.trim() ? { iban } : {}) }),
            });
            setIban("");
            setMsg("Profil enregistré.");
            qc.invalidateQueries({ queryKey: ["profile"] });
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function removeIban() {
        setSaving(true);
        try {
            await api("/api/profile/me", { method: "PUT", body: JSON.stringify({ iban: "" }) });
            qc.invalidateQueries({ queryKey: ["profile"] });
        } finally {
            setSaving(false);
        }
    }

    const name = data?.displayName ?? me?.displayName ?? "—";

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5 lg:gap-[22px]">
            <SettingsCard bar={SETTINGS_BARS.profil} title="Mon profil">
                {/* Avatar */}
                <div className="mb-[18px] flex items-center gap-4">
                    <div className="relative size-[68px] shrink-0 lg:size-[84px]">
                        <div
                            className="absolute -inset-[2px] rounded-full lg:-inset-[3px]"
                            style={{ background: "linear-gradient(135deg,#FFD23F,#FF2D78,#6D28D9)" }}
                        />
                        <div
                            className="absolute inset-0 grid place-items-center rounded-full border-[3px] border-carte font-display text-[25px] font-black text-white lg:border-4 lg:text-[31px]"
                            style={{ background: "linear-gradient(135deg,#6D28D9,#FF2D78,#FF6B35)" }}
                        >
                            {initials(name)}
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-bord bg-nuit px-3.5 py-2.5 font-display text-[11px] font-black uppercase tracking-[0.5px] text-texte-2 opacity-70">
                            Changer la photo
                            <span className="rounded-full bg-violet-clair/15 px-1.5 py-px text-[8px] text-violet-clair">
                                bientôt
                            </span>
                        </span>
                        <div className="mt-2 text-[11px] text-texte-2">Ton identité s'affiche via tes initiales.</div>
                    </div>
                </div>

                {/* Nom (lecture seule : géré côté MPG) */}
                <div className="mb-4">
                    <Label>Nom d'affichage</Label>
                    <div className={`${inputClass} flex items-center justify-between`}>
                        <span>{name}</span>
                        {me?.username && <span className="text-xs font-medium text-texte-2">{me.username}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-texte-2">
                        <span>ℹ️</span>Nom synchronisé depuis ton compte Mon Petit Gazon.
                    </div>
                </div>

                {/* Téléphone */}
                <div>
                    <Label optional>Téléphone (Wero)</Label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="06 12 34 56 78"
                        className={inputClass}
                    />
                    <div className="mt-2 text-[11px] text-texte-2">Pour les rappels de mise et Wero.</div>
                </div>
            </SettingsCard>

            <SettingsCard bar={SETTINGS_BARS.paiement} title="Paiement">
                <p className="mb-4 text-[13px] leading-relaxed text-texte-2">
                    Ces coordonnées servent au trésorier pour te verser tes gains. Visibles seulement par toi et lui.
                </p>

                <div className="mb-4">
                    <Label>Titulaire du compte</Label>
                    <input
                        value={ibanHolder}
                        onChange={(e) => setIbanHolder(e.target.value)}
                        placeholder="Prénom Nom"
                        className={inputClass}
                    />
                </div>

                <div className="mb-4">
                    <Label optional>Lien Wero</Label>
                    <input
                        value={weroUrl}
                        onChange={(e) => setWeroUrl(e.target.value)}
                        placeholder="https://share.weropay.eu/p/..."
                        className={inputClass}
                    />
                    <div className="mt-2 text-[11px] text-texte-2">
                        Wero : « Mon QR code » → Partager → copie le lien ici.
                    </div>
                </div>

                {/* IBAN */}
                <div className="rounded-[15px] border border-bord bg-nuit p-[15px]">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="font-display text-[10px] font-extrabold uppercase tracking-[1.5px] text-texte-2">
                            IBAN
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-menthe/40 bg-menthe/[0.12] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.5px] text-menthe">
                            🔒 Chiffré
                        </span>
                    </div>
                    {data?.hasIban && (
                        <div className="mb-2 flex items-center justify-between">
                            <span className="font-display text-lg font-black tracking-[3px] text-white">
                                {data.ibanMasked}
                            </span>
                            <button
                                type="button"
                                onClick={removeIban}
                                className="text-xs font-semibold text-rouge hover:underline"
                            >
                                Supprimer
                            </button>
                        </div>
                    )}
                    <input
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        placeholder={data?.hasIban ? "Laisser vide pour conserver l'IBAN actuel" : "FR76 ..."}
                        className={`${inputClass} font-mono`}
                    />
                    <div className="mt-2 text-[11px] text-texte-2">Jamais affiché en clair, stocké chiffré.</div>
                </div>

                {msg && <p className="mt-3 text-sm text-menthe">{msg}</p>}
                {err && <p className="mt-3 text-sm text-rouge">{err}</p>}
                <Button
                    type="submit"
                    disabled={saving}
                    variant="energy"
                    className="mt-4 h-auto rounded-[13px] px-8 py-3.5 tracking-[1.5px]"
                >
                    {saving ? "Enregistrement…" : "ENREGISTRER"}
                </Button>
            </SettingsCard>
        </form>
    );
}
