export type PiiCategory =
  | "email"
  | "phone"
  | "address"
  | "name"
  | "birthdate"
  | "my_number"
  | "account_id"
  | "password"
  | "custom";

export type SpanSource = "regex" | "dictionary" | "rule" | "nlp";

export interface DetectedSpan {
  start: number;
  end: number;
  category: PiiCategory;
  confidence: number;
  source: SpanSource;
  meta?: Record<string, unknown>;
}

export interface PatternBundle {
  patterns: Partial<Record<PiiCategory, RegExp[]>>;
}

export interface MaskEntry {
  token: string;
  original: string;
  category: PiiCategory;
  hashedOriginal?: string;
}

export interface MaskStats {
  total: number;
  byCategory: Partial<Record<PiiCategory, number>>;
}

export interface MaskResult {
  maskedText: string;
  sessionId: string;
  stats: MaskStats;
}

export type MissingTokenPolicy = "preserve" | "throw" | "placeholder";

/** compact: ⟦MSK:…⟧ / readable: <氏名>・<電話番号:2> など */
export type MaskTokenStyle = "compact" | "readable";

export interface TokenFormatOptions {
  style?: MaskTokenStyle;
  locale?: "ja" | "en";
  /** カテゴリ → 表示ラベル（readable 時） */
  labels?: Partial<Record<PiiCategory, string>>;
}

export interface UnmaskOptions {
  missingTokenPolicy?: MissingTokenPolicy;
  placeholder?: string;
}

export interface UnmaskResult {
  unmaskedText: string;
  missingTokens: string[];
}

export interface MergePolicy {
  sourcePriority: Record<SpanSource, number>;
  categoryPriority?: Partial<Record<PiiCategory, number>>;
  minConfidence: number;
}

export interface AuditEvent {
  type: "mask" | "unmask";
  sessionId: string;
  timestamp?: string;
  stats?: MaskStats;
  /** マージ前の検出 span をソース別に集計 */
  bySource?: Partial<Record<SpanSource, number>>;
  missingTokenCount?: number;
}

export interface MaskStore {
  getSessionShort(sessionId: string): string;
  register(
    sessionId: string,
    original: string,
    category: PiiCategory,
  ): MaskEntry;
  lookup(sessionId: string, token: string): MaskEntry | undefined;
  clear(sessionId?: string): void;
}

export interface CreateMaskEngineOptions {
  locale: "ja" | "en";
  sessionId?: string;
  store?: MaskStore;
  stages?: Partial<{ regex: boolean; dictionary: boolean; nlp: boolean }>;
  patterns?: PatternBundle;
  /** 辞書レジストリ（省略時は空。stages.dictionary 有効時に自動生成） */
  dictionary?: import("./dictionary/registry.js").DictionaryRegistry;
  /** ルールレジストリ（省略時は locale=ja なら默认ルール、否则は空） */
  rules?: import("./rules/registry.js").RuleRegistry;
  /** locale=ja かつ rules 未指定時に默认ルールを読み込む */
  loadDefaultJaRules?: boolean;
  /** NLP プラグイン（単体または配列）。composite は createCompositeNlpDetector */
  nlp?: import("./nlp/types.js").NlpDetector | import("./nlp/types.js").NlpDetector[];
  nlpOptions?: Partial<import("./nlp/types.js").NlpOptions>;
  /** stages.nlp が true で nlp 未指定時に stub を使う（默认 true） */
  useDefaultStubNlp?: boolean;
  mergePolicy?: MergePolicy;
  categories?: Partial<Record<PiiCategory, boolean>>;
  onAudit?: (event: AuditEvent) => void;
  unmask?: UnmaskOptions;
  /** マスク置換文字列の形式（默认 compact） */
  tokenFormat?: TokenFormatOptions;
}

export interface MaskJsonOptions {
  maskStringFields?: string[];
  paths?: string[];
}

export interface MaskJsonResult<T> {
  value: T;
  sessionId: string;
  stats: MaskStats;
}

export interface MaskEngine {
  readonly sessionId: string;
  readonly dictionary: import("./dictionary/registry.js").DictionaryRegistry;
  readonly rules: import("./rules/registry.js").RuleRegistry;
  mask(text: string): Promise<MaskResult>;
  maskJson<T>(value: T, options?: MaskJsonOptions): Promise<MaskJsonResult<T>>;
  unmask(text: string, options?: UnmaskOptions): UnmaskResult;
}

export const ALL_PII_CATEGORIES: readonly PiiCategory[] = [
  "email",
  "phone",
  "address",
  "name",
  "birthdate",
  "my_number",
  "account_id",
  "password",
  "custom",
] as const;

export const DEFAULT_MERGE_POLICY: MergePolicy = {
  sourcePriority: {
    regex: 4,
    rule: 3,
    dictionary: 2,
    nlp: 1,
  },
  minConfidence: 0.5,
};

export const DEFAULT_CATEGORIES: Record<PiiCategory, boolean> = {
  email: true,
  phone: true,
  address: true,
  name: true,
  birthdate: true,
  my_number: true,
  account_id: true,
  password: true,
  custom: true,
};

export const DEFAULT_STAGES = {
  regex: true,
  dictionary: false,
  nlp: false,
} as const;
