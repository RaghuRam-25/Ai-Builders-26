import { Colors, type ColorScheme, type ThemeColorPalette } from "@/lib/theme";
import { useColorScheme } from "./use-color-scheme";

/**
 * Returns the current theme's color palette.
 * Port of `hooks/use-colors.ts` (uses the system scheme, as the original did).
 */
export function useColors(colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  const colorSchema = useColorScheme();
  const scheme = (colorSchemeOverride ?? colorSchema ?? "light") as ColorScheme;
  return Colors[scheme];
}
