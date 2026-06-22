// Local AES-256-GCM envelope for letter bodies. Same interface a KMS-backed
// version will expose later (see deferred Law #7) — only the key source changes.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALG = "aes-256-gcm";
const TAG_BYTES = 16;
const IV_BYTES = 12;

export interface SealedLetter {
  ciphertext: Buffer; // GCM ciphertext WITH the 16-byte auth tag appended
  iv: Buffer;
  alg: string;
  keyId: string;
}

/** Parse a 32-byte key from a 64-char hex string (env LETTER_ENC_KEY). */
export function keyFromHex(hex: string): Buffer {
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) throw new Error("LETTER_ENC_KEY must be 32 bytes (64 hex chars)");
  return key;
}

export function encryptLetter(plaintext: string, key: Buffer, keyId = "local-v1"): SealedLetter {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: Buffer.concat([enc, tag]), iv, alg: ALG, keyId };
}

export function decryptLetter(sealed: SealedLetter, key: Buffer): string {
  const data = sealed.ciphertext;
  const enc = data.subarray(0, data.length - TAG_BYTES);
  const tag = data.subarray(data.length - TAG_BYTES);
  const decipher = createDecipheriv(ALG, key, sealed.iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
