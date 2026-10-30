import type { MaskRuleDefinition } from "../rules/types.js";

/** 改行を含まない氏名・フリーテキスト（1行） */
export const JA_VAL_PERSON_NAME =
  "[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}A-Za-z・\\u3000 ]{2,24}";

const VAL_PERSON_NAME = JA_VAL_PERSON_NAME;

const VAL_EMAIL =
  "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}";

const VAL_PHONE =
  "(?:\\+81[-\\s]?|0)(?:\\d[-\\s]?){9,14}\\d|0\\d{1,4}[-\\s]?\\d{1,4}[-\\s]?\\d{3,4}";

/** ラベル直後の1行（連絡先・備考など混在フィールド向け） */
const VAL_REST_OF_LINE = "[^\\n\\r]+";

const VAL_ADDRESS =
  "[\\p{Script=Han}\\p{N}\\d\\u3000 \\-－ー−号番地丁目都道府県市区町村]{4,80}";

const VAL_DATE =
  "(?:19|20)\\d{2}[-/年](?:0?[1-9]|1[0-2])[-/月](?:0?[1-9]|[12]\\d|3[01])日?";

const VAL_POSTAL = "\\d{3}[-‐‑–—−]?\\d{4}";

const VAL_MY_NUMBER = "\\d{4}[-\\s]\\d{4}[-\\s]\\d{4}";

const VAL_ACCOUNT = "[A-Za-z0-9._-]{3,64}";

const L = (labels: string[]) => `(?:${labels.join("|")})[:：]`;

/**
 * フォーム・帳票でよく使うラベル付き PII ルール集。
 * `jaDefaultRuleBundle` から取り込む。
 */
export const jaFormLabelRules: MaskRuleDefinition[] = [
  {
    id: "ja-label-name",
    category: "name",
    labelPattern: L([
      "氏名",
      "お名前",
      "名前",
      "担当者名",
      "代表者名",
      "顧客名",
      "申込者名",
      "ご氏名",
      "フルネーム",
    ]),
    labelFlags: "u",
    valuePattern: VAL_PERSON_NAME,
    valueFlags: "u",
    confidence: 0.85,
  },
  {
    id: "ja-label-contact-line",
    category: "custom",
    labelPattern: L(["連絡先", "ご連絡先", "連絡先情報", "連絡方法", "お問い合わせ先"]),
    labelFlags: "u",
    valuePattern: VAL_REST_OF_LINE,
    valueFlags: "u",
    maxValueLength: 240,
    confidence: 0.86,
    meta: { hint: "email/phone 混在行。regex と併用時は regex が優先" },
  },
  {
    id: "ja-label-email",
    category: "email",
    labelPattern: L([
      "メールアドレス",
      "メール",
      "Eメール",
      "E-mail",
      "Email",
      "email",
      "電子メール",
    ]),
    labelFlags: "iu",
    valuePattern: VAL_EMAIL,
    valueFlags: "u",
    confidence: 0.9,
  },
  {
    id: "ja-label-phone",
    category: "phone",
    labelPattern: L([
      "電話番号",
      "電話",
      "TEL",
      "Tel",
      "telephone",
      "携帯番号",
      "携帯",
      "携帯電話",
      "固定電話",
      "電話No",
    ]),
    labelFlags: "iu",
    valuePattern: VAL_PHONE,
    valueFlags: "u",
    confidence: 0.9,
  },
  {
    id: "ja-label-fax",
    category: "phone",
    labelPattern: L(["FAX", "Fax", "ファックス", "fax番号"]),
    labelFlags: "iu",
    valuePattern: VAL_PHONE,
    valueFlags: "u",
    confidence: 0.88,
  },
  {
    id: "ja-label-address",
    category: "address",
    labelPattern: L([
      "住所",
      "ご住所",
      "現住所",
      "自宅住所",
      "勤務先住所",
      "配送先",
      "送付先",
      "所在地",
      "住居",
    ]),
    labelFlags: "u",
    valuePattern: VAL_ADDRESS,
    valueFlags: "u",
    maxValueLength: 80,
    confidence: 0.87,
  },
  {
    id: "ja-label-postal",
    category: "address",
    labelPattern: "(?:郵便番号)[:：]|〒\\s*",
    labelFlags: "u",
    valuePattern: VAL_POSTAL,
    valueFlags: "u",
    confidence: 0.92,
  },
  {
    id: "ja-label-birthdate",
    category: "birthdate",
    labelPattern: L(["生年月日", "誕生日", "生年月日（西暦）", "生年月日（和暦）"]),
    labelFlags: "u",
    valuePattern: VAL_DATE,
    valueFlags: "u",
    confidence: 0.9,
  },
  {
    id: "ja-label-my-number",
    category: "my_number",
    labelPattern: L(["マイナンバー", "個人番号", "社会保障・税番号"]),
    labelFlags: "u",
    valuePattern: VAL_MY_NUMBER,
    valueFlags: "u",
    confidence: 0.93,
  },
  {
    id: "ja-label-account-id",
    category: "account_id",
    labelPattern: L([
      "アカウントID",
      "ユーザーID",
      "社員ID",
      "ログインID",
      "口座番号",
      "顧客番号",
      "会員番号",
      "お客様番号",
      "証券番号",
      "ID",
    ]),
    labelFlags: "iu",
    valuePattern: VAL_ACCOUNT,
    valueFlags: "u",
    confidence: 0.88,
  },
  {
    id: "ja-label-password",
    category: "password",
    labelPattern: L(["パスワード", "PW", "password", "Pass", "暗証番号"]),
    labelFlags: "iu",
    valuePattern: "\\S{4,128}",
    valueFlags: "u",
    confidence: 0.9,
  },
];
