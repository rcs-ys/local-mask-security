import { describe, expect, it } from "vitest";
import {
  JA_ADDRESS_MUNICIPAL,
  JA_ADDRESS_WITH_PREFECTURE,
} from "../../patterns-ja/src/address-patterns.js";

describe("日本語住所 regex", () => {
  it("市区町村パターンは改行を跨がない", () => {
    const text = "メモ: 高松市錦町\n\n1234-5678-9012 ←マイナンバー";
    const re = new RegExp(JA_ADDRESS_MUNICIPAL.source, "gu");
    const matches = [...text.matchAll(re)].map((m) => m[0]);
    expect(matches).toEqual(["高松市錦町"]);
  });

  it("都道府県パターンも改行を跨がない", () => {
    const text = "香川県高松市錦町\n\n1234-5678-9012";
    const re = new RegExp(JA_ADDRESS_WITH_PREFECTURE.source, "gu");
    const matches = [...text.matchAll(re)].map((m) => m[0]);
    expect(matches).toEqual(["香川県高松市錦町"]);
  });
});
