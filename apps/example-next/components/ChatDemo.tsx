"use client";

import { useMaskSession } from "@local-mask-security/react";
import { MASK_TOKEN_PATTERN, resetMaskTokenPattern } from "@local-mask-security/core";
import { useEffect, useState } from "react";

const SAMPLE =
  "氏名：山田太郎\n連絡先: tanaka@example.com / 090-1234-5678\n私の名前は山田太郎です。\nメモ: 高松市錦町";

export function ChatDemo() {
  const { mask, engine, sessionId } = useMaskSession();
  const [input, setInput] = useState(SAMPLE);
  const [maskedPreview, setMaskedPreview] = useState("");
  const [llmMasked, setLlmMasked] = useState("");
  const [finalText, setFinalText] = useState("");
  const [stats, setStats] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handlePreviewMask() {
    setError(null);
    const result = await mask(input);
    setMaskedPreview(result.maskedText);
    setStats(
      `マスク ${result.stats.total} 件 / ${JSON.stringify(result.stats.byCategory)}`,
    );
    setLlmMasked("");
    setFinalText("");
  }

  async function handleSendMockLlm() {
    setError(null);
    setLoading(true);
    try {
      const { maskedText, stats: maskStats } = await mask(input);
      setMaskedPreview(maskedText);
      setStats(
        `マスク ${maskStats.total} 件 / ${JSON.stringify(maskStats.byCategory)}`,
      );

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maskedText, sessionId }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = (await res.json()) as { content: string };
      setLlmMasked(data.content);

      const restored = engine.unmask(data.content);
      setFinalText(restored.unmaskedText);
      resetMaskTokenPattern();
      const stillMasked = MASK_TOKEN_PATTERN.test(restored.unmaskedText);
      if (restored.missingTokens.length > 0 || stillMasked) {
        setError(
          restored.missingTokens.length > 0
            ? `欠落トークン: ${restored.missingTokens.length} 件（LLM がトークンを改変した可能性）`
            : "アンマスク後もトークンが残っています（Store と tokenFormat の不一致など）",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>
        クライアント mask → API（マスク済みのみ）→ unmask
        <span className="badge">推奨フロー</span>
      </h2>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-label="入力テキスト"
      />
      <div className="actions">
        <button type="button" className="secondary" onClick={handlePreviewMask}>
          マスクプレビュー
        </button>
        <button type="button" onClick={handleSendMockLlm} disabled={loading}>
          {loading ? "送信中…" : "モック LLM へ送信"}
        </button>
      </div>
      <p className="meta">
        sessionId: {mounted ? sessionId : "（読み込み中）"}
      </p>
      {stats ? <p className="meta">{stats}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="label">マスク済み（LLM へ送る内容）</div>
      <div className="output">{maskedPreview || "—"}</div>

      <div className="label">LLM 応答（マスク済みのまま）</div>
      <div className="output">{llmMasked || "—"}</div>

      <div className="label">アンマスク後（画面表示用）</div>
      <div className="output">{finalText || "—"}</div>
    </section>
  );
}
