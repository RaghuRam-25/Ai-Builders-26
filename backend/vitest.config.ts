import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedTypes = path.resolve(here, "../shared/types");

// Vite does not follow the workspace package's `exports` map for a linked
// package whose targets are raw `.ts` files, so the subpaths are aliased here
// exactly like `build.mjs` does for the production bundle.
const sharedSubpaths = [
  "api",
  "chat",
  "citizen-profile",
  "errors",
  "government-search",
  "government-service",
  "job-opportunity",
  "profile-matching",
  "training-program",
];

export default defineConfig({
  resolve: {
    alias: [
      { find: "@janasheba/shared", replacement: sharedTypes },
      ...sharedSubpaths.map((name) => ({
        find: `@janasheba/shared/${name}`,
        replacement: path.join(sharedTypes, name),
      })),
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: false,
  },
});
