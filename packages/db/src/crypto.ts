import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getMasterKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

// Call at boot so a missing or malformed key fails at startup, not on first use.
export function assertEncryptionKey(): void {
  getMasterKey();
}

// `aad` binds the ciphertext to its owner (the project id): a payload copied to
// another row fails to decrypt.
export function encryptSecret(plaintext: string, aad: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getMasterKey(), iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(aad));

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptSecret(payload: string, aad: string): string {
  const [version, ivB64, tagB64, ciphertextB64, ...extra] = payload.split(".");
  if (version !== VERSION || !ivB64 || !tagB64 || !ciphertextB64 || extra.length > 0) {
    throw new Error("Unsupported or malformed encrypted secret");
  }

  const decipher = createDecipheriv(ALGORITHM, getMasterKey(), Buffer.from(ivB64, "base64"), {
    authTagLength: TAG_BYTES,
  });
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
