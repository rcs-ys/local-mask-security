"use client";

import {
  createMaskEngine,
  createInMemoryMaskStore,
  defaultTokenFormat,
  type CreateMaskEngineOptions,
  type MaskEngine,
  type MaskStore,
} from "@local-mask-security/core";
import { useId, useMemo, useRef, type ReactNode } from "react";
import { MaskEngineContext } from "./context.js";

export type MaskProviderProps = {
  children: ReactNode;
  /** createMaskEngine に渡すオプション（store / sessionId は props で上書き可能） */
  options?: Omit<CreateMaskEngineOptions, "store" | "sessionId">;
  sessionId?: string;
  store?: MaskStore;
};

export function MaskProvider({
  children,
  options,
  sessionId,
  store: externalStore,
}: MaskProviderProps) {
  const locale = options?.locale ?? "ja";
  const tokenFormat = defaultTokenFormat(locale, options?.tokenFormat);

  const storeRef = useRef<MaskStore | null>(null);
  if (!storeRef.current) {
    storeRef.current =
      externalStore ?? createInMemoryMaskStore({ tokenFormat });
  }

  /**
   * randomUUID は SSR とクライアントで別値になり Hydration mismatch になる。
   * useId はサーバー / クライアントで安定した ID を返す。
   */
  const autoSessionId = useId().replace(/:/g, "");
  const resolvedSessionId = sessionId ?? `msk-${autoSessionId}`;

  const engine = useMemo((): MaskEngine => {
    return createMaskEngine({
      locale,
      ...options,
      tokenFormat,
      store: storeRef.current!,
      sessionId: resolvedSessionId,
    });
  }, [resolvedSessionId, locale, tokenFormat.style, tokenFormat.locale]);

  return (
    <MaskEngineContext.Provider value={engine}>
      {children}
    </MaskEngineContext.Provider>
  );
}
