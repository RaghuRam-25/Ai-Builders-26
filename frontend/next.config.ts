import type { NextConfig } from "next";

const config: NextConfig = {
  /**
   * Static export: Capacitor's `webDir` is `out/`, so the Android WebView
   * loads a plain file bundle with no Node server. This also means every screen
   * is a client component talking to the Express API over REST.
   */
  output: "export",
  // `distDir` is deliberately left at `.next`: with `output: "export"` Next
  // writes the static site to `out/`, so pointing `distDir` there would make
  // the build cache and the exported HTML overwrite each other.
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  },
};

export default config;
