import { describe, expect, it, vi } from "vitest";
import { createEncryptedMaskStore } from "../src/store/encrypted.js";

const KEY = new Uint8Array(32).fill(7);

describe("EncryptedMaskStore", () => {
  it("register / lookup で原文を復元", () => {
    const store = createEncryptedMaskStore({ encryptionKey: KEY });
    const sid = "session-a";
    const { token } = store.register(sid, "秘密の名前", "name");
    const entry = store.lookup(sid, token);
    expect(entry?.original).toBe("秘密の名前");
  });

  it("TTL 経過後 lookup は undefined", () => {
    vi.useFakeTimers();
    const store = createEncryptedMaskStore({
      encryptionKey: KEY,
      ttlMs: 1000,
    });
    const sid = "session-b";
    const { token } = store.register(sid, "x", "custom");
    vi.advanceTimersByTime(1001);
    expect(store.lookup(sid, token)).toBeUndefined();
    vi.useRealTimers();
  });
});
