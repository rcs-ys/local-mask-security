# local-mask-security

LLM に送る前に個人情報（PII）をマスクし、応答をアンマスクして画面に戻すための monorepo です。

## セットアップ

```bash
npm install
npm run build
npm test
```

デモ（Next.js）:

```bash
npm run dev:example   # http://localhost:3010
```

> **WSL と Windows で `node_modules` を共有しないでください。** ビルドする OS 上だけで `npm install` / `npm run build` してください。

## 基本的な使い方（Node / サーバー）

```ts
import { createMaskEngine } from "@local-mask-security/core";

const engine = createMaskEngine({
  locale: "ja",
  tokenFormat: { style: "readable", locale: "ja" },
});

const { maskedText } = await engine.mask(
  "連絡先: tanaka@example.com / 090-1234-5678",
);

// maskedText だけ LLM に渡す
const llmReply = "…"; // トークンを改変しない応答

const { unmaskedText } = engine.unmask(llmReply);
```

## 日本語で広くマスクする（推奨）

メール・電話・住所・マイナンバー・自由文の氏名など、定義済み PII をまとめて有効にします。

```ts
import {
  createMaskEngine,
  createJaMaxPiiEngineOptions,
} from "@local-mask-security/core";
import { createJaNamesDictionaryRegistryFromUrl } from "@local-mask-security/core/ja-names/client";

// ブラウザ: 同一オリジン API から姓名辞書 JSON を取得（外部 NER ではない）
const dictionary = await createJaNamesDictionaryRegistryFromUrl(
  "/api/ja-names-bundle",
);

const engine = createMaskEngine({
  ...createJaMaxPiiEngineOptions(),
  dictionary,
  tokenFormat: { style: "readable", locale: "ja" },
});
```

Node（Route Handler）だけで辞書を読む場合:

```ts
import { createJaNamesDictionaryRegistry } from "@local-mask-security/core/ja-names";

const engine = createMaskEngine({
  ...createJaMaxPiiEngineOptions(),
  dictionary: createJaNamesDictionaryRegistry(),
});
```

## React（クライアント）

```tsx
"use client";

import { MaskProvider, useMaskSession } from "@local-mask-security/react";
import { createJaMaxPiiEngineOptions } from "@local-mask-security/core";

export function App({ children }: { children: React.ReactNode }) {
  return (
    <MaskProvider
      options={{
        ...createJaMaxPiiEngineOptions(),
        tokenFormat: { style: "readable", locale: "ja" },
        // dictionary は fetch 後に渡す — example-next の Providers を参照
      }}
    >
      {children}
    </MaskProvider>
  );
}

function Chat() {
  const { mask, engine, sessionId } = useMaskSession();

  async function send() {
    const { maskedText } = await mask(userInput);
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ maskedText, sessionId }),
    });
    const { content } = await res.json();
    const { unmaskedText } = engine.unmask(content);
    setReply(unmaskedText);
  }
}
```

参照実装: `apps/example-next`（辞書 API `/api/ja-names-bundle` + `Providers`）

## パッケージ

| パッケージ | 用途 |
|------------|------|
| `@local-mask-security/core` | マスクエンジン |
| `@local-mask-security/core/ja-names` | 姓名辞書（Node） |
| `@local-mask-security/core/ja-names/client` | 姓名辞書（fetch 用・ブラウザ可） |
| `@local-mask-security/core/ja-pii` | 自由文向け preset / stub NLP |
| `@local-mask-security/react` | `MaskProvider` / `useMaskSession` |
| `@local-mask-security/patterns-ja` | 日本向け regex |
| `@local-mask-security/nlp-node` | Node 向け NLP 拡張 |

## ドキュメント

- [DESIGN.md](./docs/DESIGN.md) — 全体設計
- [DICTIONARY_AND_RULES.md](./docs/DICTIONARY_AND_RULES.md) — 辞書・ルール・姓名 CSV
- [NLP.md](./docs/NLP.md) — NLP Stage（stub / 外部 API なし構成）

姓名 CSV を更新したら:

```bash
npm run build:names
npm run build
```
