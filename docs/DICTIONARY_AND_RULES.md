# 辞書・ルールの取り込みと学習

P1 以降、辞書とルールは **レジストリ** として保持し、実行時に追加・JSON 取り込み・エクスポートができます。将来の学習パイプライン（人の確認、モデル提案）も同じ入口に載せます。

## 辞書（Dictionary）

### データ形式

```json
{
  "version": 1,
  "locale": "ja",
  "entries": [
    {
      "value": "杉山太郎",
      "category": "name",
      "meta": { "source": "import", "confidence": 0.95 }
    }
  ]
}
```

### API

```ts
import {
  createMaskEngine,
  createDictionaryRegistry,
  importDictionaryFromJson,
  learnDictionaryEntry,
} from "@local-mask-security/core";

const dictionary = createDictionaryRegistry();
importDictionaryFromJson(dictionary, jsonString, "merge");

const engine = createMaskEngine({
  locale: "ja",
  dictionary,
  stages: { regex: true, dictionary: true, nlp: false },
});

// 実行中の学習（フィードバック）
learnDictionaryEntry(dictionary, "新規氏名", "name", { source: "learned" });

// 永続化用
const snapshot = dictionary.exportBundle();
```

`engine.dictionary` は `createMaskEngine` 省略時に空レジストリが自動生成され、同じ参照で `add` / `import` できます。

## ルール（Rule）

ルールは JSON  Serializable な正規表現文字列で定義します（実行時に `RegExp` へコンパイル）。

```json
{
  "version": 1,
  "rules": [
    {
      "id": "ja-label-name",
      "category": "name",
      "labelPattern": "(?:氏名|お名前)[:：]",
      "labelFlags": "u",
      "valuePattern": "[\\p{Script=Han}]{2,10}",
      "valueFlags": "u",
      "confidence": 0.85
    }
  ]
}
```

```ts
import { createRuleRegistry, importRulesFromJson, learnMaskRule } from "@local-mask-security/core";

const rules = createRuleRegistry();
importRulesFromJson(rules, bundle, "merge");

const engine = createMaskEngine({
  locale: "ja",
  rules,
  stages: { dictionary: true },
  loadDefaultJaRules: false,
});
```

`locale: "ja"` かつ `rules` 未指定のとき、組み込みの `jaDefaultRuleBundle`（氏名・連絡先・メール・電話・住所・生年月日・マイナンバー等のラベル）を読み込みます。`loadDefaultJaRules: false` で無効化できます。

## 学習フロー（推奨）

1. LLM 前後で `mask` / `unmask` を実行  
2. 漏れ・誤検知を人または別モデルでレビュー  
3. 確定した値は `learnDictionaryEntry`、パターンは `learnMaskRule` または JSON `import*`  
4. `exportBundle` を DB / オブジェクトストレージへ保存し、次回起動時に `initialBundle` または `import` で復元  

Stage 1（regex）と Stage 2（辞書・ルール）は **原文上の span を独立検出 → merge** するため、学習データを追加しても regex との優先度は `MergePolicy` で制御されます。

## maskJson

```ts
await engine.maskJson(payload, {
  maskStringFields: ["content", "email"],
});

await engine.maskJson(payload, {
  paths: ["$.messages[*].content", "$.profile.email"],
});
```

同一 `sessionId` / Store でトークンが共有されるため、LLM 応答のアンマスクと整合します。

## 日本語姓名辞書（CSV）

`docs/data/` の CSV から約 **9.6 万**の姓名トークンを `name` カテゴリで登録できます。

| ファイル | 列 |
|----------|-----|
| `last_name.csv` | 漢字, ひらがな, ローマ字 |
| `man.csv` / `woman.csv` | ひらがな, ローマ字, 漢字（複数可） |

```bash
npm run build:names   # packages/patterns-ja/data/ja-names.bundle.json を再生成
```

```ts
import { createMaskEngine } from "@local-mask-security/core";
import { createJaNamesDictionaryRegistry } from "@local-mask-security/core/ja-names";

const dictionary = createJaNamesDictionaryRegistry();
const engine = createMaskEngine({
  locale: "ja",
  dictionary,
  stages: { regex: true, dictionary: true, nlp: true },
});
```

- バンドルは約 8MB 級のため **Next.js Route Handler（サーバー）** での利用を推奨します。
- クライアントの `MaskProvider` に全量を載せるとバンドル・初期化が重くなります。
- CSV を更新したら `npm run build:names` の後、`patterns-ja` を再ビルドしてください。

## 自由文で PII を広くマスクする（ja-max-pii）

`createJaMaxPiiEngineOptions()` で **全 PiiCategory・3 Stage・拡張 stub NLP・自由文ルール** をまとめて有効化します。

| 層 | 内容 |
|----|------|
| Stage 1 regex | メール・電話・郵便番号・住所パターン等（`patterns-ja`） |
| Stage 2 ルール | 帳票ラベル + `私の名前は…です` / `…と申します` 等 |
| Stage 2 辞書 | 姓名辞書（別途 `dictionary` を渡す） |
| Stage 3 NLP | `createJaFreeTextStubNlpDetector()`（外部 API 不要） |

```ts
import { createMaskEngine, createJaMaxPiiEngineOptions } from "@local-mask-security/core";
import { createJaNamesDictionaryRegistryFromUrl } from "@local-mask-security/core/ja-names/client";

const dictionary = await createJaNamesDictionaryRegistryFromUrl("/api/ja-names-bundle");
const engine = createMaskEngine({
  ...createJaMaxPiiEngineOptions(),
  dictionary,
});
```

- ブラウザでは **`@local-mask-security/core/ja-names/client`**（`fetch` のみ・`node:fs` なし）で辞書 JSON を載せます。Node では `@local-mask-security/core/ja-names` の `createJaNamesDictionaryRegistry()` を使えます。
- 単体名詞（文中の「佐藤」だけ等）は辞書 + 文脈ルールに依存します。100% 検出は NLP モデル導入まで期待しすぎないでください。
- 姓名辞書は **2 文字未満のエントリを默认除外**（`minNameLength: 2`）。1 文字漢字が「氏名」「東京都」を壊す誤検知を防ぎます。CSV 再生成は `npm run build:names`。
