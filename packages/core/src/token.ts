import type { PiiCategory, TokenFormatOptions } from "./types.js";

/** マスクトークン（compact + readable） */
export const MASK_TOKEN_PATTERN =
  /⟦MSK:([a-zA-Z0-9]+):([a-zA-Z0-9_]+):(\d{4})⟧|<[^<>\n]{1,40}(?::\d+)?>/gu;

export const DEFAULT_TOKEN_LABELS_JA: Record<PiiCategory, string> = {
  name: "氏名",
  phone: "電話番号",
  email: "メールアドレス",
  address: "住所",
  birthdate: "生年月日",
  my_number: "マイナンバー",
  account_id: "アカウントID",
  password: "パスワード",
  custom: "個人情報",
};

export const DEFAULT_TOKEN_LABELS_EN: Record<PiiCategory, string> = {
  name: "NAME",
  phone: "PHONE",
  email: "EMAIL",
  address: "ADDRESS",
  birthdate: "BIRTHDATE",
  my_number: "MY_NUMBER",
  account_id: "ACCOUNT_ID",
  password: "PASSWORD",
  custom: "PII",
};

export function deriveSessionShort(sessionId: string): string {
  const compact = sessionId.replace(/-/g, "");
  return compact.slice(0, 8);
}

export function resolveTokenLabel(
  category: PiiCategory,
  format: TokenFormatOptions,
): string {
  if (format.labels?.[category]) return format.labels[category]!;
  const locale = format.locale ?? "ja";
  return locale === "en"
    ? DEFAULT_TOKEN_LABELS_EN[category]
    : DEFAULT_TOKEN_LABELS_JA[category];
}

export function formatMaskToken(
  sessionShort: string,
  category: PiiCategory,
  seq: number,
  format: TokenFormatOptions = { style: "compact" },
): string {
  if (format.style === "readable") {
    const label = resolveTokenLabel(category, format);
    if (seq <= 1) return `<${label}>`;
    return `<${label}:${seq}>`;
  }

  const padded = String(seq).padStart(4, "0");
  return `⟦MSK:${sessionShort}:${category}:${padded}⟧`;
}

export function resetMaskTokenPattern(): void {
  MASK_TOKEN_PATTERN.lastIndex = 0;
}

export function defaultTokenFormat(
  locale: "ja" | "en",
  override?: TokenFormatOptions,
): TokenFormatOptions {
  return {
    style: "compact",
    locale,
    ...override,
  };
}
