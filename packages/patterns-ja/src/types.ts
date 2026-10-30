/** patterns-ja が core の PatternBundle と同形になるようミラー（循環依存回避） */
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

export interface PatternBundle {
  patterns: Partial<Record<PiiCategory, RegExp[]>>;
}
