import type { PatternBundle } from "./types.js";
import { JA_ADDRESS_REGEX_PATTERNS } from "./address-patterns.js";

/** メール（簡易 RFC） */
const EMAIL = /(?<![.\w])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?![.\w])/u;

/** 日本の電話番号（固定・携帯・+81） */
const PHONE_PATTERNS = [
  /(?:\+81[-\s]?|0)(?:\d[-\s]?){9,12}\d/u,
  /0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/u,
];

/** マイナンバー（4-4-4 区切り） */
const MY_NUMBER = /\b\d{4}[-\s]\d{4}[-\s]\d{4}\b/u;

/** 生年月日（ISO / 日本語表記） */
const BIRTHDATE_PATTERNS = [
  /\b(?:19|20)\d{2}[-/年](?:0?[1-9]|1[0-2])[-/月](?:0?[1-9]|[12]\d|3[01])日?\b/u,
  /\b(?:19|20)\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])\b/u,
];

/** 郵便番号 */
const POSTAL = /\b\d{3}[-‐‑–—−]?\d{4}\b/u;

/**
 * 日本 locale 向け Stage1 正規表現バンドル
 */
export const jaPatternBundle: PatternBundle = {
  patterns: {
    email: [EMAIL],
    phone: PHONE_PATTERNS,
    my_number: [MY_NUMBER],
    birthdate: BIRTHDATE_PATTERNS,
    address: [POSTAL, ...JA_ADDRESS_REGEX_PATTERNS],
  },
};
