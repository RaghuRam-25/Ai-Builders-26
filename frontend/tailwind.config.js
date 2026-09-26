const opacitySteps = Object.fromEntries(
  Array.from({ length: 21 }, (_, index) => index * 5).map((step) => [String(step), String(step / 100)]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // The original app targeted NativeWind (Tailwind v4), which accepts any
      // `/N` opacity modifier. Tailwind v3 only knows its default scale, so
      // fill in the 5-step range the ported class names use (e.g. `bg-black/35`).
      opacity: opacitySteps,
      colors: {
        primary: { light: "#0F766E", dark: "#2AAE9A", DEFAULT: "#0F766E" },
        background: { light: "#F5F8F7", dark: "#102321", DEFAULT: "#F5F8F7" },
        surface: { light: "#FFFFFF", dark: "#17312D", DEFAULT: "#FFFFFF" },
        foreground: { light: "#173531", dark: "#ECF8F4", DEFAULT: "#173531" },
        muted: { light: "#6A817A", dark: "#A8C0B9", DEFAULT: "#6A817A" },
        border: { light: "#DCEAE5", dark: "#2C4C45", DEFAULT: "#DCEAE5" },
        success: { light: "#22C55E", dark: "#4ADE80", DEFAULT: "#22C55E" },
        warning: { light: "#F59E0B", dark: "#FBBF24", DEFAULT: "#F59E0B" },
        error: { light: "#EF4444", dark: "#F87171", DEFAULT: "#EF4444" },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        serif: ["Georgia", "Times New Roman", "serif"],
        rounded: [
          "SF Pro Rounded",
          "Hiragino Maru Gothic ProN",
          "Meiryo",
          "MS PGothic",
          "sans-serif",
        ],
        mono: [
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
