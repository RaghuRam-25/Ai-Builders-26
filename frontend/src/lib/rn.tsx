"use client";

/**
 * React Native compatible primitives for the web.
 *
 * The Expo screens were written against `react-native`. Rather than rewrite
 * every screen, these shims keep the same component names, props and style
 * objects so the port stays a near-verbatim copy (which is what preserves
 * pixel-for-pixel fidelity).
 */
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cx, resolve, type PressState, type StyleProp } from "./style";

type DivProps = {
  children?: ReactNode;
  className?: string;
  style?: StyleProp;
  pointerEvents?: "auto" | "none" | "box-none" | "none";
  testID?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className" | "children">;

const VIEW_BASE = "rn-view";

export type ViewProps = DivProps;

export const View = forwardRef<HTMLDivElement, DivProps>(function View(
  { children, className, style, pointerEvents, testID, ...rest },
  ref,
) {
  const resolved = resolve(style);
  if (pointerEvents) {
    (resolved as CSSProperties).pointerEvents = pointerEvents === "box-none" ? "none" : pointerEvents;
  }
  return (
    <div ref={ref} className={cx(VIEW_BASE, className)} style={resolved} data-testid={testID} {...rest}>
      {children}
    </div>
  );
});

type TextProps = {
  children?: ReactNode;
  className?: string;
  style?: StyleProp;
  numberOfLines?: number;
  testID?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className" | "children">;

export const Text = forwardRef<HTMLDivElement, TextProps>(function Text(
  { children, className, style, numberOfLines, testID, ...rest },
  ref,
) {
  const resolved = resolve(style);
  if (numberOfLines) {
    (resolved as CSSProperties).overflow = "hidden";
    (resolved as CSSProperties).display = "-webkit-box";
    (resolved as CSSProperties).WebkitBoxOrient = "vertical";
    (resolved as CSSProperties).WebkitLineClamp = numberOfLines;
  }
  return (
    <div ref={ref} className={className} style={resolved} data-testid={testID} {...rest}>
      {children}
    </div>
  );
});

type PressableProps = {
  children?: ReactNode;
  className?: string;
  style?: StyleProp;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  hitSlop?: number;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  testID?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className" | "children" | "onClick">;

export const Pressable = forwardRef<HTMLDivElement, PressableProps>(function Pressable(
  { children, className, style, onPress, onLongPress, disabled, hitSlop: _hitSlop, accessibilityRole, accessibilityLabel, testID, ...rest },
  ref,
) {
  const [state, setState] = useState<PressState>({ pressed: false, hovered: false, focused: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => stopTimer, []);

  const startPress = () => {
    if (disabled) return;
    setState((s) => ({ ...s, pressed: true }));
    stopTimer();
    timer.current = setTimeout(() => onLongPress?.(), 500);
  };
  const endPress = (fire: boolean) => {
    stopTimer();
    setState((s) => ({ ...s, pressed: false }));
    if (fire && !disabled) onPress?.();
  };

  const resolved = resolve(style, state);
  if (disabled) (resolved as CSSProperties).pointerEvents = "none";

  return (
    <div
      ref={ref}
      role={accessibilityRole ?? "button"}
      aria-label={accessibilityLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      data-testid={testID}
      className={cx("rn-press", className === "rn-press" ? undefined : className)}
      style={resolved}
      onPointerDown={startPress}
      onPointerUp={() => endPress(true)}
      onPointerLeave={() => {
        setState((s) => ({ ...s, pressed: false, hovered: false }));
        stopTimer();
      }}
      onPointerEnter={() => setState((s) => ({ ...s, hovered: true }))}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          endPress(true);
        }
      }}
      {...rest}
    >
      {children}
    </div>
  );
});

type ScrollViewProps = {
  children?: ReactNode;
  className?: string;
  style?: StyleProp;
  contentContainerStyle?: StyleProp;
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  refreshControl?: ReactNode;
  testID?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className" | "children">;

export const ScrollView = forwardRef<HTMLDivElement, ScrollViewProps>(function ScrollView(
  { children, className, style, contentContainerStyle, horizontal, showsVerticalScrollIndicator, showsHorizontalScrollIndicator, refreshControl, testID, ...rest },
  ref,
) {
  const hideBars = showsVerticalScrollIndicator === false || showsHorizontalScrollIndicator === false;
  return (
    <div
      ref={ref}
      className={cx("rn-scroll", horizontal ? "rn-scroll-horizontal" : undefined, hideBars ? "no-scrollbar" : undefined, className)}
      style={resolve(style)}
      data-testid={testID}
      {...rest}
    >
      <div className={cx("rn-scroll-content", horizontal ? "rn-scroll-content-horizontal" : undefined)} style={resolve(contentContainerStyle)}>
        {refreshControl}
        {children}
      </div>
    </div>
  );
});

type TextInputProps = {
  className?: string;
  style?: StyleProp;
  value?: string;
  defaultValue?: string;
  onChangeText?: (next: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  keyboardType?: string;
  autoCapitalize?: string;
  autoCorrect?: boolean;
  multiline?: boolean;
  editable?: boolean;
  onSubmitEditing?: () => void;
  testID?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "className" | "onChange" | "value" | "placeholder" | "type">;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, style, value, defaultValue, onChangeText, placeholder, placeholderTextColor, secureTextEntry, keyboardType, autoCapitalize, autoCorrect, multiline: _multiline, editable = true, onSubmitEditing, testID, ...rest },
  ref,
) {
  const resolved = resolve(style) as CSSProperties;
  if (!editable) resolved.pointerEvents = "none";
  if (placeholderTextColor) (resolved as Record<string, string>)["--ph"] = placeholderTextColor;
  return (
    <input
      ref={ref}
      className={cx("rn-input", className)}
      style={resolved}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={(event) => onChangeText?.(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSubmitEditing?.();
      }}
      type={secureTextEntry ? "password" : "text"}
      inputMode={keyboardType === "numeric" ? "numeric" : keyboardType === "email-address" ? "email" : keyboardType === "phone-pad" ? "tel" : undefined}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      disabled={!editable}
      aria-label={placeholder}
      data-testid={testID}
      {...rest}
    />
  );
});

type SafeAreaViewProps = {
  children?: ReactNode;
  className?: string;
  style?: StyleProp;
  edges?: Array<"top" | "bottom" | "left" | "right">;
  testID?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className" | "children">;

export const SafeAreaView = forwardRef<HTMLDivElement, SafeAreaViewProps>(function SafeAreaView(
  { children, className, style, edges = ["top", "bottom", "left", "right"], testID, ...rest },
  ref,
) {
  const resolved = resolve(style) as CSSProperties;
  if (edges.includes("top")) resolved.paddingTop = "var(--safe-top)";
  if (edges.includes("bottom")) resolved.paddingBottom = "var(--safe-bottom)";
  if (edges.includes("left")) resolved.paddingLeft = "var(--safe-left)";
  if (edges.includes("right")) resolved.paddingRight = "var(--safe-right)";
  return (
    <div ref={ref} className={cx("rn-safe", className)} style={resolved} data-testid={testID} {...rest}>
      {children}
    </div>
  );
});

export const ActivityIndicator = forwardRef<HTMLDivElement, { className?: string; size?: number; color?: string }>(
  function ActivityIndicator({ className, size = 20, color = "#0F766E" }, ref) {
    return (
      <div
        ref={ref}
        role="progressbar"
        className={cx("rn-spinner", className)}
        style={{ width: size, height: size, borderColor: `${color}33`, borderTopColor: color }}
      />
    );
  },
);

type ModalProps = {
  visible: boolean;
  children?: ReactNode;
  transparent?: boolean;
  animationType?: "none" | "slide" | "fade";
  onRequestClose?: () => void;
};

export function Modal({ visible, children, transparent, animationType = "fade", onRequestClose }: ModalProps) {
  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onRequestClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onRequestClose]);

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cx("rn-modal", animationType === "slide" ? "rn-modal-slide" : "rn-modal-fade")}
      style={{ backgroundColor: transparent ? "transparent" : "#FFFFFF" }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onRequestClose?.();
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

/**
 * RN `KeyboardAvoidingView`.
 *
 * The screens only use it to keep the composer above the soft keyboard. On the
 * web/Android WebView the visual viewport shrinks when the keyboard opens, so
 * padding by that delta reproduces the native `behavior="padding"` result.
 * `behavior="height"`/undefined simply fill the space.
 */
export const KeyboardAvoidingView = forwardRef<HTMLDivElement, {
  children?: ReactNode;
  className?: string;
  style?: StyleProp;
  behavior?: "height" | "position" | "padding";
  keyboardVerticalOffset?: number;
  testID?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className" | "children">>(function KeyboardAvoidingView(
  { children, className, style, behavior = "padding", keyboardVerticalOffset = 0, testID, ...rest },
  ref,
) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || behavior !== "padding") return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onResize = () => {
      const delta = window.innerHeight - viewport.height - viewport.offsetTop;
      setOffset(Math.max(0, Math.round(delta - keyboardVerticalOffset)));
    };
    onResize();
    viewport.addEventListener("resize", onResize);
    viewport.addEventListener("scroll", onResize);
    return () => {
      viewport.removeEventListener("resize", onResize);
      viewport.removeEventListener("scroll", onResize);
    };
  }, [behavior, keyboardVerticalOffset]);

  const resolved = resolve(style) as CSSProperties;
  if (offset) resolved.paddingBottom = `${offset}px`;

  return (
    <div ref={ref} className={cx("rn-kav", className)} style={resolved} data-testid={testID} {...rest}>
      {children}
    </div>
  );
});

