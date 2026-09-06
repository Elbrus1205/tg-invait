import { createHmac, randomBytes } from "node:crypto";
import argon2 from "argon2";

import type { RoleName } from "@prisma/client";

import type { ApiStore, StoredUser } from "./store.js";

export interface ApiSecurityConfig { readonly accessTokenSecret: string; readonly refreshTokenSecret: string; readonly encryptionKey: Buffer; readonly accessTokenTtlSeconds: number; readonly refreshTokenTtlSeconds: number; readonly passwordResetTtlSeconds: number; }
export interface PasswordResetMessage { readonly email: string; readonly token: string; }
export interface PasswordResetNotifier { readonly send: (message: PasswordResetMessage) => void | Promise<void>; }

export function decodeEncryptionKey(value: string): Buffer {
  const raw = Buffer.from(value, "utf8");
  if (raw.length === 32) return raw;
  const decoded = Buffer.from(value, "base64");
  if (decoded.length === 32) return decoded;
  throw new Error("TELEGRAM_SESSION_ENCRYPTION_KEY must resolve to exactly 32 bytes");
}

function digest(value: string, secret: string): string { return createHmac("sha256", secret).update(value).digest("base64url"); }
export async function hashPassword(password: string): Promise<string> { return argon2.hash(password, { type: argon2.argon2id }); }
export async function verifyPassword(password: string, encoded: string): Promise<boolean> { try { return await argon2.verify(encoded, password); } catch { return false; } }
function token(secret: string, subject: string, ttl: number): string { const payload = Buffer.from(JSON.stringify({ sub: subject, exp: Math.floor(Date.now() / 1000) + ttl, nonce: randomBytes(8).toString("base64url") })).toString("base64url"); return `${payload}.${digest(payload, secret)}`; }
function subject(value: string, secret: string): string | undefined { const [payload, signature] = value.split("."); if (!payload || !signature || digest(payload, secret) !== signature) return undefined; try { const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: unknown; exp?: unknown }; return typeof parsed.sub === "string" && typeof parsed.exp === "number" && parsed.exp > Date.now() / 1000 ? parsed.sub : undefined; } catch { return undefined; } }

export class ApiSecurity {
  private readonly invalidatedUsers = new Set<string>();
  public constructor(private readonly store: ApiStore, private readonly config: ApiSecurityConfig) {}
  public issueAccessToken(userId: string): string { return token(this.config.accessTokenSecret, userId, this.config.accessTokenTtlSeconds); }
  public issueRefreshToken(userId: string): string { return token(this.config.refreshTokenSecret, userId, this.config.refreshTokenTtlSeconds); }
  public issueResetToken(): string { return randomBytes(32).toString("base64url"); }
  public hashToken(value: string): string { return digest(value, this.config.refreshTokenSecret); }
  public async authenticateAccess(value: string | undefined): Promise<StoredUser | undefined> { const id = value === undefined ? undefined : subject(value, this.config.accessTokenSecret); return id === undefined || this.invalidatedUsers.has(id) ? undefined : this.store.findUserById(id); }
  public invalidateUser(userId: string): void { this.invalidatedUsers.add(userId); }
  public clearInvalidation(userId: string): void { this.invalidatedUsers.delete(userId); }
  public async rotateRefresh(value: string): Promise<{ readonly user: StoredUser; readonly accessToken: string; readonly refreshToken: string } | undefined> { const id = subject(value, this.config.refreshTokenSecret); if (!id) return undefined; const session = await this.store.findSession(this.hashToken(value)); if (!session || session.userId !== id || session.revokedAt || session.expiresAt <= new Date()) return undefined; await this.store.revokeSession(session.id); const user = await this.store.findUserById(id); if (!user) return undefined; const refreshToken = this.issueRefreshToken(id); await this.store.createSession(id, this.hashToken(refreshToken), new Date(Date.now() + this.config.refreshTokenTtlSeconds * 1000)); return { user, accessToken: this.issueAccessToken(id), refreshToken }; }
  public get resetTtlSeconds(): number { return this.config.passwordResetTtlSeconds; }
  public get encryptionKey(): Buffer { return this.config.encryptionKey; }
}

export function can(role: RoleName, permission: "read" | "manage"): boolean { if (role === "OWNER" || role === "ADMIN") return true; return permission === "read" || role === "OPERATOR"; }
