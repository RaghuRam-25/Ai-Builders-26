import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wraps the statically exported Next.js site (`next build` with
 * `output: "export"` -> `out/`) in a native Android WebView.
 *
 * `appId` is carried over verbatim from the Expo `android.package`
 * (`com.app.janashebaai`) so an upgrade keeps the same app identity, and the
 * launcher/splash icons come from the assets the Expo build used.
 */
const config: CapacitorConfig = {
  appId: "com.app.janashebaai",
  appName: "জনসেবা AI",
  webDir: "out",
  android: {
    // Edge-to-edge was enabled in `app.config.ts`; keep it for continuity.
    backgroundColor: "#F5F8F7",
  },
  server: {
    /**
     * The WebView origin must not be https while the API is served over plain
     * http, or the browser engine rejects every call as blocked mixed content.
     * `http` here only affects the local origin (`http://localhost`) that
     * Capacitor serves the bundled app from - it is not a network transport
     * decision. Point the app at an https API before shipping and flip this
     * back to `https`.
     */
    androidScheme: "http",
    /**
     * Required alongside `androidScheme: "http"`: Android 9+ blocks cleartext
     * HTTP by default, which would otherwise break all API calls from the app.
     */
    cleartext: true,
  },
};

export default config;
