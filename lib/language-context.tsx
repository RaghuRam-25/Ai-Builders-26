import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "bn" | "en";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  isEnglish: boolean;
};

const STORAGE_KEY = "janasheba-language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("bn");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "bn" || saved === "en") setLanguageState(saved);
    });
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(() => ({ language, setLanguage, isEnglish: language === "en" }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
