import { Router } from "express";
import QRCode from "qrcode";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { requireAuth, requireCagnotteEditor } from "../../http/middleware.js";
import { decrypt, encrypt, isEncryptionConfigured } from "../../lib/crypto.js";

/**
 * Profil & coordonnées de paiement.
 * - Le membre voit/édite seulement les siennes (IBAN masqué en lecture).
 * - Le banquier/superadmin peut consulter l'IBAN déchiffré et générer le QR SEPA pour payer.
 */
export const profileRouter = Router();

function maskIban(iban: string): string {
  const clean = iban.replace(/\s+/g, "");
  return clean.length <= 4 ? clean : `${"•".repeat(clean.length - 4)}${clean.slice(-4)}`;
}

function safeDecrypt(enc: string | null): string | null {
  if (!enc) return null;
  try {
    return decrypt(enc);
  } catch {
    return null;
  }
}

// ---- Membre : son propre profil ----
profileRouter.get("/me", requireAuth, async (req, res) => {
  const m = await prisma.manager.findUnique({ where: { id: req.auth!.managerId } });
  if (!m) {
    res.status(404).json({ error: "Manager introuvable" });
    return;
  }
  const iban = safeDecrypt(m.ibanEncrypted);
  res.json({
    id: m.id,
    displayName: m.displayName,
    phone: m.phone,
    weroUrl: m.weroUrl,
    ibanHolder: m.ibanHolder,
    ibanMasked: iban ? maskIban(iban) : null,
    hasIban: Boolean(m.ibanEncrypted),
  });
});

const profileSchema = z.object({
  phone: z.string().trim().max(30).optional().nullable(),
  weroUrl: z.string().trim().max(300).optional().nullable(),
  iban: z.string().trim().max(40).optional().nullable(),
  ibanHolder: z.string().trim().max(70).optional().nullable(),
});

profileRouter.put("/me", requireAuth, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données de profil invalides" });
    return;
  }
  const { phone, weroUrl, iban, ibanHolder } = parsed.data;

  const data: Record<string, unknown> = {};
  if (phone !== undefined) data.phone = phone || null;
  if (ibanHolder !== undefined) data.ibanHolder = ibanHolder || null;
  if (weroUrl !== undefined) {
    if (weroUrl && !/^https:\/\/\S+$/.test(weroUrl)) {
      res.status(400).json({ error: "Lien Wero invalide (doit commencer par https://)" });
      return;
    }
    data.weroUrl = weroUrl || null;
  }

  if (iban !== undefined) {
    if (!iban) {
      data.ibanEncrypted = null;
    } else {
      const clean = iban.replace(/\s+/g, "").toUpperCase();
      if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(clean)) {
        res.status(400).json({ error: "IBAN invalide" });
        return;
      }
      if (!isEncryptionConfigured()) {
        res.status(503).json({ error: "Chiffrement non configuré (ENCRYPTION_KEY)" });
        return;
      }
      data.ibanEncrypted = encrypt(clean);
    }
  }

  await prisma.manager.update({ where: { id: req.auth!.managerId }, data });
  res.json({ ok: true });
});

// ---- Banquier / superadmin : coordonnées d'un membre + QR ----
profileRouter.get("/:managerId/payment", requireCagnotteEditor, async (req, res) => {
  const m = await prisma.manager.findUnique({ where: { id: req.params.managerId } });
  if (!m) {
    res.status(404).json({ error: "Manager introuvable" });
    return;
  }
  res.json({
    id: m.id,
    displayName: m.displayName,
    phone: m.phone,
    weroUrl: m.weroUrl,
    ibanHolder: m.ibanHolder,
    iban: safeDecrypt(m.ibanEncrypted),
  });
});

// QR Wero : généré à partir du lien de partage perso du membre.
profileRouter.get("/:managerId/wero-qr", requireCagnotteEditor, async (req, res) => {
  const m = await prisma.manager.findUnique({ where: { id: req.params.managerId } });
  if (!m?.weroUrl) {
    res.status(404).json({ error: "Lien Wero indisponible pour ce membre" });
    return;
  }
  const dataUrl = await QRCode.toDataURL(m.weroUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    color: { light: "#FFE94D", dark: "#0a0a0a" }, // jaune Wero
  });
  res.json({ dataUrl, url: m.weroUrl });
});
