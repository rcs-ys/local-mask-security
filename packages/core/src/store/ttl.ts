export interface SessionExpiryTracker {
  expiresAt: number;
}

export function purgeExpiredSessions<T extends SessionExpiryTracker>(
  sessions: Map<string, T>,
  now = Date.now(),
): void {
  for (const [sessionId, session] of sessions) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}

export function withSessionTtl(store: import("../types.js").MaskStore, ttlMs: number): import("../types.js").MaskStore {
  const expiry = new Map<string, number>();

  const touch = (sessionId: string) => {
    expiry.set(sessionId, Date.now() + ttlMs);
  };

  const purge = () => {
    const now = Date.now();
    for (const [sessionId, expiresAt] of expiry) {
      if (now > expiresAt) {
        expiry.delete(sessionId);
        store.clear(sessionId);
      }
    }
  };

  return {
    getSessionShort(sessionId) {
      purge();
      touch(sessionId);
      return store.getSessionShort(sessionId);
    },
    register(sessionId, original, category) {
      purge();
      touch(sessionId);
      return store.register(sessionId, original, category);
    },
    lookup(sessionId, token) {
      purge();
      const exp = expiry.get(sessionId);
      if (exp !== undefined && Date.now() > exp) {
        expiry.delete(sessionId);
        store.clear(sessionId);
        return undefined;
      }
      touch(sessionId);
      return store.lookup(sessionId, token);
    },
    clear(sessionId) {
      if (sessionId === undefined) {
        expiry.clear();
      } else {
        expiry.delete(sessionId);
      }
      store.clear(sessionId);
    },
  };
}
