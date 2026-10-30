export {
  createMaskEngine,
  InMemoryMaskStore,
  createInMemoryMaskStore,
  EncryptedMaskStore,
  createEncryptedMaskStore,
  DEFAULT_STORE_TTL_MS,
  type EncryptedMaskStoreOptions,
  withSessionTtl,
  purgeExpiredSessions,
  assertAes256Key,
  sealUtf8,
  openUtf8,
} from "./engine.js";

export {
  createDictionaryRegistry,
  importDictionaryFromJson,
  learnDictionaryEntry,
  parseDictionaryBundle,
  type DictionaryRegistry,
  type CreateDictionaryRegistryOptions,
  type DictionaryMatcher,
} from "./dictionary/registry.js";

export { AhoCorasick, type AhoMatch, type AhoPattern } from "./dictionary/aho-corasick.js";

export {
  createSafeAuditLogger,
  sanitizeAuditEvent,
  countSpansBySource,
  createMaskAuditEvent,
  createUnmaskAuditEvent,
  type SafeAuditLoggerOptions,
} from "./audit/logger.js";

export { hashForAudit } from "./audit/hash.js";

export type {
  DictionaryBundle,
  DictionaryEntry,
  DictionaryEntryMeta,
  DictionaryImportMode,
} from "./dictionary/types.js";

export { normalizeNfkc, defaultDictionaryMatchOptions } from "./dictionary/normalize.js";

export {
  createRuleRegistry,
  importRulesFromJson,
  learnMaskRule,
  parseRuleBundle,
  type RuleRegistry,
  type CreateRuleRegistryOptions,
} from "./rules/registry.js";

export { compileMaskRule } from "./rules/compile.js";

export type {
  MaskRuleDefinition,
  MaskRuleBundle,
  RuleImportMode,
  CompiledMaskRule,
} from "./rules/types.js";

export { jaDefaultRuleBundle } from "./presets/ja-rules.js";
export { jaFormLabelRules, JA_VAL_PERSON_NAME } from "./presets/ja-form-labels.js";
export {
  createJaMaxPiiEngineOptions,
  listJaMaxPiiCategories,
} from "./presets/ja-max-pii.js";
export {
  createJaFreeTextStubNlpDetector,
  JA_FREE_TEXT_STUB_NAME_PATTERNS,
} from "./presets/ja-free-text-nlp.js";
export { jaFreeTextRules, jaFreeTextRuleBundle } from "./presets/ja-free-text-rules.js";

export { maskJsonValue } from "./json/mask-json.js";

export {
  DEFAULT_NLP_OPTIONS,
  entitiesToSpans,
  mapNlpLabelToCategory,
  type NlpDetector,
  type NlpEntity,
  type NlpOptions,
} from "./nlp/types.js";

export { createStubNlpDetector, type StubNlpDetectorOptions } from "./nlp/stub-detector.js";

export {
  createRemoteNlpDetector,
  type RemoteNlpDetectorOptions,
} from "./nlp/remote-detector.js";

export {
  createCompositeNlpDetector,
  normalizeNlpDetectors,
} from "./nlp/composite.js";

export { detectNlpSpans } from "./pipeline/nlp-stage.js";

export {
  ALL_PII_CATEGORIES,
  DEFAULT_CATEGORIES,
  DEFAULT_MERGE_POLICY,
  DEFAULT_STAGES,
  type AuditEvent,
  type CreateMaskEngineOptions,
  type DetectedSpan,
  type MaskEngine,
  type MaskEntry,
  type MaskJsonOptions,
  type MaskJsonResult,
  type MaskResult,
  type MaskStats,
  type MaskStore,
  type MaskTokenStyle,
  type MergePolicy,
  type MissingTokenPolicy,
  type PatternBundle,
  type PiiCategory,
  type SpanSource,
  type TokenFormatOptions,
  type UnmaskOptions,
  type UnmaskResult,
} from "./types.js";

export {
  MASK_TOKEN_PATTERN,
  resetMaskTokenPattern,
  deriveSessionShort,
  formatMaskToken,
  defaultTokenFormat,
  resolveTokenLabel,
  DEFAULT_TOKEN_LABELS_JA,
  DEFAULT_TOKEN_LABELS_EN,
} from "./token.js";

export {
  mergeSpans,
  detectRegexSpans,
  applyMaskReplacements,
} from "./pipeline/mask-pipeline.js";
