export type GovernmentProgram = {
  id: string;
  title: string;
  department: string;
  summary: string;
  eligibility: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  officialSource: string;
  applicationUrl: string;
  tabs?: string[];
};

export type GovernmentOption = {
  id: string;
  title: string;
  description: string;
  eligibility: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  officialSource: string;
  applicationUrl: string;
  trackingUrl?: string;
  tabs?: string[];
};

export type GovernmentService = {
  id: string;
  category: string;
  title: string;
  description: string;
  eta: string;
  documents: string[];
  steps: string[];
  officialSource: string;
  accent: string;
  programs?: GovernmentProgram[];
  options?: GovernmentOption[];
};

export const governmentServices: GovernmentService[] = [
  {
    id: "nid",
    category: "পরিচয় ও নাগরিকত্ব",
    title: "জাতীয় পরিচয়পত্র সংশোধন",
    description: "নতুন NID নিবন্ধন ও NID সংশোধনের জন্য প্রয়োজনীয় তথ্য, কাগজপত্র ও আবেদন প্রক্রিয়া দেখুন।",
    eta: "সাধারণত ৭–১৫ দিন",
    documents: ["বর্তমান NID-এর কপি", "সঠিক তথ্যের প্রমাণপত্র", "জন্মনিবন্ধন সনদ", "সাম্প্রতিক ছবি"],
    steps: ["প্রয়োজন অনুযায়ী সেবা নির্বাচন করুন", "কাগজপত্র প্রস্তুত করুন", "সরকারি অফিস/অনলাইন পোর্টালে আবেদন করুন", "অবস্থান/স্ট্যাটাস আপডেট দেখুন"],
    officialSource: "services.nidw.gov.bd",
    accent: "#0F766E",
    options: [
      {
        id: "new-registration",
        title: "New NID Registration",
        description: "নতুন জাতীয় পরিচয়পত্রের জন্য নিবন্ধন সেবা।",
        eligibility: ["বাংলাদেশের নাগরিক", "নতুন জন্ম নিবন্ধিত/ভূক্ত শিশু বা প্রাপ্তবয়স্ক", "অভিভাবকের/বাবার/মায়ের পরিচয়পত্র প্রযোজ্য হলে"],
        requiredDocuments: ["জন্মনিবন্ধন বা প্রাসঙ্গিক পরিচয়পত্র", "অভিভাবকের NID", "ঠিকানার প্রমাণ", "সাম্প্রতিক ছবি"],
        applicationProcess: ["অনলাইন/কার্যালয় থেকে আবেদন ফর্ম পূরণ করুন", "প্রয়োজনে biometric তথ্য দিন", "সংশ্লিষ্ট অফিস থেকে যাচাই সম্পন্ন করুন", "NID কার্ড সংগ্রহ বা status-সাথে আপডেট দেখুন"],
        officialSource: "services.nidw.gov.bd",
        applicationUrl: "https://services.nidw.gov.bd",
        trackingUrl: "https://services.nidw.gov.bd",
        tabs: ["eligibility", "documents", "process"],
      },
      {
        id: "correction",
        title: "NID Correction",
        description: "নাম, জন্মতারিখ, ঠিকানা বা সংশ্লিষ্ট তথ্য সংশোধনের জন্য আবেদন সেবা।",
        eligibility: ["বিদ্যমান NIDধারী নাগরিক", "সংশোধনযোগ্য তথ্যের সত্যতা নিশ্চিত", "সংশ্লিষ্ট অফিসে প্রয়োজনীয় কাগজপত্র জমা"],
        requiredDocuments: ["বর্তমান NID কপি", "সঠিক তথ্যের প্রমাণ", "জন্মনিবন্ধন/ভর্তি সনদ", "সাম্প্রতিক ছবি"],
        applicationProcess: ["সংশোধনের ধরন নির্বাচন করুন", "ট্র্যাক/আবেদন ফর্ম পূরণ করুন", "প্রয়োজনীয় কাগজপত্র দাখিল করুন", "ফলাফল/কার্ড আপডেট পর্যবেক্ষণ করুন"],
        officialSource: "services.nidw.gov.bd",
        applicationUrl: "https://services.nidw.gov.bd",
        trackingUrl: "https://services.nidw.gov.bd",
        tabs: ["eligibility", "documents", "process"],
      },
    ],
  },
  {
    id: "birth",
    category: "পরিচয় ও নাগরিকত্ব",
    title: "Birth Certificate সেবা",
    description: "নতুন জন্ম নিবন্ধন এবং জন্ম সনদ সংশোধনের জন্য তথ্য, কাগজপত্র ও ট্র্যাকিং নির্দেশনা দেখুন।",
    eta: "সাধারণত ৭–২১ দিন",
    documents: ["অভিভাবকের NID", "হাসপাতাল/টিকা কার্ড", "ঠিকানার প্রমাণ", "পূর্বের নিবন্ধনের তথ্য (যদি থাকে)"],
    steps: ["সেবা নির্বাচন করুন", "কাগজপত্র প্রস্তুত করুন", "ইউনিয়ন/পৌরসভা বা অনলাইন পোর্টালে আবেদন করুন", "সনদ সংগ্রহ/স্ট্যাটাস ট্র্যাক করুন"],
    officialSource: "bdris.gov.bd",
    accent: "#1D4ED8",
    options: [
      {
        id: "new-registration",
        title: "New Birth Registration",
        description: "নতুন জন্ম নিবন্ধনের জন্য আবেদন ও প্রক্রিয়া।",
        eligibility: ["জন্মের তথ্যের সঠিকতা নিশ্চিত করা", "অভিভাবকের পরিচয়পত্র থাকতে হবে", "স্থানীয় ইউনিয়ন/পৌরসভা বা অনলাইন পোর্টালে আবেদন"],
        requiredDocuments: ["অভিভাবকের NID", "হাসপাতাল/টিকা কার্ড", "অবস্থান প্রমাণ", "স্নাতক/পরিবারের প্রাসঙ্গিক নথি (যদি প্রয়োজন হয়)"],
        applicationProcess: ["ইউনিয়ন/পৌরসভা বা অফিসিয়াল পোর্টালে প্রয়োজনীয় ফর্ম পূরণ করুন", "জন্মের বিবরণ যাচাই করুন", "ফর্ম জমা দিন", "সনদ প্রস্তুত/সংগ্রহের তারিখ নিশ্চিত করুন"],
        officialSource: "bdris.gov.bd",
        applicationUrl: "https://bdris.gov.bd",
        trackingUrl: "https://bdris.gov.bd",
        tabs: ["eligibility", "documents", "process"],
      },
      {
        id: "correction",
        title: "Birth Certificate Correction",
        description: "নাম, জন্মতারিখ, পিতার/মাতার নাম বা অন্যান্য তথ্য সংশোধনের জন্য আবেদন।",
        eligibility: ["বিদ্যমান সনদধারী", "সংশোধনযোগ্য তথ্যের সত্যতা প্রমাণ করা", "উপযুক্ত অফিস/পোর্টালে আবেদন"],
        requiredDocuments: ["সংশোধন করা সনদ", "অভিভাবকের NID", "জন্মের প্রমাণ/হাসপাতাল নথি", "ঠিকানা/পরিবারের যাচাই"],
        applicationProcess: ["সংশোধন প্রকার নির্বাচন করুন", "প্রয়োজনীয় নথি জমা দিন", "অফিস/পোর্টাল যাচাই সম্পন্ন করুন", "সংশোধিত সনদ সংগ্রহ বা status ট্র্যাক করুন"],
        officialSource: "bdris.gov.bd",
        applicationUrl: "https://bdris.gov.bd",
        trackingUrl: "https://bdris.gov.bd",
        tabs: ["eligibility", "documents", "process"],
      },
    ],
  },
  {
    id: "passport",
    category: "ভ্রমণ",
    title: "ই-পাসপোর্ট আবেদন",
    description: "আবেদনের আগে ছবি, পরিচয় ও অ্যাপয়েন্টমেন্টের প্রস্তুতি নিন।",
    eta: "অ্যাপয়েন্টমেন্ট প্রয়োজন",
    documents: ["NID বা জন্মনিবন্ধন", "পাসপোর্ট ফি জমার তথ্য", "ঠিকানার তথ্য", "আগের পাসপোর্ট (প্রযোজ্য হলে)"],
    steps: ["অনলাইন ফর্ম পূরণ করুন", "ফি পরিশোধ করুন", "অ্যাপয়েন্টমেন্টে বায়োমেট্রিক দিন", "ডেলিভারি ট্র্যাক করুন"],
    officialSource: "epassport.gov.bd",
    accent: "#7C3AED",
    options: [
      {
        id: "new-application",
        title: "New Application",
        description: "প্রথমবার ই-পাসপোর্টের জন্য আবেদন।",
        eligibility: ["বাংলাদেশের নাগরিক", "বৈধ NID বা জন্মনিবন্ধন তথ্য"],
        requiredDocuments: ["NID বা জন্মনিবন্ধন", "ঠিকানার তথ্য", "ফি জমার তথ্য", "সাম্প্রতিক ছবি"],
        applicationProcess: ["অনলাইন ফর্ম পূরণ করুন", "ফি পরিশোধ করুন", "অ্যাপয়েন্টমেন্টে biometric দিন", "ডেলিভারি ট্র্যাক করুন"],
        officialSource: "epassport.gov.bd",
        applicationUrl: "https://www.epassport.gov.bd",
        tabs: ["eligibility", "documents", "process"],
      },
      {
        id: "renewal-reissue",
        title: "Renewal / Reissue",
        description: "মেয়াদ শেষ বা হারানো/ক্ষতিগ্রস্ত পাসপোর্ট পুনরায় ইস্যু।",
        eligibility: ["আগের পাসপোর্টধারী", "পুনরায় ইস্যুর কারণের প্রমাণ"],
        requiredDocuments: ["আগের পাসপোর্ট", "NID বা জন্মনিবন্ধন", "হারানো হলে জিডি/প্রমাণ", "ফি জমার তথ্য"],
        applicationProcess: ["Reissue কারণ নির্বাচন করুন", "ফর্ম ও ফি সম্পন্ন করুন", "অ্যাপয়েন্টমেন্টে biometric দিন", "ডেলিভারি স্ট্যাটাস দেখুন"],
        officialSource: "epassport.gov.bd",
        applicationUrl: "https://www.epassport.gov.bd",
        tabs: ["eligibility", "documents", "process"],
      },
      {
        id: "information-correction",
        title: "Information Correction",
        description: "পাসপোর্টের ব্যক্তিগত তথ্য সংশোধনের জন্য আবেদন।",
        eligibility: ["বিদ্যমান পাসপোর্টধারী", "সংশোধিত তথ্যের সরকারি প্রমাণ"],
        requiredDocuments: ["বর্তমান পাসপোর্ট", "NID/জন্মনিবন্ধন", "সঠিক তথ্যের প্রমাণ", "সংশোধনের কারণ"],
        applicationProcess: ["সংশোধনের ধরন নির্বাচন করুন", "প্রমাণপত্রসহ আবেদন করুন", "অ্যাপয়েন্টমেন্টের নির্দেশনা অনুসরণ করুন", "সংশোধিত পাসপোর্ট সংগ্রহ করুন"],
        officialSource: "epassport.gov.bd",
        applicationUrl: "https://www.epassport.gov.bd",
        tabs: ["eligibility", "documents", "process"],
      },
    ],
  },
  {
    id: "training",
    category: "চাকরি ও দক্ষতা",
    title: "সরকারি প্রশিক্ষণ খোঁজা",
    description: "আপনার বয়স, পেশা ও এলাকার ভিত্তিতে প্রশিক্ষণের সুযোগ দেখুন।",
    eta: "ব্যাচ ও আসনভেদে পরিবর্তনশীল",
    documents: ["NID বা জন্মনিবন্ধন", "শিক্ষাগত সনদ", "ছবি", "মোবাইল নম্বর"],
    steps: ["প্রশিক্ষণের যোগ্যতা দেখুন", "নিজের পছন্দের কোর্স নির্বাচন করুন", "নির্ধারিত সময়ে নিবন্ধন করুন", "নির্বাচিত হলে প্রশিক্ষণ কেন্দ্রে যান"],
    officialSource: "dyd.gov.bd",
    accent: "#EA580C",
  },
  {
    id: "jobs",
    category: "চাকরি ও দক্ষতা",
    title: "সরকারি চাকরি ও নিয়োগ বিজ্ঞপ্তি",
    description: "বয়স, শিক্ষাগত যোগ্যতা ও আগ্রহ অনুযায়ী চাকরির সুযোগ খুঁজুন।",
    eta: "বিজ্ঞপ্তি ও আবেদনের সময়সীমাভেদে পরিবর্তনশীল",
    documents: ["NID বা জন্মনিবন্ধন", "শিক্ষাগত সনদ", "ছবি", "মোবাইল নম্বর"],
    steps: ["যোগ্যতা ও বয়সসীমা মিলিয়ে নিন", "সরকারি নিয়োগ বিজ্ঞপ্তি পড়ুন", "অনলাইনে আবেদন ও ফি জমা দিন", "প্রবেশপত্র ও পরীক্ষার তারিখ সংরক্ষণ করুন"],
    officialSource: "bpsc.gov.bd",
    accent: "#7C3AED",
  },
  {
    id: "social-support",
    category: "সামাজিক সহায়তা",
    title: "সরকারি ভাতা ও সহায়তা খোঁজা",
    description: "বয়স, আয় ও পারিবারিক অবস্থার ভিত্তিতে সরকারী সহায়তা এবং ভাতা সম্পর্কে যাচাই করা তথ্য দেখুন।",
    eta: "যোগ্যতা ও কর্মসূচিভেদে পরিবর্তনশীল",
    documents: ["NID বা জন্মনিবন্ধন", "আয়ের তথ্য", "ব্যাংক/মোবাইল হিসাবের তথ্য", "ঠিকানার প্রমাণ"],
    steps: ["নিজের যোগ্যতার তথ্য মিলিয়ে নিন", "উপযুক্ত কর্মসূচি নির্বাচন করুন", "স্থানীয় অফিস বা অনলাইন পোর্টালে আবেদন করুন", "আবেদনের রসিদ সংরক্ষণ করুন"],
    officialSource: "socialprotection.gov.bd",
    accent: "#0891B2",
    programs: [
      {
        id: "older-persons-allowance",
        title: "বয়স্ক ভাতা",
        department: "সমাজসেবা অধিদপ্তর / জেলা সমাজসেবা অফিস",
        summary: "বয়স্ক নাগরিকদের জন্য মাসিক/দৈনিক অর্থসহায়তা।",
        eligibility: ["সাধারণত ৬৫ বছর বা তার বেশি বয়সী", "অবগত আয়ের সীমা / অল্প আয়ের প্রমাণ", "স্থায়ী ঠিকানা ও জাতীয় পরিচয়পত্র"],
        requiredDocuments: ["NID", "বয়স প্রমাণ", "ঠিকানার প্রমাণ", "ব্যাংক/মোবাইল হিসাবের তথ্য"],
        applicationProcess: ["স্থানীয় ইউনিয়ন/ইউনিয়ন পরিষদ, উপজেলা বা অফিসিয়াল সেবা পোর্টালে আবেদন করুন", "আবেদনপত্রে প্রয়োজনীয় তথ্য দিন", "যাচাই শেষে বরাদ্দের তথ্য দেখুন", "মাসিক ভাতা গ্রহণের জন্য রেকর্ড/সংশ্লিষ্ট অফিসের নির্দেশনা মেনে চলুন"],
        officialSource: "socialprotection.gov.bd",
        applicationUrl: "https://socialprotection.gov.bd",
      },
      {
        id: "disability-allowance",
        title: "প্রতিবন্ধী ভাতা",
        department: "সমাজসেবা অধিদপ্তর / জেলা সমাজসেবা অফিস",
        summary: "প্রতিবন্ধী ব্যক্তিদের জন্য সহায়তা এবং সামাজিক নিরাপত্তা সহায়তা।",
        eligibility: ["নির্দিষ্ট প্রতিবন্ধকতার নির্ধারিত রেটিং/প্রমাণ", "ডাক্তারের/প্রশাসনিক যাচাই", "সাম্প্রতিক NID/ঠিকানা"],
        requiredDocuments: ["NID", "প্রতিবন্ধী সনদ/ডাক্তারের নথি", "ঠিকানার প্রমাণ", "ব্যাংক/মোবাইল হিসাব"],
        applicationProcess: ["স্থানীয় অফিস/ইউনিয়ন পরিষদে আবেদন করুন", "প্রযোজ্য যাচাই সম্পন্ন করুন", "প্রক্রিয়া অনুযায়ী সহায়তা বরাদ্দের তথ্য দেখুন", "সাপোর্ট গ্রহণের জন্য প্রয়োজনীয় নির্দেশনা অনুসরণ করুন"],
        officialSource: "socialprotection.gov.bd",
        applicationUrl: "https://socialprotection.gov.bd",
      },
      {
        id: "child-support",
        title: "শিশু সহায়তা",
        department: "সমাজসেবা অধিদপ্তর / উপজেলা সামাজিক সেবা অফিস",
        summary: "দরিদ্র ও ঝুঁকিপূর্ণ শিশুদের জন্য সহায়তা ও সামাজিক সুরক্ষা।",
        eligibility: ["শিশুর বয়স ও পরিবারের আয়ের তথ্য", "ন্যূনতম/সম্মিলিত পরিবার যাচাই", "স্থানীয় কর্মকর্তা/সামাজিক সেবা অফিসের নথি"],
        requiredDocuments: ["শিশুর জন্ম সনদ", "অভিভাবকের NID", "পারিবারিক আয়ের প্রমাণ", "ঠিকানার প্রমাণ"],
        applicationProcess: ["স্থানীয় প্রশাসন/ইউনিয়ন পরিষদে আবেদন করুন", "শিশুর/পারিবারিক তথ্য যাচাই করুন", "কার্যক্রম ও বরাদ্দের নজরদারি করুন", "প্রয়োজন অনুযায়ী টাকা/সেবা গ্রহণের নির্দেশনা মেনে চলুন"],
        officialSource: "socialprotection.gov.bd",
        applicationUrl: "https://socialprotection.gov.bd",
      },
      {
        id: "maternity-allowance",
        title: "মাতৃত্বকালীন ভাতা",
        department: "স্বাস্থ্যসেবা বিভাগ / সমাজসেবা অধিদপ্তর",
        summary: "গর্ভবতী ও প্রসূতি মায়েদের জন্য সহায়তা দানের উদ্যোগ।",
        eligibility: ["গর্ভবতী/সংযুক্ত প্রসূতি মা", "স্বাস্থ্যকেন্দ্র/ক্লিনিকের চিকিৎসা/প্রমাণ", "প্রয়োজনীয় আয়ের ও ঠিকানা যাচাই"],
        requiredDocuments: ["NID", "গর্ভাবস্থার/চিকিৎসা নথি", "পরিবারের ঠিকানা", "ব্যাংক/মোবাইল অ্যাকাউন্ট"],
        applicationProcess: ["স্বাস্থ্যকেন্দ্র/স্থানীয় অফিসে আবেদন করুন", "চিকিৎসা ও জনস্বাস্থ্য যাচাই করুন", "সহায়তার বরাদ্দের তথ্য দেখুন", "প্রসূতি সহায়তা গ্রহণের জন্য নথি সংরক্ষণ করুন"],
        officialSource: "socialprotection.gov.bd",
        applicationUrl: "https://socialprotection.gov.bd",
      },
      {
        id: "widow-allowance",
        title: "বিধবা ও স্বামী নিগৃহীতা মহিলা ভাতা",
        department: "সমাজসেবা অধিদপ্তর / জেলা প্রশাসন",
        summary: "বিধবা ও স্বামী নিগৃহীতা মহিলাদের জন্য সমাজ-সুরক্ষা ও সহায়তা।",
        eligibility: ["বিধবা/স্বামী নিগৃহীতা মহিলা", "অবস্থা/ঘটনার প্রমাণ", "উপযুক্ত আয়ের ও ঠিকানা যাচাই"],
        requiredDocuments: ["NID", "মৃত্যু/স্বামীর অবস্থা সংক্রান্ত নথি", "ঠিকানার প্রমাণ", "ব্যাংক/মোবাইল হিসাব"],
        applicationProcess: ["স্থানীয় সামাজিক সেবা অফিস/ইউনিয়ন পরিষদে আবেদন করুন", "প্রয়োজনীয় নথি দাখিল করুন", "অফিসিয়াল যাচাই সম্পন্ন করুন", "ভাতা প্রদানের তথ্য ও স্ট্যাটাস দেখে নিন"],
        officialSource: "socialprotection.gov.bd",
        applicationUrl: "https://socialprotection.gov.bd",
      },
      {
        id: "distressed-family-support",
        title: "দুর্দশাগ্রস্ত পরিবার সহায়তা",
        department: "স্থানীয় সরকার বিভাগ / উপজেলা প্রশাসন",
        summary: "দরিদ্র ও দুর্দশাগ্রস্ত পরিবারকে ত্রাণ/সহায়তা দেওয়ার জন্য সরাসরি স্থানীয় প্রশাসনের সহযোগিতা।",
        eligibility: ["দরিদ্র/দুর্দশাগ্রস্ত পরিবারের সদস্য", "স্থানীয় প্রশাসনের যাচাই", "আয়ের ও পারিবারিক অবস্থা"],
        requiredDocuments: ["NID", "পারিবারিক আয়ের তথ্য", "ঠিকানার প্রমাণ", "উপজেলা/ইউনিয়ন পরিষদের সনদ"],
        applicationProcess: ["স্থানীয় ইউনিয়ন/উপজেলা পরিষদে আবেদন করুন", "প্রয়োজনীয় ডকুমেন্ট জমা দিন", "থাকতে পারে কনসালটেশন ও যাচাই", "প্রয়োজন অনুযায়ী সহায়তা বরাদ্দ নিশ্চিত করুন"],
        officialSource: "localgov.gov.bd",
        applicationUrl: "https://localgov.gov.bd",
      },
    ],
  },
];

