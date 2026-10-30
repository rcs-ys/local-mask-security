"use client";

import type { MaskJsonOptions, UnmaskOptions } from "@local-mask-security/core";
import { useCallback } from "react";
import { useMaskEngine } from "./context.js";

export function useMaskSession() {
  const engine = useMaskEngine();

  const mask = useCallback(
    (text: string) => engine.mask(text),
    [engine],
  );

  const unmask = useCallback(
    (text: string, options?: UnmaskOptions) => engine.unmask(text, options),
    [engine],
  );

  const maskJson = useCallback(
    <T,>(value: T, options?: MaskJsonOptions) =>
      engine.maskJson(value, options),
    [engine],
  );

  return {
    sessionId: engine.sessionId,
    engine,
    dictionary: engine.dictionary,
    rules: engine.rules,
    mask,
    unmask,
    maskJson,
  };
}
