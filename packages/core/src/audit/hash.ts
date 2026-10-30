import { sha256 } from "@noble/hashes/sha256.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

/** 監査ログ用（原文そのものは出さない） */
export function hashForAudit(text: string): string {
  return bytesToHex(sha256(utf8ToBytes(text)));
}
