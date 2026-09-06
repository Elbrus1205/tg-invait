/** Redacts a value before it can be included in diagnostics. */
export function redactSecret(value: string | undefined): string | undefined {
  if (typeof value === "undefined") {
    return undefined;
  }
  if (value.length <= 4) {
    return "[redacted]";
  }
  return `${value.slice(0, 2)}…${value.slice(-2)}`;
}

/** Accept either a raw 32-byte secret or a Base64 encoding of 32 random bytes. */
export function decodeEncryptionKey(value: string): Buffer {
  const raw = Buffer.from(value, "utf8");
  if (raw.length === 32) return raw;
  const decoded = Buffer.from(value, "base64");
  if (decoded.length === 32) return decoded;
  throw new Error("TELEGRAM_SESSION_ENCRYPTION_KEY must resolve to exactly 32 bytes");
}
