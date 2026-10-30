"use client";

import { createContext, useContext } from "react";
import type { MaskEngine } from "@local-mask-security/core";

const MaskEngineContext = createContext<MaskEngine | null>(null);

export { MaskEngineContext };

export function useMaskEngine(): MaskEngine {
  const engine = useContext(MaskEngineContext);
  if (!engine) {
    throw new Error("useMaskEngine は MaskProvider 内で使用してください");
  }
  return engine;
}
