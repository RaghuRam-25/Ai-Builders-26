"use client";

import { TAB_BAR_HEIGHT, TabBar, useTabs } from "@/components/tab-bar";

/**
 * Port of `app/(tabs)/_layout.tsx`.
 *
 * React Navigation rendered the screens absolutely stacked inside a
 * `flex: 1 / overflow: hidden` container, with the bar absolutely positioned at
 * the bottom and each screen padded by the bar height. A flex column
 * (content `flex-1` + bottom padding, then the fixed-height bar) is the
 * equivalent layout.
 *
 * Route group maps to:
 *   index     -> /
 *   assistant -> /assistant
 *   profile   -> /profile
 *   settings  -> /settings
 */
export default function TabLayout({ children }: { children: React.ReactNode }) {
  const tabs = useTabs();

  return (
    <>
      <main className="rn-view flex-1 overflow-hidden" style={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {children}
      </main>
      <TabBar tabs={tabs} />
    </>
  );
}
