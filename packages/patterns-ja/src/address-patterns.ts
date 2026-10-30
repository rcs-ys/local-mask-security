/** 47 都道府県（表記ゆれ含む） */
export const JA_PREFECTURES =
  "(?:北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|德島県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)";

/** 住所内の空白（改行・改ページは含めない） */
const ADDRESS_INLINE_WS = " \\u3000\\t";

const ADDRESS_TAIL = `[-\\p{Script=Han}\\p{N}\\d${ADDRESS_INLINE_WS}－ー−号番地丁目町村]{2,48}`;

/** 都道府県から始まる住所（例: 香川県高松市錦町） */
export const JA_ADDRESS_WITH_PREFECTURE = new RegExp(
  `${JA_PREFECTURES}${ADDRESS_TAIL}`,
  "u",
);

/**
 * 都道府県を省略した市区町村から始まる住所
 * （例: 高松市錦町、渋谷区神南1-2-3）
 */
export const JA_ADDRESS_MUNICIPAL = new RegExp(
  `(?<![\\p{Script=Han}])[\\p{Script=Han}]{1,12}(?:市|区|町|村)${ADDRESS_TAIL}`,
  "u",
);

/** Stage1 regex バンドル用（`g` は detect 側で付与） */
export const JA_ADDRESS_REGEX_PATTERNS = [
  JA_ADDRESS_WITH_PREFECTURE,
  JA_ADDRESS_MUNICIPAL,
] as const;
