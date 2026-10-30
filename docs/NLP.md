# NLP Stage（P3）

Stage 3 は **プラガブルな `NlpDetector`** で文脈ベースの PII 検出を行います。regex / 辞書より優先度は低く、`MergePolicy` で統合されます。

## インターフェース

```ts
interface NlpDetector {
  readonly id: string;
  detect(text: string, options: NlpOptions): Promise<DetectedSpan[]>;
}
```

## 同梱実装

| 実装 | 用途 |
|------|------|
| `createStubNlpDetector()` | ブラウザ・テスト・開発（ヒューリスティック） |
| `createRemoteNlpDetector({ url })` | 社内 NER API（**外部 HTTP 接続あり**） |
| `createCompositeNlpDetector([...])` | 複数 detector の結果を結合 |
| `@local-mask-security/nlp-node` | Node 向け拡張 stub（Route Handler、**プロセス内のみ**） |

## 外部接続なしで完結させるには

用途ごとに次のように選びます。

| 実行場所 | NLP | 備考 |
|----------|-----|------|
| **ブラウザ（クライアントのみ）** | **stub が基本** | `stages.nlp: true` かつ `locale: "ja"` なら、detector 未指定時に `createStubNlpDetector()` が自動で使われます。ネットワークは不要です。 |
| **Next.js Route Handler（Node）** | stub または `nlp-node` | いずれも **同一プロセス内** のヒューリスティック拡張で、外部 API は不要です。 |
| **社内 NER サービス利用** | `createRemoteNlpDetector` | 別ホストへ HTTP するため、ここだけ外部接続になります。 |

stub は敬称付き氏名・都道府県付き／市区町村始まり住所など **限定的なパターン** です。自由文の「私の名前は山田太郎です」のような氏名は、stub 単体では拾えないことがあります。その場合は **Stage 2（辞書・ラベルルール）** を足すか、stub に `namePatterns` を追加するか、将来のローカル NER（Transformers 等・未実装）を検討します。

姓名辞書（約 9.6 万エントリ）は Node では `@local-mask-security/core/ja-names`、ブラウザでは **`/ja-names/client`**（同一オリジン fetch）を推奨します。

## エンジン設定

```ts
import { createMaskEngine, createStubNlpDetector } from "@local-mask-security/core";

const engine = createMaskEngine({
  locale: "ja",
  stages: { regex: true, dictionary: true, nlp: true },
  // nlp 未指定時は ja locale で stub を自動利用（外部接続なし）
  nlpOptions: {
    minConfidence: 0.7,
    categories: ["name", "address"],
  },
});

// 明示的に detector を指定
const engine2 = createMaskEngine({
  locale: "ja",
  stages: { nlp: true },
  nlp: createStubNlpDetector({
    namePatterns: [
      // 例: 自由文の氏名（誤検知に注意して調整）
      { source: "名前は[\\p{Script=Han}]{2,8}です", confidence: 0.75 },
    ],
  }),
  useDefaultStubNlp: false,
});
```

## Next.js Route Handler（Node）

```ts
import { createMaskEngine } from "@local-mask-security/core";
import { createNodeNlpDetector } from "@local-mask-security/nlp-node";

export const runtime = "nodejs";

const engine = createMaskEngine({
  locale: "ja",
  stages: { regex: true, dictionary: true, nlp: true },
  nlp: createNodeNlpDetector(),
  useDefaultStubNlp: false,
});
```

`nlp: true` かつ **Edge Runtime** では重量級モデルは使えません。stub / remote のみにするか、`runtime: "nodejs"` を指定してください。

## Remote API 形式（デフォルト）

**Request** `POST` JSON:

```json
{ "text": "...", "locale": "ja" }
```

**Response**:

```json
{
  "entities": [
    { "text": "田中", "start": 0, "end": 2, "label": "PER", "confidence": 0.92 }
  ]
}
```

`mapResponse` で独自形式に対応できます。

## ラベルマッピング

| NLP ラベル | PiiCategory |
|------------|-------------|
| PER / PERSON | name |
| LOC / ADDRESS | address |
| ORG | custom |
| PASSWORD | password |

## 将来拡張

- Transformers モデルを `@local-mask-security/nlp-node` 内で `createTransformersNlpDetector` として追加（**推論は Node 内・外部 API 不要**の想定）
- 学習結果は Stage 2 辞書へ `learnDictionaryEntry`、NER 再学習は remote / node detector 側で実施
