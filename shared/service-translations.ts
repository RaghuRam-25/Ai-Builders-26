import type { Service } from "./service-catalog";

const translations: Record<string, Partial<Service>> = {
  nid: {
    category: "Identity & Citizenship",
    title: "National ID correction",
    description: "Prepare to correct your name, birth date, or address information.",
    eta: "May take 7–15 days",
    documents: ["Current NID copy", "Proof of correct information", "Birth registration certificate", "Recent photo"],
    steps: ["Check the requirements", "Prepare the required documents", "Apply online or contact the relevant office", "Keep your application receipt"],
  },
  birth: {
    category: "Identity & Citizenship",
    title: "Birth registration certificate",
    description: "Learn about new registration, corrections, and getting a certificate copy.",
    eta: "Varies by service",
    documents: ["Parent's NID", "Hospital/vaccination card", "Proof of address", "Previous registration details, if any"],
    steps: ["Check the registration details", "Choose your union, municipality, or online portal", "Submit the documents", "Confirm the certificate collection date"],
  },
  passport: {
    category: "Travel",
    title: "E-passport application",
    description: "Prepare your photo, identity information, and appointment before applying.",
    eta: "Appointment required",
    documents: ["NID or birth registration", "Passport fee payment details", "Address information", "Previous passport, if applicable"],
    steps: ["Complete the online form", "Pay the fee", "Give biometrics at the appointment", "Track the delivery"],
  },
  training: {
    category: "Jobs & Skills",
    title: "Find government training",
    description: "Find training opportunities based on your age, profession, and location.",
    eta: "Varies by batch and seats",
    documents: ["NID or birth registration", "Educational certificate", "Photo", "Mobile number"],
    steps: ["Check the training eligibility", "Choose a course", "Register within the deadline", "Attend the centre if selected"],
  },
  jobs: {
    category: "Jobs & Recruitment",
    title: "Government jobs and recruitment notices",
    description: "Find job opportunities based on your age, education, and interests.",
    eta: "Varies by notice and deadline",
    documents: ["NID or birth registration", "Educational certificates", "Photo", "Mobile number"],
    steps: ["Check the age and eligibility criteria", "Read the recruitment notice", "Apply online and pay the fee", "Save the admit card and exam date"],
  },
  "social-support": {
    category: "Social support",
    title: "Find government allowances",
    description: "Learn about possible support based on age, income, and family situation.",
    eta: "Varies by eligibility and programme",
    documents: ["NID or birth registration", "Income information", "Bank or mobile account details", "Proof of address"],
    steps: ["Check your eligibility", "Choose a suitable programme", "Apply through the local office or online portal", "Keep your application receipt"],
  },
};

export function getLocalizedService(service: Service, isEnglish: boolean): Service {
  if (!isEnglish) return service;
  return { ...service, ...translations[service.id] };
}
