import { jaPatternBundle } from "@local-mask-security/patterns-ja";
import {
  createDictionaryRegistry,
  type DictionaryRegistry,
} from "./dictionary/registry.js";
import { maskJsonValue } from "./json/mask-json.js";
import { normalizeNlpDetectors } from "./nlp/composite.js";
import { createStubNlpDetector } from "./nlp/stub-detector.js";
import {
  DEFAULT_NLP_OPTIONS,
  type NlpDetector,
  type NlpOptions,
} from "./nlp/types.js";
import {
  applyMaskReplacements,
  detectRegexSpans,
  mergeSpans,
} from "./pipeline/mask-pipeline.js";
import { detectNlpSpans } from "./pipeline/nlp-stage.js";
import { jaDefaultRuleBundle } from "./presets/ja-rules.js";
import {
  createRuleRegistry,
  type RuleRegistry,
} from "./rules/registry.js";
import { createInMemoryMaskStore, InMemoryMaskStore } from "./store/in-memory.js";
import { EncryptedMaskStore } from "./store/encrypted.js";
import { defaultTokenFormat } from "./token.js";
import {
  countSpansBySource,
  createMaskAuditEvent,
  createUnmaskAuditEvent,
} from "./audit/logger.js";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_MERGE_POLICY,
  DEFAULT_STAGES,
  type AuditEvent,
  type CreateMaskEngineOptions,
  type DetectedSpan,
  type MaskEngine,
  type MaskJsonOptions,
  type MaskResult,
  type MaskStats,
  type MaskStore,
  type MissingTokenPolicy,
  type PiiCategory,
  type PatternBundle,
  type TokenFormatOptions,
  type UnmaskOptions,
  type UnmaskResult,
} from "./types.js";
import { MASK_TOKEN_PATTERN, resetMaskTokenPattern } from "./token.js";

function createSessionId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  throw new Error("crypto.randomUUID is not available in this environment");
}

function resolveEnabledCategories(
  categories?: Partial<Record<PiiCategory, boolean>>,
): Set<PiiCategory> {
  const merged = { ...DEFAULT_CATEGORIES, ...categories };
  const set = new Set<PiiCategory>();
  for (const [key, enabled] of Object.entries(merged)) {
    if (enabled) set.add(key as PiiCategory);
  }
  return set;
}

function resolvePatterns(
  locale: CreateMaskEngineOptions["locale"],
  patterns?: PatternBundle,
): PatternBundle {
  if (patterns) return patterns;
  if (locale === "ja") return jaPatternBundle;
  return { patterns: {} };
}

function resolveDictionary(
  options: CreateMaskEngineOptions,
): DictionaryRegistry {
  if (options.dictionary) return options.dictionary;
  return createDictionaryRegistry();
}

function resolveRules(options: CreateMaskEngineOptions): RuleRegistry {
  if (options.rules) return options.rules;
  const registry = createRuleRegistry();
  const loadDefaults =
    options.loadDefaultJaRules !== false && options.locale === "ja";
  if (loadDefaults) {
    registry.importBundle(jaDefaultRuleBundle, "merge");
  }
  return registry;
}

function resolveNlpDetectors(options: CreateMaskEngineOptions): NlpDetector[] {
  const explicit = normalizeNlpDetectors(options.nlp);
  if (explicit.length > 0) return explicit;

  if (!options.stages?.nlp) return [];

  const useStub = options.useDefaultStubNlp !== false;
  if (useStub && options.locale === "ja") {
    return [createStubNlpDetector()];
  }
  return [];
}

function resolveNlpOptions(
  options: CreateMaskEngineOptions,
): NlpOptions {
  return {
    ...DEFAULT_NLP_OPTIONS,
    locale: options.locale,
    ...options.nlpOptions,
  };
}

function syncStoreTokenFormat(
  store: MaskStore,
  tokenFormat: TokenFormatOptions,
): void {
  if (
    store instanceof InMemoryMaskStore ||
    store instanceof EncryptedMaskStore
  ) {
    store.setTokenFormat(tokenFormat);
  }
}

