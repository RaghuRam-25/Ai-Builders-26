"use client";

import glyphMap from "../../../public/fonts/MaterialIcons.glyphmap.json";

/**
 * Port of `components/ui/icon-symbol.tsx`.
 *
 * The original Expo app used `expo-symbols` on iOS and `@expo/vector-icons`
 * MaterialIcons on Android **and web**. Since this port targets web/Android, the
 * MaterialIcons path is the parity target: the same font (self-hosted from the
 * same package) and the same SF Symbol -> Material name mapping.
 */
const MAPPING = {
  "house.fill": "home",
  "gearshape.fill": "settings",
  "bubble.left.and.bubble.right.fill": "chat",
  "person.crop.circle.fill": "account-circle",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
} as const;

export type IconSymbolName = keyof typeof MAPPING;

const glyphs = glyphMap as unknown as Record<string, number>;

export function MaterialIcon({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string;
  style?: React.CSSProperties;
}) {
  const codepoint = glyphs[name];
  return (
    <span
      aria-hidden
      style={{
        fontFamily: "Material Icons",
        fontSize: size,
        color,
        fontWeight: "normal",
        fontStyle: "normal",
        ...style,
      }}
    >
      {codepoint === undefined ? "?" : String.fromCodePoint(codepoint)}
    </span>
  );
}

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: React.CSSProperties;
}) {
  return <MaterialIcon color={color} size={size} name={MAPPING[name]} style={style} />;
}
