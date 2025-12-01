import { randomBytes, createCipheriv, createDecipheriv, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

async function getEncryptionKey(): Promise<Buffer> {
  const secret = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || "default-encryption-key-change-in-production";
  const salt = "binance-api-keys-salt";
  return (await scryptAsync(secret, salt, KEY_LENGTH)) as Buffer;
}

export async function encrypt(text: string): Promise<string> {
  if (!text) return "";
  
  const key = await getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export async function decrypt(encryptedText: string): Promise<string> {
  if (!encryptedText) return "";
  
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      return encryptedText;
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const key = await getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedText;
  }
}

export async function encryptApiKeys(apiKey: string, apiSecret: string): Promise<{ encryptedKey: string; encryptedSecret: string }> {
  const [encryptedKey, encryptedSecret] = await Promise.all([
    encrypt(apiKey),
    encrypt(apiSecret)
  ]);
  return { encryptedKey, encryptedSecret };
}

export async function decryptApiKeys(encryptedKey: string | null, encryptedSecret: string | null): Promise<{ apiKey: string; apiSecret: string }> {
  const [apiKey, apiSecret] = await Promise.all([
    decrypt(encryptedKey || ""),
    decrypt(encryptedSecret || "")
  ]);
  return { apiKey, apiSecret };
}
