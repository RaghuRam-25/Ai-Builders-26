/**
 * React Native style objects -> CSS-in-JS (React inline style) objects.
 *
 * The Home/Assistant/Profile/Settings screens were authored with React Native
 * `StyleSheet` objects. React Native's CSS is a subset of the web's, so the
 * screens can be ported almost verbatim; this module bridges the semantic
 * differences (directional shorthands, unitless numbers, shadows, transforms).
 */

/** Props React keeps unitless when given a raw number. */
const REACT_UNITLESS = new Set([
  "animationIterationCount",
  "aspectRatio",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "columnCount",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "gridArea",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnStart",
  "gridRow",
  "gridRowEnd",
  "gridRowStart",
  "lineClamp",
  "opacity",
  "order",
  "orphans",
  "scale",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
  "fillOpacity",
  "floodOpacity",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
]);

/**
 * Numbers RN treats as device-independent pixels, but React treats as unitless.
 * `lineHeight: 19` means 19px in RN and 19x in React, so force px.
 */
const FORCE_PX = new Set(["lineHeight", "borderTopWidth", "borderBottomWidth", "borderLeftWidth", "borderRightWidth", "borderWidth", "gap", "rowGap", "columnGap"]);

const kebab = (key: string) => key.replace(/([A-Z])/g, "-$1").toLowerCase();

/** Directional shorthands RN supports that have no direct CSS equivalent. */
const SHORTHANDS: Record<string, string[]> = {
  marginHorizontal: ["marginLeft", "marginRight"],
  marginVertical: ["marginTop", "marginBottom"],
  paddingHorizontal: ["paddingLeft", "paddingRight"],
  paddingVertical: ["paddingTop", "paddingBottom"],
  borderHorizontalWidth: ["borderLeftWidth", "borderRightWidth"],
  borderVerticalWidth: ["borderTopWidth", "borderBottomWidth"],
  borderStartWidth: ["borderLeftWidth", "borderRightWidth"],
  borderEndWidth: ["borderLeftWidth", "borderRightWidth"],
  insetHorizontal: ["left", "right"],
  insetVertical: ["top", "bottom"],
};

type Primitive = string | number | null | undefined | false;
export type StyleEntry = Record<string, unknown> | null | undefined | false;
export type PressState = { pressed: boolean; hovered: boolean; focused: boolean };
export type StyleProp = StyleEntry | StyleEntry[] | ((state: PressState) => StyleEntry | StyleEntry[]);

function length(value: unknown, key: string): Primitive {
  if (typeof value === "number") {
    if (FORCE_PX.has(key)) return `${value}px`;
    return REACT_UNITLESS.has(key) ? value : `${value}px`;
  }
  return (value as Primitive) ?? null;
}

function transform(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return null;
  const parts = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const [fn, raw] = Object.entries(item as Record<string, unknown>)[0] ?? [];
      if (!fn) return null;
      if (fn === "translateX" || fn === "translateY") return `${fn}(${length(raw, "x")})`;
      return `${fn}(${raw as string | number})`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function shadows(entry: Record<string, unknown>, out: Record<string, unknown>) {
  const color = entry.shadowColor;
  const opacity = typeof entry.shadowOpacity === "number" ? entry.shadowOpacity : 1;
  const offset = (entry.shadowOffset ?? {}) as { width?: number; height?: number };
  const radius = typeof entry.shadowRadius === "number" ? entry.shadowRadius : 0;
  if (color) {
    out.boxShadow = `${(offset.width ?? 0) as number}px ${(offset.height ?? 0) as number}px ${radius}px ${String(color)}${opacity === 1 ? "" : ` / ${opacity}`}`;
  } else if (typeof entry.elevation === "number" && entry.elevation > 0) {
    const e = entry.elevation;
    out.boxShadow = `0px ${e}px ${e * 2}px rgba(0, 0, 0, 0.15)`;
  }
}

/** Deep-flatten a style prop (including arrays and falsy entries) to one object. */
export function flatten(style: StyleProp, state?: PressState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const walk = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "function") {
      walk((node as (s: PressState) => unknown)(state ?? { pressed: false, hovered: false, focused: false }));
      return;
    }
    for (const [key, raw] of Object.entries(node as Record<string, unknown>)) {
      if (raw === null || raw === undefined || raw === false || raw === "") continue;
      if (key === "transform") {
        const value = transform(raw);
        if (value) out.transform = value;
        continue;
      }
      if (key.startsWith("shadow") || key === "elevation") {
        shadows(node as Record<string, unknown>, out);
        continue;
      }
      if (key.startsWith("$") || key === "isValid" || key === "onPress") continue;
      const spread = SHORTHANDS[key];
      if (spread) {
        for (const target of spread) out[target] = length(raw, target);
        continue;
      }
      out[kebab(key)] = length(raw, key);
    }
  };
  walk(style);
  return out;
}

/** Resolve a style prop to a React inline style object. */
export function resolve(style: StyleProp, state?: PressState): Record<string, unknown> {
  return flatten(style, state);
}

/** Tiny className joiner (the port keeps Tailwind classes, no clsx dependency). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
