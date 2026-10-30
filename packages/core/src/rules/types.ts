import type { PiiCategory } from "../types.js";

/** JSON から取り込めるルール定義（正規表現は文字列） */
export interface MaskRuleDefinition {
  id: string;
  category: PiiCategory;
  labelPattern?: string;
  labelFlags?: string;
  valuePattern?: string;
  valueFlags?: string;
  /** ラベル直後の空白を許容 */
  gapPattern?: string;
  maxValueLength?: number;
  confidence: number;
  enabled?: boolean;
  meta?: Record<string, unknown>;
}

export interface MaskRuleBundle {
  version?: number;
  locale?: string;
  rules: MaskRuleDefinition[];
}

export type RuleImportMode = "merge" | "replace";

export interface CompiledMaskRule {
  id: string;
  category: PiiCategory;
  label?: RegExp;
  value: RegExp;
  gap?: RegExp;
  maxValueLength?: number;
  confidence: number;
  enabled: boolean;
  meta?: Record<string, unknown>;
}
