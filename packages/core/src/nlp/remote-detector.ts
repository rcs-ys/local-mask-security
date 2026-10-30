import type { DetectedSpan, PiiCategory } from "../types.js";
import {
  entitiesToSpans,
  type NlpDetector,
  type NlpEntity,
  type NlpOptions,
} from "./types.js";

export interface RemoteNlpDetectorOptions {
  id?: string;
  url: string;
  headers?: Record<string, string>;
  /** デフォルト: POST JSON { text, locale } → { entities: NlpEntity[] } */
  mapResponse?: (payload: unknown) => NlpEntity[];
  fetchImpl?: typeof fetch;
}

const defaultMapResponse = (payload: unknown): NlpEntity[] => {
  if (
    payload &&
    typeof payload === "object" &&
    "entities" in payload &&
    Array.isArray((payload as { entities: unknown }).entities)
  ) {
    return (payload as { entities: NlpEntity[] }).entities;
  }
  throw new Error("Remote NLP response must include entities[]");
};

export function createRemoteNlpDetector(
  options: RemoteNlpDetectorOptions,
): NlpDetector {
  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  if (!fetchFn) {
    throw new Error("fetch is not available for RemoteNlpDetector");
  }

  const mapResponse = options.mapResponse ?? defaultMapResponse;

  return {
    id: options.id ?? "nlp-remote",

    async detect(
      text: string,
      nlpOptions: NlpOptions,
    ): Promise<DetectedSpan[]> {
      const res = await fetchFn(options.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: JSON.stringify({
          text,
          locale: nlpOptions.locale,
        }),
      });

      if (!res.ok) {
        throw new Error(`Remote NLP failed: ${res.status} ${res.statusText}`);
      }

      const json: unknown = await res.json();
      const entities = mapResponse(json);
      const enabled = new Set<PiiCategory>(
        nlpOptions.categories ?? ["name", "address", "custom"],
      );

      return entitiesToSpans(entities, nlpOptions, enabled);
    },
  };
}
