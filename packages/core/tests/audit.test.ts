import { describe, expect, it, vi } from "vitest";
import {
  createSafeAuditLogger,
  sanitizeAuditEvent,
} from "../src/audit/logger.js";
import { createMaskEngine } from "../src/engine.js";

describe("audit", () => {
  it("createSafeAuditLogger は sessionId を短縮", () => {
    const sink = vi.fn();
    const log = createSafeAuditLogger({ sink, redactSessionId: true });
    log({
      type: "mask",
      sessionId: "12345678-abcd-efgh",
      stats: { total: 1, byCategory: { email: 1 } },
    });
    expect(sink.mock.calls[0][0].sessionId).toBe("12345678…");
  });

  it("mask で bySource が onAudit に渡る", async () => {
    const onAudit = vi.fn();
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: "audit-session",
      onAudit,
      stages: { regex: true, dictionary: false, nlp: false },
    });
    await engine.mask("a@b.co");
    expect(onAudit.mock.calls[0][0].bySource?.regex).toBe(1);
    expect(onAudit.mock.calls[0][0].timestamp).toBeDefined();
  });

  it("sanitizeAuditEvent は original フィールドを拒否", () => {
    const bad = {
      type: "mask" as const,
      sessionId: "s",
      stats: { total: 0, byCategory: {} },
      original: "leak",
    };
    expect(() => sanitizeAuditEvent(bad as never, false)).toThrow(
      /must not include "original"/,
    );
  });
});
