"use client";

import { useEffect, useState } from "react";

/**
 * Hydration-safe color scheme hook.
 * Ports `hooks/use-color-scheme.web.ts` from the Expo app: the server (static
 * export) has no way to know the OS preference, so it renders light and the
 * real value is applied after mount.
 */
export function useColorScheme(): "light" | "dark" {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : "light";

  if (hasHydrated) {
    return colorScheme;
  }

  return "light";
}
