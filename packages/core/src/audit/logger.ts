import type { AuditEvent, DetectedSpan, SpanSource } from "../types.js";

export interface SafeAuditLoggerOptions {
  /** 默认 console.info（本番は Datadog 等へ差し替え） */
  sink?: (event: AuditEvent) => void;
  /** sessionId を短縮してログ（默认 true） */
  redactSessionId?: boolean;
}

const FORBIDDEN_KEYS = ["original", "plaintext", "password", "rawText"] as const;

export function createSafeAuditLogger(
  options: SafeAuditLoggerOptions = {},
): (event: AuditEvent) => void {
  const sink = options.sink ?? defaultSink;
  const redactSessionId = options.redactSessionId !== false;

  return (event: AuditEvent) => {
    const safe = sanitizeAuditEvent(event, redactSessionId);
    sink(safe);
  };
}

function defaultSink(event: AuditEvent): void {
  if (typeof console !== "undefined" && console.info) {
    console.info("[local-mask-security audit]", event);
  }
}

export function sanitizeAuditEvent(
  event: AuditEvent,
  redactSessionId: boolean,
): AuditEvent {
  const clone: AuditEvent = {
    ...event,
    sessionId: redactSessionId
      ? `${event.sessionId.slice(0, 8)}…`
      : event.sessionId,
  };

  assertNoForbiddenPayload(clone);
  return clone;
}

function assertNoForbiddenPayload(value: unknown, path = "event"): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      assertNoForbiddenPayload(value[i], `${path}[${i}]`);
    }
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.includes(key as (typeof FORBIDDEN_KEYS)[number])) {
      throw new Error(`Audit event must not include "${key}" at ${path}.${key}`);
    }
    assertNoForbiddenPayload(child, `${path}.${key}`);
  }
}

export function countSpansBySource(
  spans: DetectedSpan[],
): Partial<Record<SpanSource, number>> {
  const out: Partial<Record<SpanSource, number>> = {};
  for (const span of spans) {
    out[span.source] = (out[span.source] ?? 0) + 1;
  }
  return out;
}

export function createMaskAuditEvent(
  sessionId: string,
  stats: AuditEvent["stats"],
  bySource: Partial<Record<SpanSource, number>>,
): AuditEvent {
  return {
    type: "mask",
    sessionId,
    timestamp: new Date().toISOString(),
    stats,
    bySource,
  };
}

export function createUnmaskAuditEvent(
  sessionId: string,
  missingTokenCount: number,
): AuditEvent {
  return {
    type: "unmask",
    sessionId,
    timestamp: new Date().toISOString(),
    missingTokenCount,
  };
}
