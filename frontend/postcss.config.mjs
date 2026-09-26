import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Resolved explicitly: without this, Tailwind walks up from the working
    // directory and can pick up the legacy NativeWind config at the repo root.
    tailwindcss: { config: resolve(here, "tailwind.config.js") },
    autoprefixer: {},
  },
};

export default config;
