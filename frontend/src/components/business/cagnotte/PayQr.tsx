import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export function PayQr({ managerId }: { managerId: string }) {
  const payment = useQuery({
    queryKey: ["payment", managerId],
    queryFn: () =>
      api<{
        iban: string | null;
        phone: string | null;
        weroUrl: string | null;
        ibanHolder: string | null;
      }>(`/api/profile/${managerId}/payment`),
  });
  const p = payment.data;
  const wero = useQuery({
    queryKey: ["wero-qr", managerId],
    queryFn: () => api<{ dataUrl: string }>(`/api/profile/${managerId}/wero-qr`),
    enabled: !!p?.weroUrl,
  });

  if (payment.isLoading) return <p className="text-sm opacity-60">Chargement…</p>;
  if (!p?.iban && !p?.weroUrl && !p?.phone) {
    return (
      <p className="text-sm opacity-60">
        Aucune coordonnée de paiement — le membre doit compléter son profil.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {wero.data && (
        <div className="text-center">
          <img src={wero.data.dataUrl} alt="QR Wero" className="w-36 h-36 rounded" />
          <div className="text-xs font-bold mt-1">WERO — scanne pour payer</div>
        </div>
      )}
      <div className="text-sm opacity-80 space-y-1 min-w-0">
        {p.ibanHolder && <p>Titulaire : {p.ibanHolder}</p>}
        {p.iban && (
          <p>
            IBAN : <span className="font-mono text-xs break-all">{p.iban}</span>
          </p>
        )}
        {p.phone && <p>Wero (tél) : {p.phone}</p>}
      </div>
    </div>
  );
}
