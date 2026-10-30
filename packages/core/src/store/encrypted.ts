import type { MaskEntry, MaskStore, PiiCategory, TokenFormatOptions } from "../types.js";
import { hashForAudit } from "../audit/hash.js";
import { deriveSessionShort, formatMaskToken } from "../token.js";
import { openUtf8, sealUtf8 } from "./crypto.js";
import { purgeExpiredSessions, type SessionExpiryTracker } from "./ttl.js";

interface SealedRecord {
  token: string;
  category: PiiCategory;
  sealedOriginal: string;
  hashedOriginal?: string;
}

interface EncryptedSessionState extends SessionExpiryTracker {
  sessionShort: string;
  seq: number;
  byToken: Map<string, SealedRecord>;
}

export const DEFAULT_STORE_TTL_MS = 30 * 60 * 1000;

export interface EncryptedMaskStoreOptions {
  /** AES-256 鍵（32 バイト） */
  encryptionKey: Uint8Array;
  /** セッション TTL（默认 30 分） */
  ttlMs?: number;
  /** 監査用に原文の SHA-256 を MaskEntry に付与 */
  hashOriginalsForAudit?: boolean;
  tokenFormat?: TokenFormatOptions;
}

export class EncryptedMaskStore implements MaskStore {
  private readonly sessions = new Map<string, EncryptedSessionState>();
  private readonly key: Uint8Array;
  private readonly ttlMs: number;
  private readonly hashOriginalsForAudit: boolean;
  private tokenFormat: TokenFormatOptions;

  constructor(options: EncryptedMaskStoreOptions) {
    this.key = options.encryptionKey;
    this.ttlMs = options.ttlMs ?? DEFAULT_STORE_TTL_MS;
    this.hashOriginalsForAudit = options.hashOriginalsForAudit ?? false;
    this.tokenFormat = options.tokenFormat ?? { style: "compact" };
  }

  setTokenFormat(format: TokenFormatOptions): void {
    this.tokenFormat = { ...format };
  }

  getSessionShort(sessionId: string): string {
    return this.ensureSession(sessionId).sessionShort;
  }

  register(
    sessionId: string,
    original: string,
    category: PiiCategory,
  ): MaskEntry {
    this.purge();
    const session = this.ensureSession(sessionId);
    session.expiresAt = Date.now() + this.ttlMs;
    session.seq += 1;
    const token = formatMaskToken(
      session.sessionShort,
      category,
      session.seq,
      this.tokenFormat,
    );
    const sealedOriginal = sealUtf8(original, this.key);
    const record: SealedRecord = {
      token,
      category,
      sealedOriginal,
      hashedOriginal: this.hashOriginalsForAudit
        ? hashForAudit(original)
        : undefined,
    };
    session.byToken.set(token, record);
    return {
      token,
      original,
      category,
      hashedOriginal: record.hashedOriginal,
    };
  }

  lookup(sessionId: string, token: string): MaskEntry | undefined {
    this.purge();
    const session = this.sessions.get(sessionId);
    if (!session || this.isExpired(session)) {
      if (session) this.sessions.delete(sessionId);
      return undefined;
    }
    session.expiresAt = Date.now() + this.ttlMs;
    const record = session.byToken.get(token);
    if (!record) return undefined;
    const original = openUtf8(record.sealedOriginal, this.key);
    return {
      token: record.token,
      original,
      category: record.category,
      hashedOriginal: record.hashedOriginal,
    };
  }

  clear(sessionId?: string): void {
    if (sessionId === undefined) {
      this.sessions.clear();
      return;
    }
    this.sessions.delete(sessionId);
  }

  private ensureSession(sessionId: string): EncryptedSessionState {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionShort: deriveSessionShort(sessionId),
        seq: 0,
        byToken: new Map(),
        expiresAt: Date.now() + this.ttlMs,
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  private isExpired(session: SessionExpiryTracker): boolean {
    return Date.now() > session.expiresAt;
  }

  private purge(): void {
    purgeExpiredSessions(this.sessions);
  }
}

export function createEncryptedMaskStore(
  options: EncryptedMaskStoreOptions,
): EncryptedMaskStore {
  return new EncryptedMaskStore(options);
}
