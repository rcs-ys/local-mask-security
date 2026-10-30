import { describe, expect, it } from "vitest";
import { createInMemoryMaskStore } from "../src/store/in-memory.js";

describe("InMemoryMaskStore", () => {
  it("同一 session で seq が増える", () => {
    const store = createInMemoryMaskStore();
    const sid = "session-1";
    const a = store.register(sid, "a@b.co", "email");
    const b = store.register(sid, "09012345678", "phone");
    expect(a.token).not.toBe(b.token);
    expect(store.entryCount(sid)).toBe(2);
    expect(store.lookup(sid, a.token)?.original).toBe("a@b.co");
  });

  it("clear(sessionId) でエントリ削除", () => {
    const store = createInMemoryMaskStore();
    const sid = "s";
    const { token } = store.register(sid, "x", "custom");
    store.clear(sid);
    expect(store.lookup(sid, token)).toBeUndefined();
  });
});
