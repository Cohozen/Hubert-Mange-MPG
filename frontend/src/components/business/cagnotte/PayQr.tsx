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

    if (payment.isLoading) return <p className="text-sm text-texte-2">Chargement…</p>;
    if (!p?.iban && !p?.weroUrl && !p?.phone) {
        return (
            <p className="text-sm text-texte-2">Aucune coordonnée de paiement — le membre doit compléter son profil.</p>
        );
    }

    return (
        <div className="flex flex-wrap items-start gap-6">
            {wero.data && (
                <div className="text-center">
                    <img src={wero.data.dataUrl} alt="QR Wero" className="size-36 rounded-xl bg-white p-1" />
                    <div className="mt-1 font-display text-xs font-black text-menthe">WERO — scanne pour payer</div>
                </div>
            )}
            <div className="min-w-0 space-y-1 text-sm text-texte-2">
                {p.ibanHolder && <p>Titulaire : {p.ibanHolder}</p>}
                {p.iban && (
                    <p>
                        IBAN : <span className="break-all font-mono text-xs text-white">{p.iban}</span>
                    </p>
                )}
                {p.phone && <p>Wero (tél) : {p.phone}</p>}
            </div>
        </div>
    );
}
