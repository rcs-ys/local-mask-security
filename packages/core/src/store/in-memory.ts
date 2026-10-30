import type { MaskEntry, MaskStore, PiiCategory, TokenFormatOptions } from "../types.js";
import { deriveSessionShort, formatMaskToken } from "../token.js";

interface SessionState {
  sessionShort: string;
  seq: number;
  byToken: Map<string, MaskEntry>;
}

export interface CreateInMemoryMaskStoreOptions {
  tokenFormat?: TokenFormatOptions;
}

export class InMemoryMaskStore implements MaskStore {
  private readonly sessions = new Map<string, SessionState>();
  private tokenFormat: TokenFormatOptions;

  constructor(options: CreateInMemoryMaskStoreOptions = {}) {
    this.tokenFormat = options.tokenFormat ?? { style: "compact" };
  }

  /** createMaskEngine の tokenFormat と揃える（MaskProvider 経由の store 用） */
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
    const session = this.ensureSession(sessionId);
    session.seq += 1;
    const token = formatMaskToken(
      session.sessionShort,
      category,
      session.seq,
      this.tokenFormat,
    );
    const entry: MaskEntry = { token, original, category };
    session.byToken.set(token, entry);
    return entry;
  }

  lookup(sessionId: string, token: string): MaskEntry | undefined {
    return this.sessions.get(sessionId)?.byToken.get(token);
  }

  clear(sessionId?: string): void {
    if (sessionId === undefined) {
      this.sessions.clear();
      return;
    }
    this.sessions.delete(sessionId);
  }

  /** テスト・デバッグ用 */
  entryCount(sessionId: string): number {
    return this.sessions.get(sessionId)?.byToken.size ?? 0;
  }

  private ensureSession(sessionId: string): SessionState {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionShort: deriveSessionShort(sessionId),
        seq: 0,
        byToken: new Map(),
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }
}

export function createInMemoryMaskStore(
  options?: CreateInMemoryMaskStoreOptions,
): InMemoryMaskStore {
  return new InMemoryMaskStore(options);
}
