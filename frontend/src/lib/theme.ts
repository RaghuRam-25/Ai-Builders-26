export type ColorScheme = "light" | "dark";

/** Mirrors the original `theme.config.js` exactly. */
export const ThemeColors = {
  primary: { light: "#0F766E", dark: "#2AAE9A" },
  background: { light: "#F5F8F7", dark: "#102321" },
  surface: { light: "#FFFFFF", dark: "#17312D" },
  foreground: { light: "#173531", dark: "#ECF8F4" },
  muted: { light: "#6A817A", dark: "#A8C0B9" },
  border: { light: "#DCEAE5", dark: "#2C4C45" },
  success: { light: "#22C55E", dark: "#4ADE80" },
  warning: { light: "#F59E0B", dark: "#FBBF24" },
  error: { light: "#EF4444", dark: "#F87171" },
} as const;

type ThemeColorTokens = typeof ThemeColors;
type ThemeColorName = keyof ThemeColorTokens;
type SchemePalette = Record<ColorScheme, Record<ThemeColorName, string>>;
type SchemePaletteItem = SchemePalette[ColorScheme];

function buildSchemePalette(colors: ThemeColorTokens): SchemePalette {
  const palette: SchemePalette = { light: {} as SchemePalette["light"], dark: {} as SchemePalette["dark"] };
  (Object.keys(colors) as ThemeColorName[]).forEach((name) => {
    const swatch = colors[name];
    palette.light[name] = swatch.light;
    palette.dark[name] = swatch.dark;
  });
  return palette;
}

export const SchemeColors = buildSchemePalette(ThemeColors);

type RuntimePalette = SchemePaletteItem & {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
};

function buildRuntimePalette(scheme: ColorScheme): RuntimePalette {
  const base = SchemeColors[scheme];
  return {
    ...base,
    text: base.foreground,
    background: base.background,
    tint: base.primary,
    icon: base.muted,
    tabIconDefault: base.muted,
    tabIconSelected: base.primary,
    border: base.border,
  };
}

export const Colors = {
  light: buildRuntimePalette("light"),
  dark: buildRuntimePalette("dark"),
} satisfies Record<ColorScheme, RuntimePalette>;

export type ThemeColorPalette = (typeof Colors)[ColorScheme];

/** Web branch of the original `Platform.select` font stacks. */
export const Fonts = {
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
  mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
};
