"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { View } from "@/lib/rn";
import { SchemeColors, type ColorScheme } from "@/lib/theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);

  const applyScheme = useCallback((scheme: ColorScheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = scheme;
    root.classList.toggle("dark", scheme === "dark");
    const palette = SchemeColors[scheme];
    Object.entries(palette).forEach(([token, value]) => {
      root.style.setProperty(`--color-${token}`, value);
    });
  }, []);

  const setColorScheme = useCallback(
    (scheme: ColorScheme) => {
      setColorSchemeState(scheme);
      applyScheme(scheme);
    },
    [applyScheme],
  );

  useEffect(() => {
    applyScheme(colorScheme);
  }, [applyScheme, colorScheme]);

  const value = useMemo(
    () => ({ colorScheme, setColorScheme }),
    [colorScheme, setColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1 }}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
