"use client";

import { createJaMaxPiiEngineOptions } from "@local-mask-security/core";
import { createJaNamesDictionaryRegistryFromUrl } from "@local-mask-security/core/ja-names/client";
import { MaskProvider } from "@local-mask-security/react";
import type { CreateMaskEngineOptions } from "@local-mask-security/core";
import { useEffect, useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<Omit<
    CreateMaskEngineOptions,
    "store" | "sessionId"
  > | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const dictionary = await createJaNamesDictionaryRegistryFromUrl(
          "/api/ja-names-bundle",
        );
        if (cancelled) return;
        setOptions({
          ...createJaMaxPiiEngineOptions(),
          dictionary,
          tokenFormat: { style: "readable", locale: "ja" },
        });
      } catch (e) {
        if (cancelled) return;
        setLoadError(
          e instanceof Error ? e.message : "姓名辞書の読み込みに失敗しました",
        );
        setOptions({
          ...createJaMaxPiiEngineOptions(),
          tokenFormat: { style: "readable", locale: "ja" },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!options) {
    return (
      <div className="page meta" style={{ padding: "2rem" }}>
        姓名辞書を読み込み中…（初回は数秒かかることがあります）
      </div>
    );
  }

  return (
    <>
      {loadError ? (
        <p className="error page" style={{ padding: "0.5rem 1rem", margin: 0 }}>
          辞書なしで続行: {loadError}
        </p>
      ) : null}
      <MaskProvider options={options}>{children}</MaskProvider>
    </>
  );
}
