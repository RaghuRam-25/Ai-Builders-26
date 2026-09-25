import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { useLanguage } from "@/lib/language-context";
import { trpc } from "@/lib/trpc";
import { services, type Service } from "@/shared/service-catalog";
import { getLocalizedService } from "@/shared/service-translations";

type Message = { id: string; role: "assistant" | "user"; text: string; serviceIds?: string[]; detailId?: string; attachment?: string };
type SpeechRecognitionLike = { lang: string; interimResults: boolean; maxAlternatives: number; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };

export default function HomeScreen() {
  const { isEnglish } = useLanguage();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [checkedDocuments, setCheckedDocuments] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const localizedServices = useMemo(() => services.map((service) => getLocalizedService(service, isEnglish)), [isEnglish]);
  const searchQuery = input.trim();
  const { data: backendMatches = [] } = trpc.government.search.useQuery({ query: searchQuery, limit: 3 }, { enabled: searchQuery.length >= 1 });
  const { data: backendContext } = trpc.government.context.useQuery({ query: searchQuery }, { enabled: searchQuery.length >= 1 });

  useEffect(() => {
    requestRecordingPermissionsAsync().catch(() => undefined);
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }).catch(() => undefined);
    setMessages([{ id: "welcome", role: "assistant", text: isEnglish ? "Hi! I am Janasheba AI. How are you? You can ask me anything. When your question is about a government service, I will show the relevant services and guide you step by step. You can also type, speak, or upload a document." : "হাই! আমি জনসেবা AI। কেমন আছেন? আপনি যেকোনো কথা জিজ্ঞেস করতে পারেন। আপনার প্রশ্ন সরকারি সেবা সম্পর্কিত হলে আমি প্রাসঙ্গিক সেবাগুলো দেখিয়ে ধাপে ধাপে সাহায্য করব। চাইলে টাইপ করুন, কথা বলুন অথবা ডকুমেন্ট আপলোড করুন।" }]);
  }, [isEnglish]);

  const findServices = (text: string) => {
    const normalized = text.trim();
    if (normalized.length > 0 && backendMatches.length > 0) {
      return backendMatches.slice(0, 3).map((service) => getLocalizedService(service, isEnglish));
    }

    const lowercase = normalized.toLowerCase();
    const matches = localizedServices.filter((service) => {
      const auditText = `${service.title} ${service.description} ${service.category} ${(service.programs ?? []).map((item) => `${item.title} ${item.department} ${item.summary}`).join(" ")} ${(service.options ?? []).map((item) => `${item.title} ${item.description}`).join(" ")}`.toLowerCase();
      return auditText.includes(lowercase) || (lowercase.includes("nid") && service.id === "nid") || (lowercase.includes("passport") && service.id === "passport") || (lowercase.includes("পাসপোর্ট") && service.id === "passport") || (lowercase.includes("জন্ম") && service.id === "birth") || (lowercase.includes("ভাতা") && service.id === "social-support") || (lowercase.includes("support") && service.id === "social-support");
    });
    return matches.slice(0, 3);
  };

  const sendMessage = (text = input, attachment?: string) => {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    const userText = trimmed || (isEnglish ? "Please help me understand this document." : "এই ডকুমেন্টটি বুঝিয়ে দিন।");
    const normalized = userText.toLowerCase();
    const matches = findServices(`${userText} ${attachment ?? ""}`);
    const detailId = backendContext?.optionId ?? backendContext?.programId;
    setSelectedDetailId(detailId ?? null);
    const isGreeting = /^(hi|hello|hey|হাই|হ্যালো|আসসালামু|সালাম)/i.test(normalized);
    const asksHow = normalized.includes("কেমন আছ") || normalized.includes("how are you");
    const asksServices = attachment || matches.length > 0 || ["সেবা", "সরকার", "আবেদন", "কিভাবে", "কীভাবে", "service", "government", "apply", "document"].some((word) => normalized.includes(word));
    const reply = attachment
      ? (isEnglish ? `I received “${attachment}”. I will help you understand it and connect it with the relevant government services. Open a service card below for the checklist and next steps.` : `“${attachment}” পেয়েছি। আমি এটি বুঝতে এবং প্রাসঙ্গিক সরকারি সেবার সঙ্গে মিলিয়ে দিতে সাহায্য করব। নিচের service card খুললে checklist ও পরবর্তী ধাপ পাবেন।`)
      : isGreeting
        ? (isEnglish ? "Hi! Nice to meet you. How are you today? Tell me whatever is on your mind—I am here to help." : "হাই! আপনার সঙ্গে কথা বলে ভালো লাগছে। আজ কেমন আছেন? আপনার যা মনে আছে বলুন—আমি সাহায্য করার জন্য আছি।")
        : asksHow
          ? (isEnglish ? "I am doing well and ready to help you. How are you? What would you like to know?" : "আমি ভালো আছি এবং আপনাকে সাহায্য করার জন্য প্রস্তুত। আপনি কেমন আছেন? কী জানতে চান?")
          : asksServices
            ? (isEnglish ? "Sure—I understand. These services may be related to your question. Open any card and I will show the documents, steps, and official source. You can ask me follow-up questions too." : "অবশ্যই—আমি বুঝতে পারছি। আপনার প্রশ্নের সঙ্গে এই সেবাগুলো সম্পর্কিত হতে পারে। যেকোনো card খুললে কাগজপত্র, ধাপ ও অফিসিয়াল উৎস দেখাব। আপনি follow-up প্রশ্নও করতে পারেন।")
            : (isEnglish ? "I understand. Tell me a little more and I will think it through with you. If it turns out to be a government-service matter, I will bring up the relevant options." : "বুঝতে পারছি। আরেকটু বলুন, আমি আপনার সঙ্গে বিষয়টি ভেবে দেখব। এটি সরকারি সেবা সংক্রান্ত হলে আমি প্রাসঙ্গিক options দেখিয়ে দেব।");

    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: userText, attachment }, { id: `assistant-${Date.now() + 1}`, role: "assistant", text: reply, detailId, serviceIds: asksServices ? (matches.length ? matches.map((service) => service.id) : localizedServices.slice(0, 3).map((service) => service.id)) : undefined }]);
    setInput("");
    setIsSending(true);
    setTimeout(() => setIsSending(false), 450);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
      if (!result.canceled) sendMessage("", result.assets[0].name);
    } catch {
      Alert.alert(isEnglish ? "Upload failed" : "আপলোড করা যায়নি", isEnglish ? "Please choose a PDF or image file and try again." : "PDF অথবা image file বেছে নিয়ে আবার চেষ্টা করুন।");
    }
  };

  const toggleVoice = async () => {
    try {
      if (Platform.OS === "web") {
        const speechWindow = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
        const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
        if (!Recognition) {
          Alert.alert(isEnglish ? "Voice input unavailable" : "ভয়েস ইনপুট পাওয়া যাচ্ছে না", isEnglish ? "Please use a browser with speech recognition support." : "Speech recognition সমর্থন করে এমন browser ব্যবহার করুন।");
          return;
        }
        const recognition = new Recognition();
        recognition.lang = isEnglish ? "en-US" : "bn-BD";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event) => { const transcript = event.results[0]?.[0]?.transcript ?? ""; setIsListening(false); if (transcript) sendMessage(transcript); };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        setIsListening(true);
        return;
      }
      if (recorderState.isRecording) {
        await recorder.stop();
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert(isEnglish ? "Microphone unavailable" : "মাইক্রোফোন পাওয়া যাচ্ছে না", isEnglish ? "Please allow microphone access and try again." : "মাইক্রোফোনের অনুমতি দিয়ে আবার চেষ্টা করুন।");
    }
  };

  const openService = (service: Service, detailId?: string) => {
    setSelectedService(service);
    setSelectedDetailId(detailId ?? selectedDetailId);
    setCheckedDocuments(new Set());
  };

  return (
    <ScreenContainer className="bg-[#F5F8F7]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="border-b border-[#E1ECE8] bg-white px-5 pb-3 pt-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center"><View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#0F766E]"><Text className="text-[18px] font-bold text-white">জ</Text></View><View><Text className="text-[17px] font-bold text-[#183330]">Janasheba AI</Text><Text className="text-[10px] text-[#71857F]">{isEnglish ? "Government information assistant" : "সরকারি তথ্য সহকারী"}</Text></View></View>
            <View className="rounded-full bg-[#E6F5F0] px-3 py-2"><Text className="text-[10px] font-bold text-[#0F766E]">{isEnglish ? "Online" : "সক্রিয়"}</Text></View>
          </View>
        </View>

        <ScrollView ref={scrollRef} className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
          <View className="mb-5 flex-row items-center justify-between"><View><Text className="text-[20px] font-bold text-[#183330]">{isEnglish ? "How can I help?" : "কীভাবে সাহায্য করতে পারি?"}</Text><Text className="mt-1 text-[11px] text-[#71857F]">{isEnglish ? "Ask about any government service" : "যেকোনো সরকারি সেবা সম্পর্কে জিজ্ঞেস করুন"}</Text></View><Text className="text-[20px] text-[#0F766E]">✦</Text></View>

          {messages.map((message) => <View key={message.id} className={message.role === "user" ? "mb-4 items-end" : "mb-5 items-start"}><View className={message.role === "user" ? "max-w-[86%] rounded-[20px] rounded-br-md bg-[#0F766E] px-4 py-3" : "max-w-[94%] rounded-[20px] rounded-bl-md border border-[#DCEAE5] bg-white px-4 py-4"}><Text className={message.role === "user" ? "text-[13px] leading-[20px] text-white" : "text-[13px] leading-[20px] text-[#36564E]"}>{message.text}</Text>{message.attachment ? <View className="mt-3 flex-row items-center rounded-xl bg-white/15 px-3 py-2"><Text className="mr-2 text-white">▧</Text><Text className="flex-1 text-[11px] text-white" numberOfLines={1}>{message.attachment}</Text></View> : null}</View>{message.role === "assistant" && message.serviceIds ? <View className="mt-3 w-full gap-2">{message.serviceIds.map((id) => { const service = localizedServices.find((item) => item.id === id); return service ? <Pressable key={service.id} onPress={() => openService(service)} style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}><View className="flex-row items-center"><View className="mr-3 h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${service.accent}18` }}><Text style={{ color: service.accent }}>▣</Text></View><View className="flex-1"><Text className="text-[10px] font-bold uppercase" style={{ color: service.accent }}>{service.category}</Text><Text className="mt-1 text-[14px] font-bold text-[#173531]">{service.title}</Text><Text className="mt-1 text-[11px] text-[#71857F]">{isEnglish ? "Open guidance and checklist" : "গাইড ও checklist খুলুন"}</Text></View><Text className="text-[20px] text-[#9BB0AA]">›</Text></View></Pressable> : null; })}</View> : null}</View>)}
          {isSending ? <View className="mb-3 self-start rounded-full bg-[#E5F2EE] px-3 py-2"><Text className="text-[11px] text-[#0F766E]">{isEnglish ? "Janasheba AI is thinking…" : "জনসেবা AI ভাবছে…"}</Text></View> : null}
        </ScrollView>

        <View className="border-t border-[#DCEAE5] bg-white px-4 pb-3 pt-3">
          <View className="mb-2 flex-row items-center"><Pressable onPress={pickDocument} style={({ pressed }) => [styles.composerIcon, pressed && styles.pressed]}><Text className="text-[18px] text-[#0F766E]">＋</Text></Pressable><Text className="ml-2 text-[11px] text-[#71857F]">{isEnglish ? "Attach a PDF or image" : "PDF বা image attach করুন"}</Text></View>
          <View className="flex-row items-end rounded-[20px] bg-[#F8FBFA] px-2 py-2"><TextInput value={input} onChangeText={setInput} onSubmitEditing={() => sendMessage()} placeholder={isEnglish ? "Message Janasheba AI…" : "জনসেবা AI-কে লিখুন…"} placeholderTextColor="#81958F" multiline className="max-h-[88px] min-h-[38px] flex-1 px-2 py-1 text-[13px] text-[#173531]" /><Pressable onPress={toggleVoice} style={({ pressed }) => [styles.composerIcon, (recorderState.isRecording || isListening) && styles.recordingIcon, pressed && styles.pressed]}><Text className={(recorderState.isRecording || isListening) ? "text-[15px] text-white" : "text-[15px] text-[#0F766E]"}>{(recorderState.isRecording || isListening) ? "■" : "●"}</Text></Pressable><Pressable onPress={() => sendMessage()} style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}><Text className="text-[17px] text-white">↑</Text></Pressable></View>
          <Text className="mt-2 text-center text-[10px] text-[#9AAEA8]">{isEnglish ? "Janasheba AI can make mistakes. Check official sources before applying." : "জনসেবা AI ভুল করতে পারে। আবেদন করার আগে অফিসিয়াল উৎস যাচাই করুন।"}</Text>
        </View>
      </KeyboardAvoidingView>

      <ServiceModalDetails service={selectedService} initialDetailId={selectedDetailId} isEnglish={isEnglish} checkedDocuments={checkedDocuments} onClose={() => setSelectedService(null)} onToggleDocument={(document) => setCheckedDocuments((current) => { const next = new Set(current); if (next.has(document)) next.delete(document); else next.add(document); return next; })} onOpenSource={(url) => url ? Linking.openURL(url) : selectedService && Linking.openURL(`https://${selectedService.officialSource}`)} onShare={() => selectedService && Share.share({ message: `${selectedService.title}\n${selectedService.documents.join(", ")}` })} />
    </ScreenContainer>
  );
}

function ServiceModalDetails({ service, initialDetailId, isEnglish, checkedDocuments, onClose, onToggleDocument, onOpenSource, onShare }: { service: Service | null; initialDetailId: string | null; isEnglish: boolean; checkedDocuments: Set<string>; onClose: () => void; onToggleDocument: (document: string) => void; onOpenSource: (url?: string) => void; onShare: () => void }) {
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(initialDetailId);
  const [activeDetailTab, setActiveDetailTab] = useState<"eligibility" | "documents" | "process">("eligibility");

  useEffect(() => {
    setSelectedDetailId(initialDetailId);
    setActiveDetailTab("eligibility");
  }, [initialDetailId, service?.id]);

  const renderSupportPrograms = () => (service?.programs ?? []).map((program) => (
    <View key={program.id} className="mb-4 rounded-2xl border border-[#DCEAE5] bg-white p-3">
      <Text className="text-[12px] font-bold uppercase text-[#0F766E]">{program.department}</Text>
      <Text className="mt-2 text-[15px] font-bold text-[#173531]">{program.title}</Text>
      <Text className="mt-2 text-[12px] leading-[18px] text-[#526C65]">{program.summary}</Text>
      <Text className="mt-3 text-[12px] font-bold text-[#183330]">{isEnglish ? "Eligibility" : "যোগ্যতা"}</Text>
      {program.eligibility.map((item) => <Text key={item} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">• {item}</Text>)}
      <Text className="mt-3 text-[12px] font-bold text-[#183330]">{isEnglish ? "Required documents" : "প্রয়োজনীয় কাগজপত্র"}</Text>
      {program.requiredDocuments.map((document) => <Text key={document} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">• {document}</Text>)}
      <Text className="mt-3 text-[12px] font-bold text-[#183330]">{isEnglish ? "Application process" : "আবেদন প্রক্রিয়া"}</Text>
      {program.applicationProcess.map((step, index) => <Text key={step} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">{index + 1}. {step}</Text>)}
    </View>
  ));

  const renderOptions = () => (service?.options ?? []).map((option) => (
    <View key={option.id} className="mb-4 rounded-2xl border border-[#DCEAE5] bg-white p-3">
      <Text className="text-[12px] font-bold uppercase text-[#0F766E]">{option.title}</Text>
      <Text className="mt-2 text-[12px] leading-[18px] text-[#526C65]">{option.description}</Text>
      <Text className="mt-3 text-[12px] font-bold text-[#183330]">{isEnglish ? "Eligibility" : "যোগ্যতা"}</Text>
      {option.eligibility.map((item) => <Text key={item} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">• {item}</Text>)}
      <Text className="mt-3 text-[12px] font-bold text-[#183330]">{isEnglish ? "Documents" : "ডকুমেন্ট"}</Text>
      {option.requiredDocuments.map((document) => <Text key={document} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">• {document}</Text>)}
      <Text className="mt-3 text-[12px] font-bold text-[#183330]">{isEnglish ? "Process" : "প্রক্রিয়া"}</Text>
      {option.applicationProcess.map((step, index) => <Text key={step} className="mt-1 text-[12px] leading-[18px] text-[#4E655F]">{index + 1}. {step}</Text>)}
      {option.trackingUrl ? <Text className="mt-3 text-[11px] text-[#0F766E]">{isEnglish ? "Tracking: " : "ট্র্যাকিং: "}{option.trackingUrl}</Text> : null}
    </View>
  ));

  const renderDynamicDetails = (item: NonNullable<Service["programs"]>[number] | NonNullable<Service["options"]>[number]) => {
    const values = activeDetailTab === "eligibility" ? item.eligibility : activeDetailTab === "documents" ? item.requiredDocuments : item.applicationProcess;
    return <>
      <Pressable onPress={() => setSelectedDetailId(null)}><Text className="mt-5 text-[12px] font-bold text-[#0F766E]">‹ {isEnglish ? "All options" : "সব অপশন"}</Text></Pressable>
      <Text className="mt-4 text-[21px] font-bold text-[#173531]">{item.title}</Text>
      <View className="mt-5 flex-row gap-2">{(["eligibility", "documents", "process"] as const).map((tab) => <Pressable key={tab} onPress={() => setActiveDetailTab(tab)} style={activeDetailTab === tab ? styles.activeTab : styles.tab}><Text className={activeDetailTab === tab ? "text-[11px] font-bold text-white" : "text-[11px] font-bold text-[#54716A]"}>{tab === "eligibility" ? (isEnglish ? "Eligibility" : "যোগ্যতা") : tab === "documents" ? (isEnglish ? "Documents" : "ডকুমেন্ট") : (isEnglish ? "Process" : "প্রক্রিয়া")}</Text></Pressable>)}</View>
      <Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">{activeDetailTab === "eligibility" ? (isEnglish ? "Eligibility" : "যোগ্যতা") : activeDetailTab === "documents" ? (isEnglish ? "Required documents" : "প্রয়োজনীয় কাগজপত্র") : (isEnglish ? "Application process" : "আবেদন প্রক্রিয়া")}</Text>
      {values.map((value, index) => <Text key={value} className="mb-2 text-[13px] leading-[19px] text-[#526C65]">{activeDetailTab === "process" ? `${index + 1}. ` : "• "}{value}</Text>)}
      <Pressable onPress={() => onOpenSource(`https://${item.officialSource}`)} style={styles.answerButton}><Text className="text-[13px] font-bold text-white">{isEnglish ? "Open official source ↗" : "অফিসিয়াল উৎস খুলুন ↗"}</Text></Pressable>
    </>;
  };

  const renderDynamicPrograms = () => {
    const selectedProgram = service?.programs?.find((program) => program.id === selectedDetailId);
    if (selectedProgram) return renderDynamicDetails(selectedProgram);
    return (service?.programs ?? []).map((program) => <Pressable key={program.id} onPress={() => { setSelectedDetailId(program.id); setActiveDetailTab("eligibility"); }} style={styles.serviceCard}><Text className="text-[15px] font-bold text-[#173531]">{program.title}</Text><Text className="mt-2 text-[12px] leading-[18px] text-[#71857F]">{program.summary}</Text><Text className="mt-3 text-[11px] font-bold text-[#0F766E]">{isEnglish ? "View details →" : "বিস্তারিত দেখুন →"}</Text></Pressable>);
  };

  const renderDynamicOptions = () => {
    const selectedOption = service?.options?.find((option) => option.id === selectedDetailId);
    if (selectedOption) return renderDynamicDetails(selectedOption);
    return (service?.options ?? []).map((option) => <Pressable key={option.id} onPress={() => { setSelectedDetailId(option.id); setActiveDetailTab("eligibility"); }} style={styles.serviceCard}><Text className="text-[15px] font-bold text-[#173531]">{option.title}</Text><Text className="mt-2 text-[12px] leading-[18px] text-[#71857F]">{option.description}</Text><Text className="mt-3 text-[11px] font-bold text-[#0F766E]">{isEnglish ? "View details →" : "বিস্তারিত দেখুন →"}</Text></Pressable>);
  };

  return <Modal visible={Boolean(service)} transparent animationType="slide" onRequestClose={onClose}><View className="flex-1 justify-end bg-black/35"><View className="max-h-[86%] rounded-t-[30px] bg-[#F8FBFA] px-5 pb-8 pt-3"><View className="mb-4 items-center"><View className="h-1.5 w-12 rounded-full bg-[#C9DAD5]" /></View><ScrollView>{service ? <View><View className="flex-row items-start justify-between"><View className="flex-1 pr-4"><Text className="text-[10px] font-bold uppercase" style={{ color: service.accent }}>{service.category}</Text><Text className="mt-1 text-[22px] font-bold text-[#173531]">{service.title}</Text><Text className="mt-2 text-[13px] leading-[20px] text-[#6A817A]">{service.description}</Text></View><Pressable onPress={onClose} style={styles.closeButton}><Text className="text-[18px] text-[#54716A]">×</Text></Pressable></View>
        {service.id === "social-support" ? <><Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">{isEnglish ? "Government support programmes" : "সরকারি সহায়তা কর্মসূচি"}</Text>{renderDynamicPrograms()}</> : null}
        {service.options ? <><Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">{isEnglish ? "Main options" : "প্রধান অপশন"}</Text>{renderDynamicOptions()}</> : null}
        {!service.programs && !service.options ? <><Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">{isEnglish ? "Required documents" : "প্রয়োজনীয় কাগজপত্র"}</Text>{service.documents.map((document) => <Pressable key={document} onPress={() => onToggleDocument(document)} style={styles.documentRow}><View className={checkedDocuments.has(document) ? "h-6 w-6 items-center justify-center rounded-lg bg-[#0F766E]" : "h-6 w-6 items-center justify-center rounded-lg border border-[#B9CDC7] bg-white"}>{checkedDocuments.has(document) ? <Text className="font-bold text-white">✓</Text> : null}</View><Text className="ml-3 flex-1 text-[13px] text-[#27453F]">{document}</Text></Pressable>)}<Text className="mb-3 mt-6 text-[16px] font-bold text-[#183330]">{isEnglish ? "Application steps" : "আবেদনের ধাপ"}</Text>{service.steps.map((step, index) => <View key={step} className="mb-3 flex-row"><Text className="mr-3 text-[12px] font-bold text-[#0F766E]">{index + 1}.</Text><Text className="flex-1 text-[13px] leading-[19px] text-[#526C65]">{step}</Text></View>)}<Pressable onPress={() => onOpenSource()} style={styles.answerButton}><Text className="text-[13px] font-bold text-white">{isEnglish ? "Open official source ↗" : "অফিসিয়াল উৎস খুলুন ↗"}</Text></Pressable><Pressable onPress={onShare} style={styles.shareButton}><Text className="text-[12px] font-semibold text-[#0F766E]">{isEnglish ? "Share this guide" : "এই গাইড শেয়ার করুন"}</Text></Pressable></> : null}</View> : null}</ScrollView></View></View></Modal>;
}

const styles = {
  composerIcon: { height: 36, width: 36, alignItems: "center" as const, justifyContent: "center" as const, borderRadius: 14, backgroundColor: "#E2F3EE" },
  recordingIcon: { backgroundColor: "#EA580C" },
  sendButton: { height: 36, width: 36, alignItems: "center" as const, justifyContent: "center" as const, borderRadius: 14, backgroundColor: "#0F766E" },
  serviceCard: { borderRadius: 17, borderWidth: 1, borderColor: "#DCEAE5", backgroundColor: "#FFFFFF", padding: 12 },
  tab: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, minHeight: 36, borderRadius: 12, borderWidth: 1, borderColor: "#DCEAE5", backgroundColor: "#FFFFFF", paddingHorizontal: 8 },
  activeTab: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, minHeight: 36, borderRadius: 12, backgroundColor: "#0F766E", paddingHorizontal: 8 },
  answerButton: { minHeight: 46, alignItems: "center" as const, justifyContent: "center" as const, borderRadius: 15, backgroundColor: "#0F766E" },
  shareButton: { alignItems: "center" as const, paddingTop: 14 },
  closeButton: { height: 36, width: 36, alignItems: "center" as const, justifyContent: "center" as const, borderRadius: 18, backgroundColor: "#EAF2EF" },
  documentRow: { minHeight: 47, flexDirection: "row" as const, alignItems: "center" as const, borderBottomWidth: 1, borderBottomColor: "#EDF3F1" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
};
