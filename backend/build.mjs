import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Bundles the backend into a single ESM file.
 *
 * The app's shared TypeScript contracts live in `src/types/`, so they resolve
 * through ordinary relative imports and need no bundler alias.
 * Runtime dependencies stay external (installed from node_modules).
 */
await build({
  entryPoints: [path.join(here, "src/server.ts")],
  outfile: path.join(here, "dist/server.js"),
  // Pin the tsconfig so esbuild does not walk up and pick up an unrelated one.
  tsconfig: path.join(here, "tsconfig.build.json"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  sourcemap: true,
  logLevel: "info",
  banner: {
    js: [
      "import{createRequire as __cr}from'node:module';",
      "const require=__cr(import.meta.url);",
    ].join("\n"),
  },
});

console.log("backend bundled -> dist/server.js");
