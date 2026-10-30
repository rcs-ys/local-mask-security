import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const patternsJa = path.resolve(rootDir, "../patterns-ja");

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    server: {
      deps: {
        inline: [/@local-mask-security\//],
      },
    },
  },
  resolve: {
    alias: {
      "@local-mask-security/patterns-ja/address": path.join(
        patternsJa,
        "dist/address-patterns.js",
      ),
      "@local-mask-security/patterns-ja/names": path.join(
        patternsJa,
        "dist/names/index.js",
      ),
      "@local-mask-security/patterns-ja": path.join(
        patternsJa,
        "dist/index.js",
      ),
    },
  },
});
