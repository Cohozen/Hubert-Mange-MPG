import QRCode from "qrcode";

/**
 * Génère un QR code SEPA (norme EPC069-12 / "GiroCode") pour un virement SEPA.
 * Beaucoup d'apps bancaires européennes le scannent pour pré-remplir un virement.
 *
 * Le bénéficiaire est le gagnant (nom + IBAN). Montant et motif optionnels.
 */
export interface SepaQrInput {
  holderName: string; // titulaire du compte bénéficiaire
  iban: string;
  amountCents?: number; // montant en centimes
  remittance?: string; // motif (ex. "Gain D1 2025-2026")
}

export function buildEpcPayload({ holderName, iban, amountCents, remittance }: SepaQrInput): string {
  const cleanIban = iban.replace(/\s+/g, "").toUpperCase();
  const amountLine =
    amountCents && amountCents > 0 ? `EUR${(amountCents / 100).toFixed(2)}` : "";
  // 12 lignes du format EPC. BCD / version 002 / charset UTF-8 (1) / SCT.
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    "", // BIC (optionnel en zone SEPA)
    holderName.slice(0, 70),
    cleanIban,
    amountLine,
    "", // purpose
    "", // structured remittance
    (remittance ?? "").slice(0, 140), // unstructured remittance
    "",
  ].join("\n");
}

export async function buildSepaQr(input: SepaQrInput): Promise<{ payload: string; dataUrl: string }> {
  const payload = buildEpcPayload(input);
  const dataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1 });
  return { payload, dataUrl };
}
