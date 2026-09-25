import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CitizenProfile = {
  name: string;
  age: string;
  district: string;
  occupation: string;
  income: string;
  education?: string;
  gender?: "পুরুষ" | "নারী" | "অন্যান্য" | "";
  isBangladeshi?: boolean;
  jobSeeking?: boolean;
  nidVerified: boolean;
  wantsTravel: boolean;
};
const DEFAULT_PROFILE: CitizenProfile = { name: "", age: "", district: "", occupation: "", income: "", education: "", gender: "", isBangladeshi: false, jobSeeking: false, nidVerified: false, wantsTravel: false };
const STORAGE_KEY = "janasheba-citizen-profile";
const AUTH_KEY = "janasheba-authenticated";
type RegistrationDetails = { name: string; mobile: string; password: string; age: string; district: string; gender: CitizenProfile["gender"]; isBangladeshi: boolean };
type ProfileContextValue = { profile: CitizenProfile; isRegistered: boolean; saveProfile: (profile: CitizenProfile) => void; register: (details: RegistrationDetails) => void; signIn: () => void; signOut: () => void };
const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CitizenProfile>(DEFAULT_PROFILE);
  const [isRegistered, setIsRegistered] = useState(false);
  useEffect(() => { Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(AUTH_KEY)]).then(([savedProfile, auth]) => { if (savedProfile) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) }); setIsRegistered(auth === "true"); }).catch(() => undefined); }, []);
  const saveProfile = (next: CitizenProfile) => { setProfile(next); void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };
  const register = (details: RegistrationDetails) => { const next: CitizenProfile = { ...profile, name: details.name, age: details.age, district: details.district, gender: details.gender, isBangladeshi: details.isBangladeshi }; setProfile(next); setIsRegistered(true); void AsyncStorage.multiSet([[STORAGE_KEY, JSON.stringify(next)], [AUTH_KEY, "true"]]); };
  const signIn = () => { setIsRegistered(true); void AsyncStorage.setItem(AUTH_KEY, "true"); };
  const signOut = () => { setIsRegistered(false); void AsyncStorage.setItem(AUTH_KEY, "false"); };
  const value = useMemo(() => ({ profile, isRegistered, saveProfile, register, signIn, signOut }), [profile, isRegistered]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
export function useProfile() { const context = useContext(ProfileContext); if (!context) throw new Error("useProfile must be used inside ProfileProvider"); return context; }
