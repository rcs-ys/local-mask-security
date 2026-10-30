import type { DetectedSpan, PiiCategory } from "../types.js";
import {
  JA_ADDRESS_MUNICIPAL,
  JA_ADDRESS_WITH_PREFECTURE,
} from "@local-mask-security/patterns-ja/address";
import type { NlpDetector, NlpOptions } from "./types.js";

export interface StubNlpDetectorOptions {
  id?: string;
  /** 追加の PER 風パターン（正規表現 source, flags） */
  namePatterns?: Array<{ source: string; flags?: string; confidence?: number }>;
}

function pushMatches(
  text: string,
  re: RegExp,
  category: PiiCategory,
  confidence: number,
  spans: DetectedSpan[],
  occupied: DetectedSpan[],
) {
  for (const match of text.matchAll(re)) {
    const matched = match[0];
    if (!matched || match.index === undefined) continue;
    const start = match.index;
    const end = start + matched.length;
    const overlaps = occupied.some((s) => start < s.end && s.start < end);
    if (overlaps) continue;
    const span: DetectedSpan = {
      start,
      end,
      category,
      confidence,
      source: "nlp",
      meta: { detector: "stub" },
    };
    spans.push(span);
    occupied.push(span);
  }
}

/**
 * 開発・テスト・ブラウザ向けの軽量 NLP（ヒューリスティック）。
 */
export function createStubNlpDetector(
  stubOptions: StubNlpDetectorOptions = {},
): NlpDetector {
  const id = stubOptions.id ?? "nlp-stub";

  return {
    id,

    async detect(text: string, options: NlpOptions): Promise<DetectedSpan[]> {
      if (options.locale !== "ja") {
        return [];
      }

      const cats = new Set<PiiCategory>(
        options.categories ?? ["name", "address", "password", "custom"],
      );

      const spans: DetectedSpan[] = [];
      const occupied: DetectedSpan[] = [];

      if (cats.has("name")) {
        const nameRe =
          /[\p{Script=Han}]{1,4}(?:さん|くん|君|様|氏)(?![\p{Script=Han}])/gu;
        pushMatches(text, nameRe, "name", 0.72, spans, occupied);

        for (const p of stubOptions.namePatterns ?? []) {
          const flags = p.flags?.includes("u") ? p.flags : `${p.flags ?? ""}u`;
          const globalFlags = flags.includes("g") ? flags : `${flags}g`;
          pushMatches(
            text,
            new RegExp(p.source, globalFlags),
            "name",
            p.confidence ?? 0.7,
            spans,
            occupied,
          );
        }
      }

      if (cats.has("address")) {
        pushMatches(
          text,
          new RegExp(JA_ADDRESS_WITH_PREFECTURE.source, "gu"),
          "address",
          0.7,
          spans,
          occupied,
        );
        pushMatches(
          text,
          new RegExp(JA_ADDRESS_MUNICIPAL.source, "gu"),
          "address",
          0.68,
          spans,
          occupied,
        );
      }

      if (cats.has("password")) {
        const pwRe =
          /(?:パスワード|PW|password)[:：\s]{0,3}(\S{4,64})/giu;
        for (const match of text.matchAll(pwRe)) {
          if (match.index === undefined || !match[1]) continue;
          const value = match[1];
          const start = match.index + match[0].indexOf(value);
          const end = start + value.length;
          const overlaps = occupied.some((s) => start < s.end && s.start < end);
          if (overlaps) continue;
          if (0.88 < options.minConfidence) continue;
          const span: DetectedSpan = {
            start,
            end,
            category: "password",
            confidence: 0.88,
            source: "nlp",
            meta: { detector: "stub", context: "password-label" },
          };
          spans.push(span);
          occupied.push(span);
        }
      }

      return spans.filter((s) => s.confidence >= options.minConfidence);
    },
  };
}
