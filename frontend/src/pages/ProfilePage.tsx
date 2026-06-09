import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Field } from "@/components/ui/Field";

interface Profile {
  displayName: string;
  phone: string | null;
  weroUrl: string | null;
  ibanHolder: string | null;
  ibanMasked: string | null;
  hasIban: boolean;
}

export default function ProfilePage() {
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
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-base-content mb-1">Mon profil</h2>
      <p className="text-sm opacity-60 mb-4">
        Ces coordonnées servent au banquier pour te verser tes gains. Elles ne sont visibles
        que par toi et le banquier. Ton IBAN est chiffré.
      </p>

      <form onSubmit={onSubmit} className="bg-base-100 rounded-box shadow p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Téléphone (Wero)">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="input input-bordered w-full"
            />
          </Field>

          <Field label="Titulaire du compte (pour le virement)">
            <input
              value={ibanHolder}
              onChange={(e) => setIbanHolder(e.target.value)}
              placeholder="Prénom Nom"
              className="input input-bordered w-full"
            />
          </Field>
        </div>

        <Field label="Lien Wero (Mon QR code → Partager)">
          <input
            value={weroUrl}
            onChange={(e) => setWeroUrl(e.target.value)}
            placeholder="https://share.weropay.eu/p/..."
            className="input input-bordered w-full"
          />
          <span className="text-xs opacity-50">
            Dans l'appli Wero : « Mon QR code » → Partager → copie le lien et colle-le ici.
          </span>
        </Field>

        <Field label="IBAN">
          {data?.hasIban && (
            <p className="text-sm opacity-60 mb-1">
              Actuel : <span className="font-mono">{data.ibanMasked}</span>{" "}
              <button
                type="button"
                onClick={removeIban}
                className="text-error hover:underline ml-2"
              >
                supprimer
              </button>
            </p>
          )}
          <input
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder={data?.hasIban ? "Laisser vide pour conserver l'IBAN actuel" : "FR76 ..."}
            className="input input-bordered w-full font-mono"
          />
        </Field>

        {msg && <p className="text-sm text-success">{msg}</p>}
        {err && <p className="text-sm text-error">{err}</p>}
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving && <span className="loading loading-spinner loading-sm" />}
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