/** RN `Share.share` -> Web Share API, falling back to the clipboard. */
export const Share = {
  async share({ message, title }: { message?: string; title?: string } = {}) {
    const text = [title, message].filter(Boolean).join("\n");
    if (!text) return { action: "dismissedAction" as const };
    const nav = typeof navigator === "undefined" ? undefined : navigator;
    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({ title, text });
        return { action: "sharedAction" as const };
      } catch {
        // User dismissed the sheet, or the payload was rejected.
        return { action: "dismissedAction" as const };
      }
    }
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
    }
    return { action: "sharedAction" as const };
  },
};

/** RN `Linking.openURL` -> new tab on web, deep link on Capacitor. */
export const Linking = {
  openURL(url: string) {
    if (typeof window !== "undefined" && window.open) {
      window.open(url, "_blank", "noopener,noreferrer");
      return Promise.resolve(true as const);
    }
    return Promise.resolve(true as const);
  },
};

export const Platform = { OS: "web" as const, select: <T,>(spec: { web?: T; default?: T }) => spec.web ?? spec.default };

/* -------------------------------------------------------------------------- */
/* Alert.alert: an imperative shim rendered by <AlertHost /> in the root layout */
/* -------------------------------------------------------------------------- */

type AlertSpec = { title?: string; message?: string; buttons?: Array<{ text?: string; style?: "default" | "cancel" | "destructive"; onPress?: () => void }> };

