import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Janasheba AI",
  description: "সরকারি সেবা সহায়ক",
  applicationName: "Janasheba AI",
  // Carried over from `app.config.ts` (web.favicon) and the Expo app icon.
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Janasheba AI" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F8F7" },
    { media: "(prefers-color-scheme: dark)", color: "#102321" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
