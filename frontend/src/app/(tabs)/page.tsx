"use client";

import { useEffect, useMemo, useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { useLanguage } from "@/lib/language-context";
import { useProfile } from "@/lib/profile-context";
import { DocumentPicker } from "@/lib/document-picker";
import { Alert, Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from "@/lib/rn";
import { categories, services, type Service } from "@/data/service-catalog";
import { getMatchedServiceIds } from "@/data/profile-matching";
import { getLocalizedService } from "@/data/service-translations";
import { trainingPrograms, type TrainingProgram } from "@/data/training-programs";
import { jobOpportunities, type JobOpportunity } from "@/data/job-opportunities";

export default function HomeScreen() {
  const { isEnglish } = useLanguage();
  const { profile, isRegistered } = useProfile();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("popular");
  const [selected, setSelected] = useState<Service | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<TrainingProgram | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [scanFile, setScanFile] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<boolean | null>(null);
  const localized = useMemo(
    () => services.map((item) => getLocalizedService(item, isEnglish)),
    [isEnglish],
  );
  const availableForProfile = useMemo(
    () =>
      isRegistered
        ? getMatchedServiceIds(profile)
            .map((id) => localized.find((item) => item.id === id))
            .filter(Boolean)
        : [],
    [isRegistered, localized, profile],
  );
  const visible = useMemo(() => {
    const ids: Record<string, string[]> = {
      identity: ["nid", "birth"],
      education: ["training", "jobs"],
      support: ["social-support"],
      travel: ["passport"],
    };
    const byCategory =
      category === "popular"
        ? localized
        : localized.filter((item) => ids[category]?.includes(item.id));
    const term = query.trim().toLowerCase();
    return term
      ? byCategory.filter((item) =>
          `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(term),
        )
      : byCategory;
  }, [category, localized, query]);
  const openService = (service: Service) => {
    setSelected(service);
    setSelectedTraining(null);
    setSelectedJob(null);
    setChecked(new Set());
    setScanFile(null);
    setEligibility(null);
  };
  const closeDetails = () => {
    setSelected(null);
    setSelectedTraining(null);
    setSelectedJob(null);
    setScanFile(null);
    setEligibility(null);
  };
  const scanTrainingDocuments = async () => {
    if (!selectedTraining) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setScanFile(asset.name);
      const age = Number(profile.age);
      const ageOk = age >= selectedTraining.ageMin && age <= selectedTraining.ageMax;
      const citizenOk = Boolean(profile.isBangladeshi);
      const identityOk =
        Boolean(profile.nidVerified) || /nid|জাতীয়|identity|birth|জন্ম/i.test(asset.name);
      setEligibility(isRegistered && citizenOk && ageOk && identityOk);
    } catch {
      Alert.alert(
        isEnglish ? "Scan failed" : "স্ক্যান করা যায়নি",
        isEnglish
          ? "Please choose a clear PDF or image of your document."
          : "ডকুমেন্টের পরিষ্কার PDF অথবা ছবি বেছে নিন।",
      );
    }
  };
  const scanJobDocuments = async () => {
    if (!selectedJob) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setScanFile(asset.name);
      const age = Number(profile.age);
      const ageOk = age >= selectedJob.ageMin && age <= selectedJob.ageMax;
      const citizenOk = Boolean(profile.isBangladeshi);
      const identityOk =
        Boolean(profile.nidVerified) || /nid|জাতীয়|identity|birth|জন্ম/i.test(asset.name);
      const educationOk = Boolean(profile.education?.trim());
      setEligibility(isRegistered && citizenOk && ageOk && identityOk && educationOk);
    } catch {
      Alert.alert(
        isEnglish ? "Scan failed" : "স্ক্যান করা যায়নি",
        isEnglish
          ? "Please choose a clear certificate, NID, birth certificate, or PDF."
          : "পরিষ্কার certificate, NID, জন্মসনদ অথবা PDF বেছে নিন।",
      );
    }
  };
  const openOfficial = (url: string) =>
    Linking.openURL(url).catch(() =>
      Alert.alert(
        isEnglish ? "Could not open source" : "উৎস খোলা যায়নি",
        isEnglish ? "Please try again." : "আবার চেষ্টা করুন।",
      ),
    );

  return (
    <ScreenContainer className="bg-[#F5F8F7]" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-5 pb-5 pt-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[13px] text-[#5D736D]">
                {isEnglish ? "Good morning" : "শুভ সকাল"}
              </Text>
              <Text className="mt-1 text-[24px] font-bold text-[#102A2A]">Janasheba AI</Text>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert(
                  isEnglish ? "Available for you" : "আপনার জন্য available সেবা",
                  !isRegistered
                    ? isEnglish
                      ? "Register or Sign in from Profile to receive personalized service notifications."
                      : "ব্যক্তিগত সেবার notification পেতে Profile থেকে Register অথবা Sign in করুন।"
                    : availableForProfile.length
                      ? availableForProfile
                          .map((item) =>
                            isEnglish
                              ? `${item!.title} — available for you. You can apply if you want.`
                              : `${item!.title} — এই সেবাটি আপনার জন্য available আছে। আপনি চাইলে আবেদন করতে পারেন।`,
                          )
                          .join("\n\n")
                      : isEnglish
                        ? "Complete your Profile to find matching services."
                        : "ম্যাচ হওয়া সেবা দেখতে Profile-এর তথ্য পূরণ করুন।",
                )
              }
              style={styles.circle}
            >
              <Text className="text-[16px] text-[#0F766E]">◔</Text>
            </Pressable>
          </View>
          <View className="mt-5 rounded-[26px] bg-[#0F766E] px-5 pb-5 pt-6">
            <Text className="text-[12px] font-semibold uppercase tracking-[1.4px] text-[#BCE9DF]">
              {isEnglish ? "Government information" : "সরকারি তথ্য"}
            </Text>
            <Text className="mt-2 text-[23px] font-bold leading-[31px] text-white">
              {isEnglish ? "Find a service yourself" : "নিজে সরকারি সেবা খুঁজুন"}
            </Text>
            <Text className="mt-2 text-[13px] leading-[20px] text-[#D7F4ED]">
              {isEnglish
                ? "Search by service, document, or topic."
                : "সেবা, ডকুমেন্ট অথবা বিষয় দিয়ে খুঁজুন।"}
            </Text>
            <View className="mt-5 flex-row items-center rounded-2xl bg-white px-3 py-2">
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={
                  isEnglish
                    ? "Search NID, passport, birth registration…"
                    : "NID, পাসপোর্ট, জন্মনিবন্ধন খুঁজুন…"
                }
                placeholderTextColor="#7B908A"
                className="min-h-[40px] flex-1 px-1 text-[13px] text-[#173531]"
              />
              <Text className="text-[18px] text-[#0F766E]">⌕</Text>
            </View>
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setQuery(isEnglish ? "NID" : "NID ঠিক করতে চাই")}
              style={styles.chip}
            >
              <Text className="text-[11px] text-[#34635B]">
                {isEnglish ? "NID correction" : "NID ঠিক করতে চাই"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setQuery(isEnglish ? "passport" : "পাসপোর্ট")}
              style={styles.chip}
            >
              <Text className="text-[11px] text-[#34635B]">
                {isEnglish ? "Passport" : "পাসপোর্ট"}
              </Text>
            </Pressable>
          </View>
        </View>
        <View className="mb-5">
          <View className="mb-3 flex-row items-center justify-between px-5">
            <Text className="text-[17px] font-bold text-[#183330]">
              {isEnglish ? "Browse by topic" : "বিষয় ধরে খুঁজুন"}
            </Text>
            <Pressable
              onPress={() => {
                setCategory("popular");
                setQuery("");
              }}
            >
              <Text className="text-[11px] text-[#6E8580]">
                {isEnglish ? "See all →" : "সবগুলো দেখুন →"}
              </Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {categories.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={[styles.category, category === item.id && styles.activeCategory]}
              >
                <Text
                  className={
                    category === item.id ? "text-[20px] text-white" : "text-[20px] text-[#0F766E]"
                  }
                >
                  {item.icon}
                </Text>
                <Text
                  className={
                    category === item.id
                      ? "mt-2 text-[11px] font-semibold text-white"
                      : "mt-2 text-[11px] font-semibold text-[#3D5A54]"
                  }
                >
                  {isEnglish
                    ? (
                        {
                          popular: "Popular",
                          identity: "Identity",
                          education: "Skills",
                          support: "Support",
                          travel: "Travel",
                        } as Record<string, string>
                      )[item.id]
                    : item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <View className="px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[17px] font-bold text-[#183330]">
                {isEnglish ? "Government services" : "সরকারি সেবাসমূহ"}
              </Text>
              <Text className="mt-1 text-[11px] text-[#71857F]">
                {isEnglish
                  ? "Open a card for documents and steps"
                  : "কাগজপত্র ও ধাপ দেখতে card খুলুন"}
              </Text>
            </View>
            <Text className="rounded-full bg-[#E2F3EE] px-2.5 py-1 text-[10px] font-bold text-[#0F766E]">
              {visible.length}
            </Text>
          </View>
          {visible.map((service) => (
            <Pressable
              key={service.id}
              onPress={() => openService(service)}
              style={({ pressed }) => [styles.service, pressed && styles.pressed]}
            >
              <View className="flex-row items-start">
                <View
                  className="mr-3 h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${service.accent}18` }}
                >
                  <Text style={{ color: service.accent }}>▣</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[10px] font-bold uppercase"
                    style={{ color: service.accent }}
                  >
                    {service.category}
                  </Text>
                  <Text className="mt-1 text-[16px] font-bold text-[#173531]">{service.title}</Text>
                  <Text className="mt-1 text-[12px] leading-[18px] text-[#71857F]">
                    {service.description}
                  </Text>
                </View>
                <Text className="text-[21px] text-[#9BB0AA]">›</Text>
              </View>
              <View className="mt-4 flex-row border-t border-[#EEF3F1] pt-3">
                <Text className="flex-1 text-[11px] text-[#6A817A]">
                  {isEnglish
                    ? `${service.documents.length} documents`
                    : `কাগজ লাগবে ${service.documents.length}টি`}
                </Text>
                <Text className="text-[11px] font-bold text-[#0F766E]">
                  {isEnglish ? "View guide →" : "গাইড দেখুন →"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="slide"
        onRequestClose={closeDetails}
      >
        <View className="flex-1 justify-end bg-black/35">
          <View className="max-h-[90%] rounded-t-[30px] bg-[#F8FBFA] px-5 pb-8 pt-3">
            <View className="mb-4 items-center">
              <View className="h-1.5 w-12 rounded-full bg-[#C9DAD5]" />
            </View>
            <ScrollView>
              {selected ? (
                <View>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      <Text
                        className="text-[10px] font-bold uppercase"
                        style={{ color: selected.accent }}
                      >
                        {selected.category}
                      </Text>
                      <Text className="mt-1 text-[23px] font-bold text-[#173531]">
                        {selected.title}
                      </Text>
                      <Text className="mt-2 text-[13px] leading-[20px] text-[#6A817A]">
                        {selected.description}
                      </Text>
                    </View>
                    <Pressable onPress={closeDetails} style={styles.close}>
                      <Text className="text-[18px] text-[#54716A]">×</Text>
                    </Pressable>
                  </View>
                  {selected.id === "training" ? (
                    <TrainingContent
                      isEnglish={isEnglish}
                      selectedTraining={selectedTraining}
                      setSelectedTraining={(program) => {
                        setSelectedTraining(program);
                        setScanFile(null);
                        setEligibility(null);
                      }}
                      scanFile={scanFile}
                      eligibility={eligibility}
                      onScan={scanTrainingDocuments}
                      onOpenOfficial={openOfficial}
                    />
                  ) : selected.id === "jobs" ? (
                    <JobsContent
                      isEnglish={isEnglish}
                      selectedJob={selectedJob}
                      setSelectedJob={(job) => {
                        setSelectedJob(job);
                        setScanFile(null);
                        setEligibility(null);
                      }}
                      scanFile={scanFile}
                      eligibility={eligibility}
                      onScan={scanJobDocuments}
                      onOpenOfficial={openOfficial}
                    />
                  ) : (
                    <ServiceContent
                      selected={selected}
                      checked={checked}
                      setChecked={setChecked}
                      isEnglish={isEnglish}
                      onOpenOfficial={openOfficial}
                    />
                  )}
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
function ServiceContent({
  selected,
  checked,
  setChecked,
  isEnglish,
  onOpenOfficial,
}: {
  selected: Service;
  checked: Set<string>;
  setChecked: (next: Set<string>) => void;
  isEnglish: boolean;
  onOpenOfficial: (url: string) => void;
}) {
  if (selected.programs?.length || selected.options?.length) {
    return (
      <DynamicServiceContent
        selected={selected}
        checked={checked}
        setChecked={setChecked}
        isEnglish={isEnglish}
        onOpenOfficial={onOpenOfficial}
      />
    );
  }
  return (
    <LegacyServiceContent
      selected={selected}
      checked={checked}
      setChecked={setChecked}
      isEnglish={isEnglish}
      onOpenOfficial={onOpenOfficial}
    />
  );
}

type DetailTab = "eligibility" | "documents" | "process";

function DynamicServiceContent({
  selected,
  isEnglish,
  onOpenOfficial,
}: {
  selected: Service;
  checked: Set<string>;
  setChecked: (next: Set<string>) => void;
  isEnglish: boolean;
  onOpenOfficial: (url: string) => void;
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("eligibility");

  useEffect(() => {
    setSelectedOptionId(null);
    setActiveTab("eligibility");
  }, [selected.id]);

  const programs = selected.programs ?? [];
  const options = selected.options ?? [];
  const selectedProgram = programs.find((program) => program.id === selectedOptionId);
  const selectedOption = options.find((option) => option.id === selectedOptionId);
  const tabs: DetailTab[] = selectedProgram?.tabs?.filter((tab): tab is DetailTab =>
    ["eligibility", "documents", "process"].includes(tab),
  ) ??
    selectedOption?.tabs?.filter((tab): tab is DetailTab =>
      ["eligibility", "documents", "process"].includes(tab),
    ) ?? ["eligibility", "documents", "process"];
  const currentTitle = selectedProgram?.title ?? selectedOption?.title;

  const choose = (id: string) => {
    setSelectedOptionId(id);
    setActiveTab("eligibility");
  };

  if (!selectedOptionId || (!selectedProgram && !selectedOption)) {
    return (
      <>
        <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">
          {isEnglish
            ? programs.length
              ? "Available support categories"
              : "Available options"
            : programs.length
              ? "উপলব্ধ সহায়তার বিভাগ"
              : "উপলব্ধ অপশন"}
        </Text>
        {(programs.length ? programs : options).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => choose(item.id)}
            style={({ pressed }) => [styles.trainingCard, pressed && styles.pressed]}
          >
            <Text className="text-[15px] font-bold text-[#173531]">{item.title}</Text>
            <Text className="mt-2 text-[12px] leading-[18px] text-[#71857F]">
              {"summary" in item ? item.summary : item.description}
            </Text>
            <Text className="mt-3 text-[11px] font-bold text-[#0F766E]">
              {isEnglish ? "View details →" : "বিস্তারিত দেখুন →"}
            </Text>
          </Pressable>
        ))}
      </>
    );
  }

  const content = selectedProgram ?? selectedOption;
  if (!content) return null;
  const list =
    activeTab === "eligibility"
      ? content.eligibility
      : activeTab === "documents"
        ? content.requiredDocuments
        : content.applicationProcess;

  return (
    <>
      <Pressable onPress={() => setSelectedOptionId(null)}>
        <Text className="mt-5 text-[12px] font-bold text-[#0F766E]">
          ‹ {isEnglish ? "All options" : "সব অপশন"}
        </Text>
      </Pressable>
      <Text className="mt-4 text-[21px] font-bold text-[#173531]">{currentTitle}</Text>
      <View className="mt-5 flex-row gap-2">
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={activeTab === tab ? styles.activeTab : styles.tab}
          >
            <Text
              className={
                activeTab === tab
                  ? "text-[11px] font-bold text-white"
                  : "text-[11px] font-bold text-[#54716A]"
              }
            >
              {tab === "eligibility"
                ? isEnglish
                  ? "Eligibility"
                  : "যোগ্যতা"
                : tab === "documents"
                  ? isEnglish
                    ? "Documents"
                    : "ডকুমেন্ট"
                  : isEnglish
                    ? "Process"
                    : "প্রক্রিয়া"}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">
        {activeTab === "eligibility"
          ? isEnglish
            ? "Eligibility"
            : "যোগ্যতা"
          : activeTab === "documents"
            ? isEnglish
              ? "Required documents"
              : "প্রয়োজনীয় কাগজপত্র"
            : isEnglish
              ? "Application process"
              : "আবেদন প্রক্রিয়া"}
      </Text>
      {list.map((item, index) => (
        <View key={item} className="mb-3 flex-row">
          <Text className="mr-3 font-bold text-[#0F766E]">
            {activeTab === "process" ? `${index + 1}.` : "•"}
          </Text>
          <Text className="flex-1 text-[13px] leading-[19px] text-[#526C65]">{item}</Text>
        </View>
      ))}
      <Pressable
        onPress={() => onOpenOfficial(`https://${content.officialSource}`)}
        style={styles.primary}
      >
        <Text className="font-bold text-white">
          {isEnglish ? "Open official source ↗" : "অফিসিয়াল উৎস খুলুন ↗"}
        </Text>
      </Pressable>
    </>
  );
}

function LegacyServiceContent({
  selected,
  checked,
  setChecked,
  isEnglish,
  onOpenOfficial,
}: {
  selected: Service;
  checked: Set<string>;
  setChecked: (next: Set<string>) => void;
  isEnglish: boolean;
  onOpenOfficial: (url: string) => void;
}) {
  const renderPrograms = () =>
    (selected.programs ?? []).map((program) => (
      <View key={program.id} className="mb-4 rounded-2xl border border-[#DCEAE5] bg-white p-3">
        <Text className="text-[12px] font-bold uppercase text-[#0F766E]">{program.department}</Text>
        <Text className="mt-2 text-[15px] font-bold text-[#173531]">{program.title}</Text>
        <Text className="mt-2 text-[12px] leading-[18px] text-[#526C65]">{program.summary}</Text>
        <Text className="mt-3 text-[12px] font-bold text-[#183330]">
          {isEnglish ? "Eligibility" : "যোগ্যতা"}
        </Text>
        {program.eligibility.map((item) => (
          <Text key={item} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">
            • {item}
          </Text>
        ))}
        <Text className="mt-3 text-[12px] font-bold text-[#183330]">
          {isEnglish ? "Required documents" : "প্রয়োজনীয় কাগজপত্র"}
        </Text>
        {program.requiredDocuments.map((document) => (
          <Text key={document} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">
            • {document}
          </Text>
        ))}
        <Text className="mt-3 text-[12px] font-bold text-[#183330]">
          {isEnglish ? "Application process" : "আবেদন প্রক্রিয়া"}
        </Text>
        {program.applicationProcess.map((step, index) => (
          <Text key={step} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">
            {index + 1}. {step}
          </Text>
        ))}
      </View>
    ));

  const renderOptions = () =>
    (selected.options ?? []).map((option) => (
      <View key={option.id} className="mb-4 rounded-2xl border border-[#DCEAE5] bg-white p-3">
        <Text className="text-[12px] font-bold uppercase text-[#0F766E]">{option.title}</Text>
        <Text className="mt-2 text-[12px] leading-[18px] text-[#526C65]">{option.description}</Text>
        <Text className="mt-3 text-[12px] font-bold text-[#183330]">
          {isEnglish ? "Eligibility" : "যোগ্যতা"}
        </Text>
        {option.eligibility.map((item) => (
          <Text key={item} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">
            • {item}
          </Text>
        ))}
        <Text className="mt-3 text-[12px] font-bold text-[#183330]">
          {isEnglish ? "Required documents" : "প্রয়োজনীয় কাগজপত্র"}
        </Text>
        {option.requiredDocuments.map((document) => (
          <Text key={document} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">
            • {document}
          </Text>
        ))}
        <Text className="mt-3 text-[12px] font-bold text-[#183330]">
          {isEnglish ? "Application process" : "আবেদন প্রক্রিয়া"}
        </Text>
        {option.applicationProcess.map((step, index) => (
          <Text key={step} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">
            {index + 1}. {step}
          </Text>
        ))}
      </View>
    ));

  return (
    <>
      {selected.id === "social-support" ? (
        <>
          <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">
            {isEnglish ? "Government support programmes" : "সরকারি সহায়তা কর্মসূচি"}
          </Text>
          {renderPrograms()}
        </>
      ) : null}
      {selected.id === "nid" || selected.id === "birth" ? (
        <>
          <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">
            {isEnglish ? "Main options" : "প্রধান অপশন"}
          </Text>
          {renderOptions()}
        </>
      ) : null}
      <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">
        {isEnglish ? "Required documents" : "প্রয়োজনীয় কাগজপত্র"}
      </Text>
      {selected.documents.map((doc) => (
        <Pressable
          key={doc}
          onPress={() => {
            const next = new Set(checked);
            if (next.has(doc)) next.delete(doc);
            else next.add(doc);
            setChecked(next);
          }}
          style={styles.document}
        >
          <View
            className={
              checked.has(doc)
                ? "h-6 w-6 items-center justify-center rounded-lg bg-[#0F766E]"
                : "h-6 w-6 rounded-lg border border-[#B9CDC7] bg-white"
            }
          >
            {checked.has(doc) ? <Text className="text-center font-bold text-white">✓</Text> : null}
          </View>
          <Text className="ml-3 flex-1 text-[13px] text-[#27453F]">{doc}</Text>
        </Pressable>
      ))}
      <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">
        {isEnglish ? "Application steps" : "আবেদনের ধাপ"}
      </Text>
      {selected.steps.map((step, index) => (
        <View key={step} className="mb-3 flex-row">
          <Text className="mr-3 font-bold text-[#0F766E]">{index + 1}.</Text>
          <Text className="flex-1 text-[13px] leading-[19px] text-[#526C65]">{step}</Text>
        </View>
      ))}
      <Pressable
        onPress={() => onOpenOfficial(`https://${selected.officialSource}`)}
        style={styles.primary}
      >
        <Text className="font-bold text-white">
          {isEnglish ? "Open official source ↗" : "অফিসিয়াল উৎস খুলুন ↗"}
        </Text>
      </Pressable>
    </>
  );
}
function TrainingContent({
  isEnglish,
  selectedTraining,
  setSelectedTraining,
  scanFile,
  eligibility,
  onScan,
  onOpenOfficial,
}: {
  isEnglish: boolean;
  selectedTraining: TrainingProgram | null;
  setSelectedTraining: (program: TrainingProgram | null) => void;
  scanFile: string | null;
  eligibility: boolean | null;
  onScan: () => void;
  onOpenOfficial: (url: string) => void;
}) {
  if (!selectedTraining)
    return (
      <>
        <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">
          {isEnglish ? "Available government training" : "উপলব্ধ সরকারি প্রশিক্ষণ"}
        </Text>
        {trainingPrograms.map((program) => (
          <Pressable
            key={program.id}
            onPress={() => setSelectedTraining(program)}
            style={styles.trainingCard}
          >
            <Text className="text-[10px] font-bold uppercase" style={{ color: program.accent }}>
              {program.provider}
            </Text>
            <Text className="mt-1 text-[15px] font-bold text-[#173531]">{program.title}</Text>
            <Text className="mt-1 text-[12px] leading-[18px] text-[#71857F]">
              {program.summary}
            </Text>
            <Text className="mt-3 text-[11px] font-bold text-[#0F766E]">
              {isEnglish
                ? `Age ${program.ageMin}–${program.ageMax} • View details →`
                : `বয়স ${program.ageMin}–${program.ageMax} • বিস্তারিত দেখুন →`}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={() => onOpenOfficial("https://dyd.gov.bd")} style={styles.primary}>
          <Text className="font-bold text-white">
            {isEnglish ? "Open official training source ↗" : "Official training source খুলুন ↗"}
          </Text>
        </Pressable>
      </>
    );
  return (
    <>
      <Pressable onPress={() => setSelectedTraining(null)}>
        <Text className="mt-5 text-[12px] font-bold text-[#0F766E]">
          ‹ {isEnglish ? "All training" : "সব প্রশিক্ষণ"}
        </Text>
      </Pressable>
      <Text className="mt-4 text-[21px] font-bold text-[#173531]">{selectedTraining.title}</Text>
      <Text className="mt-1 text-[12px] text-[#71857F]">
        {selectedTraining.provider} •{" "}
        {isEnglish
          ? `Age ${selectedTraining.ageMin}–${selectedTraining.ageMax}`
          : `বয়স ${selectedTraining.ageMin}–${selectedTraining.ageMax}`}
      </Text>
      <Text className="mt-4 text-[13px] leading-[20px] text-[#526C65]">
        {selectedTraining.summary}
      </Text>
      <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">
        {isEnglish ? "Application requirements" : "আবেদনের requirement"}
      </Text>
      {selectedTraining.requiredDocuments.map((doc) => (
        <View key={doc} className="mb-2 flex-row items-center">
          <Text className="mr-2 text-[#0F766E]">✓</Text>
          <Text className="text-[13px] text-[#27453F]">{doc}</Text>
        </View>
      ))}
      <View className="mt-5 rounded-2xl border border-[#BFE2D6] bg-[#EAF8F3] p-4">
        <Text className="text-[14px] font-bold text-[#1B5E54]">
          {isEnglish
            ? "Scan documents to check eligibility"
            : "ডকুমেন্ট scan করে যোগ্যতা যাচাই করুন"}
        </Text>
        <Text className="mt-1 text-[12px] leading-[18px] text-[#528077]">
          {isEnglish
            ? "Upload a clear NID, birth registration, or certificate image/PDF. We will compare it with this training’s basic requirements."
            : "পরিষ্কার NID, জন্মনিবন্ধন বা certificate-এর ছবি/PDF দিন। আমরা এই training-এর basic requirement-এর সঙ্গে মিলিয়ে দেখব।"}
        </Text>
        <Pressable onPress={onScan} style={styles.scan}>
          <Text className="font-bold text-[#0F766E]">
            ▧{" "}
            {scanFile
              ? isEnglish
                ? "Scan another document"
                : "আরেকটি document scan করুন"
              : isEnglish
                ? "Scan / upload document"
                : "Document scan / upload করুন"}
          </Text>
        </Pressable>
        {scanFile ? <Text className="mt-2 text-[11px] text-[#528077]">{scanFile}</Text> : null}
        {eligibility !== null ? (
          <View
            className={
              eligibility ? "mt-4 rounded-xl bg-[#D8F5E8] p-3" : "mt-4 rounded-xl bg-[#FDE8E7] p-3"
            }
          >
            <Text className={eligibility ? "font-bold text-[#087443]" : "font-bold text-[#B42318]"}>
              {eligibility
                ? isEnglish
                  ? "Eligible: You can apply."
                  : "যোগ্য: আপনি আবেদন করতে পারেন।"
                : isEnglish
                  ? "Not eligible yet: age, citizenship, or document requirement did not match."
                  : "এখনও যোগ্য নন: বয়স, নাগরিকত্ব অথবা document requirement মেলেনি।"}
            </Text>
            <Text className="mt-1 text-[11px] text-[#52736A]">
              {isEnglish
                ? "This is a preliminary check; the official authority makes the final decision."
                : "এটি প্রাথমিক যাচাই; চূড়ান্ত সিদ্ধান্ত সরকারি কর্তৃপক্ষের।"}
            </Text>
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={() => onOpenOfficial(selectedTraining.applicationUrl)}
        style={styles.primary}
      >
        <Text className="font-bold text-white">
          {eligibility
            ? isEnglish
              ? "Apply on official website ↗"
              : "Official website-এ আবেদন করুন ↗"
            : isEnglish
              ? "Open official source ↗"
              : "Official source খুলুন ↗"}
        </Text>
      </Pressable>
    </>
  );
}
const styles = {
  circle: {
    height: 42,
    width: 42,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 21,
    backgroundColor: "#E3F3EE",
  },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D5E8E2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  category: {
    width: 78,
    height: 82,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0ECE8",
    backgroundColor: "#FFFFFF",
  },
  activeCategory: { borderColor: "#0F766E", backgroundColor: "#0F766E" },
  service: {
    marginBottom: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5EFEC",
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  trainingCard: {
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCEAE5",
    backgroundColor: "#FFFFFF",
    padding: 15,
  },
  tab: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCEAE5",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
  },
  activeTab: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "#0F766E",
    paddingHorizontal: 8,
  },
  close: {
    height: 36,
    width: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 18,
    backgroundColor: "#EAF2EF",
  },
  document: {
    minHeight: 47,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3F1",
  },
  primary: {
    marginTop: 18,
    height: 48,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 15,
    backgroundColor: "#0F766E",
  },
  scan: {
    marginTop: 14,
    minHeight: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BFE2D6",
    backgroundColor: "#fff",
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
};

function JobsContent({
  isEnglish,
  selectedJob,
  setSelectedJob,
  scanFile,
  eligibility,
  onScan,
  onOpenOfficial,
}: {
  isEnglish: boolean;
  selectedJob: JobOpportunity | null;
  setSelectedJob: (job: JobOpportunity | null) => void;
  scanFile: string | null;
  eligibility: boolean | null;
  onScan: () => void;
  onOpenOfficial: (url: string) => void;
}) {
  if (!selectedJob)
    return (
      <>
        <View className="mt-5 rounded-2xl border border-[#BFE2D6] bg-[#EAF8F3] p-4">
          <Text className="text-[14px] font-bold text-[#1B5E54]">
            {isEnglish ? "Current government job notices" : "চলমান সরকারি চাকরির বিজ্ঞপ্তি"}
          </Text>
          <Text className="mt-1 text-[12px] leading-[18px] text-[#528077]">
            {isEnglish
              ? "Review the post, deadline, and eligibility here before applying."
              : "আবেদন করার আগে এখানেই পদ, deadline ও যোগ্যতা দেখে নিন।"}
          </Text>
        </View>
        {jobOpportunities.map((job) => (
          <Pressable key={job.id} onPress={() => setSelectedJob(job)} style={styles.trainingCard}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-[10px] font-bold uppercase" style={{ color: job.accent }}>
                  {job.organization}
                </Text>
                <Text className="mt-1 text-[15px] font-bold text-[#173531]">{job.title}</Text>
              </View>
              <Text className="rounded-full bg-[#FFF2E8] px-2 py-1 text-[10px] font-bold text-[#C2410C]">
                {job.status}
              </Text>
            </View>
            <Text className="mt-2 text-[12px] leading-[18px] text-[#71857F]">{job.summary}</Text>
            <View className="mt-3 flex-row justify-between">
              <Text className="text-[11px] font-bold text-[#B42318]">
                {isEnglish ? `Deadline: ${job.deadline}` : `আবেদনের শেষ সময়: ${job.deadline}`}
              </Text>
              <Text className="text-[11px] font-bold text-[#0F766E]">
                {isEnglish ? "View details →" : "বিস্তারিত দেখুন →"}
              </Text>
            </View>
          </Pressable>
        ))}
        <Pressable onPress={() => onOpenOfficial("https://bpsc.gov.bd")} style={styles.primary}>
          <Text className="font-bold text-white">
            {isEnglish
              ? "Verify all notices on official source ↗"
              : "Official source-এ সব বিজ্ঞপ্তি যাচাই করুন ↗"}
          </Text>
        </Pressable>
      </>
    );
  return (
    <>
      <Pressable onPress={() => setSelectedJob(null)}>
        <Text className="mt-5 text-[12px] font-bold text-[#0F766E]">
          ‹ {isEnglish ? "All job notices" : "সব চাকরির বিজ্ঞপ্তি"}
        </Text>
      </Pressable>
      <Text className="mt-4 text-[21px] font-bold text-[#173531]">{selectedJob.title}</Text>
      <Text className="mt-1 text-[12px] text-[#71857F]">{selectedJob.organization}</Text>
      <View className="mt-4 flex-row gap-2">
        <View className="flex-1 rounded-xl bg-[#FFF2E8] p-3">
          <Text className="text-[10px] text-[#9A5B14]">{isEnglish ? "Deadline" : "শেষ সময়"}</Text>
          <Text className="mt-1 text-[13px] font-bold text-[#B42318]">{selectedJob.deadline}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-[#EAF8F3] p-3">
          <Text className="text-[10px] text-[#528077]">{isEnglish ? "Age range" : "বয়সসীমা"}</Text>
          <Text className="mt-1 text-[13px] font-bold text-[#1B5E54]">
            {selectedJob.ageMin}–{selectedJob.ageMax}
          </Text>
        </View>
      </View>
      <Text className="mt-4 text-[13px] leading-[20px] text-[#526C65]">{selectedJob.summary}</Text>
      <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">
        {isEnglish ? "Eligibility and documents" : "যোগ্যতা ও প্রয়োজনীয় কাগজ"}
      </Text>
      <Text className="mb-2 text-[12px] text-[#526C65]">
        {isEnglish
          ? `Education: ${selectedJob.education}`
          : `শিক্ষাগত যোগ্যতা: ${selectedJob.education}`}
      </Text>
      {selectedJob.requiredDocuments.map((doc) => (
        <View key={doc} className="mb-2 flex-row items-center">
          <Text className="mr-2 text-[#0F766E]">✓</Text>
          <Text className="text-[13px] text-[#27453F]">{doc}</Text>
        </View>
      ))}
      <View className="mt-5 rounded-2xl border border-[#BFE2D6] bg-[#EAF8F3] p-4">
        <Text className="text-[14px] font-bold text-[#1B5E54]">
          {isEnglish ? "Scan before applying" : "আবেদনের আগে document scan করুন"}
        </Text>
        <Text className="mt-1 text-[12px] leading-[18px] text-[#528077]">
          {isEnglish
            ? "Scan your NID, birth certificate, or educational certificate. The app will compare your profile with this notice."
            : "NID, জন্মসনদ অথবা শিক্ষাগত certificate scan করুন। App আপনার profile-এর সঙ্গে এই বিজ্ঞপ্তির যোগ্যতা মিলিয়ে দেখবে।"}
        </Text>
        <Pressable onPress={onScan} style={styles.scan}>
          <Text className="font-bold text-[#0F766E]">
            ▧{" "}
            {scanFile
              ? isEnglish
                ? "Scan another document"
                : "আরেকটি document scan করুন"
              : isEnglish
                ? "Scan / upload document"
                : "Document scan / upload করুন"}
          </Text>
        </Pressable>
        {scanFile ? <Text className="mt-2 text-[11px] text-[#528077]">{scanFile}</Text> : null}
        {eligibility !== null ? (
          <View
            className={
              eligibility ? "mt-4 rounded-xl bg-[#D8F5E8] p-3" : "mt-4 rounded-xl bg-[#FDE8E7] p-3"
            }
          >
            <Text className={eligibility ? "font-bold text-[#087443]" : "font-bold text-[#B42318]"}>
              {eligibility
                ? isEnglish
                  ? "Eligible: You can apply for this job."
                  : "যোগ্য: আপনি এই চাকরির জন্য আবেদন করতে পারেন।"
                : isEnglish
                  ? "Not eligible yet: age, citizenship, education, or document requirement did not match."
                  : "এখনও যোগ্য নন: বয়স, নাগরিকত্ব, শিক্ষা অথবা document requirement মেলেনি।"}
            </Text>
            <Text className="mt-1 text-[11px] text-[#52736A]">
              {isEnglish
                ? "This is a preliminary check; the recruiting authority makes the final decision."
                : "এটি প্রাথমিক যাচাই; চূড়ান্ত সিদ্ধান্ত নিয়োগকারী কর্তৃপক্ষের।"}
            </Text>
          </View>
        ) : null}
      </View>
      <Pressable onPress={() => onOpenOfficial(selectedJob.applicationUrl)} style={styles.primary}>
        <Text className="font-bold text-white">
          {eligibility
            ? isEnglish
              ? "Apply on official website ↗"
              : "Official website-এ আবেদন করুন ↗"
            : isEnglish
              ? "Open official notice source ↗"
              : "Official notice source খুলুন ↗"}
        </Text>
      </Pressable>
    </>
  );
}
