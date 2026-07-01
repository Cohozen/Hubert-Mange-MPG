import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";

interface Profile {
    displayName: string;
    phone: string | null;
    weroUrl: string | null;
    ibanHolder: string | null;
    ibanMasked: string | null;
    hasIban: boolean;
}

export function ProfileForm() {
    const qc = useQueryClient();
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
                body: JSON.stringify({
                    phone,
                    weroUrl,
                    ibanHolder,
                    ...(iban.trim() ? { iban } : {}),
                }),
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

    return (
        <div>
            <h2 className="mb-1 font-display text-xl font-black uppercase tracking-tight text-white">Mon profil</h2>
            <p className="mb-4 text-sm text-texte-2">
                Ces coordonnées servent au banquier pour te verser tes gains. Elles ne sont visibles que par toi et le
                banquier.
            </p>

            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-bord bg-carte p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Téléphone (Wero)">
                        <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+33 6 12 34 56 78"
                            className="bg-nuit"
                        />
                    </Field>

                    <Field label="Titulaire du compte (pour le virement)">
                        <Input
                            value={ibanHolder}
                            onChange={(e) => setIbanHolder(e.target.value)}
                            placeholder="Prénom Nom"
                            className="bg-nuit"
                        />
                    </Field>
                </div>

                <Field label="Lien Wero (Mon QR code → Partager)">
                    <Input
                        value={weroUrl}
                        onChange={(e) => setWeroUrl(e.target.value)}
                        placeholder="https://share.weropay.eu/p/..."
                        className="bg-nuit"
                    />
                    <span className="mt-1 block text-xs text-texte-2">
                        Dans l'appli Wero : « Mon QR code » → Partager → copie le lien et colle-le ici.
                    </span>
                </Field>

                <Field label="IBAN">
                    {data?.hasIban && (
                        <p className="mb-1 text-sm text-texte-2">
                            Actuel : <span className="font-mono text-white">{data.ibanMasked}</span>{" "}
                            <button type="button" onClick={removeIban} className="ml-2 text-rouge hover:underline">
                                supprimer
                            </button>
                        </p>
                    )}
                    <Input
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        placeholder={data?.hasIban ? "Laisser vide pour conserver l'IBAN actuel" : "FR76 ..."}
                        className="bg-nuit font-mono"
                    />
                    <span className="mt-1 block text-xs text-texte-2">🔒 Ton IBAN est chiffré.</span>
                </Field>

                {msg && <p className="text-sm text-menthe">{msg}</p>}
                {err && <p className="text-sm text-rouge">{err}</p>}
                <Button type="submit" disabled={saving} variant="energy">
                    {saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
            </form>
        </div>
    );
}