let pushAlert: ((spec: AlertSpec) => void) | null = null;

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertSpec["buttons"]) {
    pushAlert?.({ title, message, buttons });
  },
};

export function AlertHost() {
  const [alert, setAlert] = useState<AlertSpec | null>(null);
  useEffect(() => {
    pushAlert = (spec) => setAlert(spec);
    return () => {
      pushAlert = null;
    };
  }, []);
  if (!alert) return null;
  return createPortal(
    <div className="rn-modal rn-modal-fade" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
      <View className="m-auto w-[84%] max-w-[340px] rounded-[18px] bg-white px-5 pb-4 pt-5" style={{ boxShadow: "0px 18px 40px rgba(0,0,0,0.22)" }}>
        <Text className="text-[16px] font-bold text-[#173531]">{alert.title ?? ""}</Text>
        {alert.message ? (
          <Text className="mt-2 whitespace-pre-line text-[13px] leading-[20px] text-[#526C65]">{alert.message}</Text>
        ) : null}
        <View className="mt-4 flex-row justify-end gap-2">
          {(alert.buttons ?? [{ text: "OK" }]).map((button, index) => (
            <Pressable
              key={`${button.text}-${index}`}
              onPress={() => {
                setAlert(null);
                button.onPress?.();
              }}
              className="rounded-xl bg-[#EAF2EF] px-4 py-2.5"
            >
              <Text className="text-[13px] font-bold text-[#0F766E]">{button.text ?? "OK"}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </div>,
    document.body,
  );
}
