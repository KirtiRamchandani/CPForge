import path from "node:path";
import { defineConfig } from "vitest/config";

const root = __dirname;

export default defineConfig({
  resolve: {
    alias: {
      "@cp-forge/analytics-engine": path.resolve(root, "packages/analytics-engine/src/index.ts"),
      "@cp-forge/contest-engine": path.resolve(root, "packages/contest-engine/src/index.ts"),
      "@cp-forge/core": path.resolve(root, "packages/core/src/index.ts"),
      "@cp-forge/export-engine": path.resolve(root, "packages/export-engine/src/index.ts"),
      "@cp-forge/mistake-engine": path.resolve(root, "packages/mistake-engine/src/index.ts"),
      "@cp-forge/platform-adapters": path.resolve(root, "packages/platform-adapters/src/index.ts"),
      "@cp-forge/portfolio-engine": path.resolve(root, "packages/portfolio-engine/src/index.ts"),
      "@cp-forge/recommendation-engine": path.resolve(root, "packages/recommendation-engine/src/index.ts"),
      "@cp-forge/review-scheduler": path.resolve(root, "packages/review-scheduler/src/index.ts"),
      "@cp-forge/roadmap-engine": path.resolve(root, "packages/roadmap-engine/src/index.ts"),
      "@cp-forge/schemas": path.resolve(root, "packages/schemas/src/index.ts"),
      "@cp-forge/sheet-engine": path.resolve(root, "packages/sheet-engine/src/index.ts"),
      "@cp-forge/storage": path.resolve(root, "packages/storage/src/index.ts"),
      "@cp-forge/ui": path.resolve(root, "packages/ui/src/index.tsx"),
      "@cp-forge/upsolve-engine": path.resolve(root, "packages/upsolve-engine/src/index.ts"),
      "@cp-forge/utils": path.resolve(root, "packages/utils/src/index.ts")
    }
  }
});
