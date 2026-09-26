"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/lib/language-context";
import { View, Pressable } from "@/lib/rn";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { fonts } from "@/lib/navigation-fonts";

/**
 * Port of the `@react-navigation/bottom-tabs` v7 `BottomTabBar` + `BottomTabItem`
 * as configured in the original `app/(tabs)/_layout.tsx`.
 *
 * Metrics copied from the real implementation:
 *  - bar: height 56 + bottom padding, paddingTop 8, paddingBottom bottom padding,
 *    borderTopWidth 0.5 (hairline), background from the theme
 *  - content row: flex 1, flexDirection row
 *  - item: flex 1; button: alignItems center, justifyContent flex-start,
 *    flexDirection column, padding 5
 *  - label: fontSize 10, `fonts.medium` (weight 500), textAlign center
 *
 * The inactive tint is React Navigation's default for the `uikit` variant:
 * `Color(theme.text).mix(Color(theme.card), 0.5)` with the DefaultTheme palette
 * (text #1C1C1E, card #FFFFFF) => #8E8E8F.
 */
const INACTIVE_TINT = "#8E8E8F";

/**
 * `Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8)` in the original.
 * React Navigation exposed this through `useBottomTabBarHeight()`; screens used
 * it to inset their content, and the bar used it to size itself.
 */
export const TAB_BAR_BOTTOM_PADDING = 12;
export const TAB_BAR_HEIGHT = 56 + TAB_BAR_BOTTOM_PADDING;

export type TabDefinition = {
  /** Route path, also used as the tab key. */
  href: string;
  title: string;
  icon: IconSymbolName;
};

export function useTabs(): TabDefinition[] {
  const { isEnglish } = useLanguage();
  return useMemo(
    () => [
      { href: "/", title: isEnglish ? "Home" : "হোম", icon: "house.fill" },
      { href: "/assistant", title: isEnglish ? "AI Assistant" : "AI সহকারী", icon: "bubble.left.and.bubble.right.fill" },
      { href: "/profile", title: "Profile", icon: "person.crop.circle.fill" },
      { href: "/settings", title: isEnglish ? "Settings" : "সেটিংস", icon: "gearshape.fill" },
    ],
    [isEnglish],
  );
}

const normalize = (pathname: string) => {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

export function TabBar({ tabs }: { tabs: TabDefinition[] }) {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const current = normalize(pathname ?? "/");

  // `Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8)` in the original.
  const bottomPadding = TAB_BAR_BOTTOM_PADDING;
  const tabBarHeight = TAB_BAR_HEIGHT;

  const onPress = useCallback(
    (href: string) => {
      if (normalize(href) === current) return;
      router.push(href === "/" ? "/" : href);
    },
    [current, router],
  );

  return (
    <div
      className="rn-view fixed inset-x-0 bottom-0 z-40"
      style={{
        height: tabBarHeight,
        paddingTop: 8,
        paddingBottom: bottomPadding,
        backgroundColor: colors.background,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
      }}
    >
      <View role="tablist" className="h-full flex-row">
        {tabs.map((tab) => {
          const focused = normalize(tab.href) === current;
          return (
            <View key={tab.href} className="flex-1" style={{ borderRadius: 0, overflow: "visible" }}>
              <Pressable
                accessibilityRole="tab"
                aria-selected={focused}
                aria-label={tab.title}
                onPress={() => onPress(tab.href)}
                className="rn-press"
                style={[
                  { alignItems: "center", borderRadius: 10 },
                  { flex: 1, backgroundColor: "transparent", borderRadius: 0 },
                  { justifyContent: "flex-start", flexDirection: "column", padding: 5 },
                ]}
              >
                <IconSymbol size={28} name={tab.icon} color={focused ? colors.tint : INACTIVE_TINT} />
                <span
                  style={{
                    ...fonts.medium,
                    fontSize: 10,
                    lineHeight: "normal",
                    color: focused ? colors.tint : INACTIVE_TINT,
                    textAlign: "center",
                    backgroundColor: "transparent",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  {tab.title}
                </span>
              </Pressable>
            </View>
          );
        })}
      </View>
    </div>
  );
}
