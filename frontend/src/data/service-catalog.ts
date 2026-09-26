import { governmentServices, type GovernmentService } from "./government-services";

export type Service = GovernmentService;

export const categories = [
  { id: "popular", label: "জনপ্রিয়", icon: "★" },
  { id: "identity", label: "পরিচয়", icon: "▣" },
  { id: "education", label: "শিক্ষা", icon: "⌁" },
  { id: "support", label: "সহায়তা", icon: "✦" },
  { id: "travel", label: "ভ্রমণ", icon: "↗" },
] as const;

export const services: Service[] = governmentServices as Service[];

export const suggestions = ["NID ঠিক করতে চাই", "বয়স্ক ভাতা কীভাবে পাবো?", "পাসপোর্ট করতে কী লাগবে?"];
