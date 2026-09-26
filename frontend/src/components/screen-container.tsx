"use client";

import { View, SafeAreaView, type ViewProps } from "@/lib/rn";
import { cn } from "@/lib/utils";

type Edge = "top" | "bottom" | "left" | "right";

export interface ScreenContainerProps extends Omit<ViewProps, "style"> {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by the tab bar.
   */
  edges?: Edge[];
  /** Tailwind className for the content area. */
  className?: string;
  /** Additional className for the outer container (background layer). */
  containerClassName?: string;
  /** Additional className for the SafeAreaView (content layer). */
  safeAreaClassName?: string;
  style?: ViewProps["style"];
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the
 * background color, while the inner SafeAreaView ensures content is within
 * safe bounds.
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  ...props
}: ScreenContainerProps) {
  return (
    <View className={cn("flex-1", "bg-background", containerClassName)} {...props}>
      <SafeAreaView edges={edges} className={cn("flex-1", safeAreaClassName)} style={style}>
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