function unmaskText(
  text: string,
  sessionId: string,
  store: MaskStore,
  policy: MissingTokenPolicy,
  placeholder: string,
): UnmaskResult {
  const missingTokens: string[] = [];
  resetMaskTokenPattern();

  const unmaskedText = text.replace(MASK_TOKEN_PATTERN, (token) => {
    const entry = store.lookup(sessionId, token);
    if (entry) return entry.original;
    missingTokens.push(token);
    if (policy === "throw") {
      throw new Error(`Unknown mask token: ${token}`);
    }
    if (policy === "placeholder") return placeholder;
    return token;
  });

  return { unmaskedText, missingTokens };
}

export function createMaskEngine(options: CreateMaskEngineOptions): MaskEngine {
  const sessionId = options.sessionId ?? createSessionId();
  const tokenFormat = defaultTokenFormat(options.locale, options.tokenFormat);
  const store =
    options.store ?? createInMemoryMaskStore({ tokenFormat });
  syncStoreTokenFormat(store, tokenFormat);
  const stages = { ...DEFAULT_STAGES, ...options.stages };
  const mergePolicy = options.mergePolicy ?? DEFAULT_MERGE_POLICY;
  const enabledCategories = resolveEnabledCategories(options.categories);
  const patternBundle = resolvePatterns(options.locale, options.patterns);
  const dictionary = resolveDictionary(options);
  const rules = resolveRules(options);
  const nlpDetectors = resolveNlpDetectors({ ...options, stages });
  const nlpOptions = resolveNlpOptions(options);
  const defaultUnmask: UnmaskOptions = {
    missingTokenPolicy: "preserve",
    placeholder: "[[UNKNOWN]]",
    ...options.unmask,
  };

  const emit = (event: AuditEvent) => options.onAudit?.(event);

  const collectSpans = async (text: string): Promise<DetectedSpan[]> => {
    const spans: DetectedSpan[] = [];
    if (stages.regex) {
      spans.push(...detectRegexSpans(text, patternBundle, enabledCategories));
    }
    if (stages.dictionary) {
      spans.push(...dictionary.detect(text, enabledCategories));
      spans.push(...rules.detect(text, enabledCategories));
    }
    if (stages.nlp && nlpDetectors.length > 0) {
      spans.push(
        ...(await detectNlpSpans(
          text,
          nlpDetectors,
          nlpOptions,
          enabledCategories,
        )),
      );
    }
    return spans;
  };

  const runMask = async (text: string): Promise<MaskResult> => {
    const rawSpans = await collectSpans(text);
    const merged = mergeSpans(rawSpans, mergePolicy);
    const { maskedText, stats } = applyMaskReplacements(
      text,
      merged,
      (original, category) => {
        const entry = store.register(sessionId, original, category);
        return entry.token;
      },
    );
    emit(
      createMaskAuditEvent(sessionId, stats, countSpansBySource(rawSpans)),
    );
    return { maskedText, sessionId, stats };
  };

  const engine: MaskEngine = {
    sessionId,
    dictionary,
    rules,

    async mask(text: string): Promise<MaskResult> {
      return runMask(text);
    },

    async maskJson<T>(
      value: T,
      jsonOptions?: MaskJsonOptions,
    ): Promise<{ value: T; sessionId: string; stats: MaskStats }> {
      const result = await maskJsonValue(
        value,
        async (segment) => {
          const masked = await runMask(segment);
          return { text: masked.maskedText, stats: masked.stats };
        },
        jsonOptions,
      );
      return {
        value: result.value,
        sessionId,
        stats: result.stats,
      };
    },

    unmask(text: string, unmaskOptions?: UnmaskOptions): UnmaskResult {
      const policy =
        unmaskOptions?.missingTokenPolicy ??
        defaultUnmask.missingTokenPolicy ??
        "preserve";
      const placeholder =
        unmaskOptions?.placeholder ??
        defaultUnmask.placeholder ??
        "[[UNKNOWN]]";

      const result = unmaskText(text, sessionId, store, policy, placeholder);
      emit(createUnmaskAuditEvent(sessionId, result.missingTokens.length));
      return result;
    },
  };

  return engine;
}

export { InMemoryMaskStore, createInMemoryMaskStore } from "./store/in-memory.js";
export {
  EncryptedMaskStore,
  createEncryptedMaskStore,
  DEFAULT_STORE_TTL_MS,
  type EncryptedMaskStoreOptions,
} from "./store/encrypted.js";
export { withSessionTtl, purgeExpiredSessions } from "./store/ttl.js";
export { assertAes256Key, sealUtf8, openUtf8 } from "./store/crypto.js";
