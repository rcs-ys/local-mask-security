import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(appDir, "../..");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@local-mask-security/core",
    "@local-mask-security/react",
    "@local-mask-security/patterns-ja",
  ],
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
