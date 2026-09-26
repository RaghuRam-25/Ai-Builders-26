"use client";

import { Pressable, Text, View } from "@/lib/rn";

import { ScreenContainer } from "@/components/screen-container";
import { useLanguage, type Language } from "@/lib/language-context";

/** Port of `app/(tabs)/settings.tsx` (Expo). */
export default function SettingsScreen() {
  const { language, setLanguage, isEnglish } = useLanguage();

  const chooseLanguage = (next: Language) => setLanguage(next);

  return (
    <ScreenContainer className="bg-[#F5F8F7] px-5" edges={["top", "left", "right"]}>
      <View className="pt-5">
        <Text className="text-[13px] font-medium text-[#5D736D]">{isEnglish ? "Personalize your experience" : "আপনার অভিজ্ঞতা নিজের মতো সাজান"}</Text>
        <Text className="mt-1 text-[28px] font-bold text-[#102A2A]">{isEnglish ? "Settings" : "সেটিংস"}</Text>

        <View className="mt-7 rounded-[26px] bg-[#0F766E] p-5">
          <Text className="text-[12px] font-semibold uppercase tracking-[1.4px] text-[#BCE9DF]">{isEnglish ? "Language" : "ভাষা"}</Text>
          <Text className="mt-2 text-[20px] font-bold text-white">{isEnglish ? "Choose your preferred language" : "আপনার পছন্দের ভাষা বেছে নিন"}</Text>
          <Text className="mt-2 text-[12px] leading-[19px] text-[#D7F4ED]">{isEnglish ? "You can change this anytime from Settings." : "আপনি যেকোনো সময় সেটিংস থেকে ভাষা পরিবর্তন করতে পারবেন।"}</Text>
        </View>

        <Text className="mb-3 mt-7 text-[16px] font-bold text-[#183330]">{isEnglish ? "App language" : "অ্যাপের ভাষা"}</Text>
        <View className="rounded-2xl border border-[#DCEAE5] bg-white p-2">
          <LanguageOption label="বাংলা" hint="Bangla" active={language === "bn"} onPress={() => chooseLanguage("bn")} />
          <LanguageOption label="English" hint="English" active={language === "en"} onPress={() => chooseLanguage("en")} />
        </View>

        <View className="mt-6 rounded-2xl border border-[#DCEAE5] bg-white p-4">
          <Text className="text-[13px] font-bold text-[#284A43]">{isEnglish ? "About Janasheba AI" : "জনসেবা AI সম্পর্কে"}</Text>
          <Text className="mt-2 text-[12px] leading-[19px] text-[#71857F]">{isEnglish ? "A citizen assistant for finding government services and preparing the right documents." : "সরকারি সেবা খুঁজে পাওয়া এবং সঠিক কাগজপত্র প্রস্তুত করার জন্য নাগরিক সহকারী।"}</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

function LanguageOption({ label, hint, active, onPress }: { label: string; hint: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }, styles.option]}>
      <View className={active ? "h-6 w-6 items-center justify-center rounded-full bg-[#0F766E]" : "h-6 w-6 items-center justify-center rounded-full border border-[#B9CDC7] bg-white"}>
        {active ? <View className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[14px] font-semibold text-[#284A43]">{label}</Text>
        <Text className="mt-0.5 text-[11px] text-[#71857F]">{hint}</Text>
      </View>
      {active ? <Text className="text-[13px] font-bold text-[#0F766E]">✓</Text> : null}
    </Pressable>
  );
}

const styles = {
  option: {
    minHeight: 64,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
};
