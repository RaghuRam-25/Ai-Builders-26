"use client";

/**
 * Key/value storage that matches the original app's AsyncStorage usage.
 * Web uses localStorage; on Capacitor (Android) it uses @capacitor/preferences
 * so the choice is a native preference rather than WebView storage.
 */

const memory = new Map<string, string>();

const isNative = () => {
  if (typeof window === "undefined") return false;
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
};

export async function getItem(key: string): Promise<string | null> {
  if (typeof window === "undefined") return memory.get(key) ?? null;
  try {
    if (isNative()) {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key });
      return value ?? null;
    }
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (typeof window === "undefined") {
    memory.set(key, value);
    return;
  }
  try {
    if (isNative()) {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key, value });
      return;
    }
    window.localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

export async function removeItem(key: string): Promise<void> {
  if (typeof window === "undefined") {
    memory.delete(key);
    return;
  }
  try {
    if (isNative()) {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key });
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    memory.delete(key);
  }
}