export const supportedQueryTerms = governmentServices.flatMap((service) => [
  service.id,
  service.title,
  service.description,
  service.category,
  ...(service.programs ?? []).flatMap((program) => [program.title, program.department, program.summary]),
  ...(service.options ?? []).flatMap((option) => [option.title, option.description]),
]);

export function getGovernmentServiceById(id: string) {
  return governmentServices.find((service) => service.id === id) ?? null;
}

export function findGovernmentServices(query: string, limit = 5) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return governmentServices.slice(0, limit);
  }

  const normalized = cleanQuery.toLowerCase();

  const matches = governmentServices.filter((service) => {
    const haystack = [
      service.id,
      service.title,
      service.description,
      service.category,
      ...(service.programs ?? []).flatMap((program) => [program.title, program.department, program.summary]),
      ...(service.options ?? []).flatMap((option) => [option.title, option.description]),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });

  if (matches.length > 0) {
    return matches.slice(0, limit);
  }

  const tokenized = normalized.split(/\s+/).filter(Boolean);
  if (tokenized.length === 0) {
    return governmentServices.slice(0, limit);
  }

  return governmentServices
    .map((service) => {
      const haystack = [
        service.id,
        service.title,
        service.description,
        service.category,
        ...(service.programs ?? []).flatMap((program) => [program.title, program.department, program.summary]),
        ...(service.options ?? []).flatMap((option) => [option.title, option.description]),
      ]
        .join(" ")
        .toLowerCase();

      const score = tokenized.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
      return { service, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.service)
    .slice(0, limit);
}

export type GovernmentServiceContext = {
  service: GovernmentService;
  optionId?: string;
  programId?: string;
};

export function findGovernmentServiceContext(query: string): GovernmentServiceContext | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  if (/জন্ম|birth/.test(normalized)) {
    return { service: getGovernmentServiceById("birth")!, optionId: /correction|সংশোধন|ঠিক/.test(normalized) ? "correction" : "new-registration" };
  }
  if (/\bnid\b|জাতীয় পরিচয়|পরিচয়পত্র/.test(normalized)) {
    return { service: getGovernmentServiceById("nid")!, optionId: /correction|সংশোধন|ঠিক/.test(normalized) ? "correction" : "new-registration" };
  }
  if (/passport|পাসপোর্ট/.test(normalized)) {
    return { service: getGovernmentServiceById("passport")!, optionId: /renew|reissue|নবায়ন|পুনরায়/.test(normalized) ? "renewal-reissue" : /correction|সংশোধন|তথ্য/.test(normalized) ? "information-correction" : "new-application" };
  }

  for (const service of governmentServices) {
    const option = (service.options ?? []).find((item) => {
      const text = `${item.id} ${item.title} ${item.description}`.toLowerCase();
      return text.split(/\s+/).some((token) => token.length > 2 && normalized.includes(token));
    });
    if (option) return { service, optionId: option.id };

    const program = (service.programs ?? []).find((item) => {
      const text = `${item.id} ${item.title} ${item.summary}`.toLowerCase();
      return text.split(/\s+/).some((token) => token.length > 2 && normalized.includes(token)) ||
        (item.id === "older-persons-allowance" && /বয়স্ক|বয়স্ক|old age|elderly/.test(normalized)) ||
        (item.id === "disability-allowance" && /প্রতিবন্ধী|disability/.test(normalized)) ||
        (item.id === "maternity-allowance" && /মাতৃত্ব|maternity/.test(normalized)) ||
        (item.id === "child-support" && /শিশু|child/.test(normalized)) ||
        (item.id === "widow-allowance" && /বিধবা|widow/.test(normalized));
    });
    if (program) return { service, programId: program.id };
  }

  const service = findGovernmentServices(normalized, 1)[0];
  return service ? { service } : null;
}
