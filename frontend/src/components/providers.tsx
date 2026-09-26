"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { AlertHost } from "@/lib/rn";
import { LanguageProvider } from "@/lib/language-context";
import { ProfileProvider } from "@/lib/profile-context";
import { ThemeProvider } from "@/lib/theme-provider";

/**
 * Provider stack, mirroring `app/_layout.tsx` from the Expo app:
 * ThemeProvider > LanguageProvider > ProfileProvider > QueryClientProvider.
 * (`trpc.Provider` is gone with the Manus backend; the REST client lives in
 * `lib/api.ts`.)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProfileProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          <AlertHost />
        </ProfileProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
