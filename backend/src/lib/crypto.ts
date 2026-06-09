import crypto from "node:crypto";
import { config } from "../config.js";

/**
 * Chiffrement symétrique des IBAN au repos (AES-256-GCM).
 * Format stocké : base64( iv(12) | authTag(16) | ciphertext ).
 * La clé vient de ENCRYPTION_KEY (base64 de 32 octets, ou toute chaîne dérivée par SHA-256).
 */

function getKey(): Buffer {
    if (!config.encryptionKey) {
        throw new Error("ENCRYPTION_KEY manquante (.env) : impossible de (dé)chiffrer les IBAN.");
    }
    // Si c'est 32 octets en base64, on l'utilise tel quel ; sinon on dérive via SHA-256.
    try {
        const raw = Buffer.from(config.encryptionKey, "base64");
        if (raw.length === 32) return raw;
    } catch {
        /* ignore */
    }
    return crypto.createHash("sha256").update(config.encryptionKey).digest();
}

export function encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
    const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decrypt(enc: string): string {
    const buf = Buffer.from(enc, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export function isEncryptionConfigured(): boolean {
    return Boolean(config.encryptionKey);
}
