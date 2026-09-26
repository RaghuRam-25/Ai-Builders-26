"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CitizenProfile, PublicUser, RegistrationDetails } from "@/types/citizen-profile";

import { api, ApiError, isSignedIn, persistSession } from "@/lib/api";
import { getItem, removeItem, setItem } from "@/lib/preferences";

export type { CitizenProfile, RegistrationDetails };

const DEFAULT_PROFILE: CitizenProfile = {
  name: "",
  age: "",
  district: "",
  occupation: "",
  income: "",
  education: "",
  gender: "",
  isBangladeshi: false,
  jobSeeking: false,
  nidVerified: false,
  wantsTravel: false,
};

const PROFILE_KEY = "janasheba-citizen-profile";
const AUTH_KEY = "janasheba-authenticated";

type ProfileContextValue = {
  profile: CitizenProfile;
  user: PublicUser | null;
  isRegistered: boolean;
  saveProfile: (profile: CitizenProfile) => Promise<void>;
  register: (details: RegistrationDetails) => Promise<PublicUser>;
  signIn: (credentials: { mobile: string; password: string }) => Promise<PublicUser>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CitizenProfile>(DEFAULT_PROFILE);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // First paint from the local cache, then reconcile with the API. The original
  // app was local-only; the profile is now the server's copy but the cache keeps
  // the Home screen's matched-services rail instant.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [savedProfile, auth] = await Promise.all([getItem(PROFILE_KEY), getItem(AUTH_KEY)]);
      if (cancelled) return;
      if (savedProfile) {
        try {
          setProfile({ ...DEFAULT_PROFILE, ...(JSON.parse(savedProfile) as CitizenProfile) });
        } catch {
          void removeItem(PROFILE_KEY);
        }
      }
      if (auth === "true") setIsRegistered(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyProfile = useCallback((next: CitizenProfile) => {
    setProfile(next);
    void setItem(PROFILE_KEY, JSON.stringify(next));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!isSignedIn()) return;
    const { profile: remote } = await api.getProfile<CitizenProfile | null>();
    if (remote) applyProfile(remote);
  }, [applyProfile]);

  useEffect(() => {
    if (!isSignedIn()) return;
    let cancelled = false;
    void (async () => {
      try {
        const [{ user: me }, { profile: remote }] = await Promise.all([
          api.me(),
          api.getProfile<CitizenProfile | null>(),
        ]);
        if (cancelled) return;
        setUser(me);
        if (remote) applyProfile(remote);
        setIsRegistered(true);
        void setItem(AUTH_KEY, "true");
      } catch (error) {
        if (cancelled) return;
        // An invalid/expired session should not strand the UI in a signed-in state.
        if (error instanceof ApiError && error.status === 401) {
          api.signOutLocal();
          setUser(null);
          setIsRegistered(false);
          void setItem(AUTH_KEY, "false");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyProfile]);

  const saveProfile = useCallback(
    async (next: CitizenProfile) => {
      applyProfile(next);
      if (!isSignedIn()) return;
      try {
        const { profile: remote } = await api.putProfile<CitizenProfile>({
          ...next,
          age: Number(next.age) || 0,
        });
        if (remote) applyProfile(remote);
      } catch {
        // Keep the optimistic local value; the next sign-in resyncs from the API.
      }
    },
    [applyProfile],
  );

  const register = useCallback(
    async (details: RegistrationDetails) => {
      const result = await api.register({
        name: details.name,
        mobile: details.mobile,
        password: details.password,
        age: Number(details.age) || 0,
        district: details.district,
        gender: details.gender ?? "",
        isBangladeshi: Boolean(details.isBangladeshi),
      });
      const signedIn = persistSession(result);
      setUser(signedIn);
      setIsRegistered(true);
      void setItem(AUTH_KEY, "true");
      const next: CitizenProfile = {
        ...profile,
        name: details.name,
        age: details.age,
        district: details.district,
        gender: details.gender,
        isBangladeshi: details.isBangladeshi,
      };
      applyProfile(next);
      return signedIn;
    },
    [applyProfile, profile],
  );

  const signIn = useCallback(
    async (credentials: { mobile: string; password: string }) => {
      const result = await api.login(credentials);
      const signedIn = persistSession(result);
      setUser(signedIn);
      setIsRegistered(true);
      void setItem(AUTH_KEY, "true");
      try {
        const { profile: remote } = await api.getProfile<CitizenProfile | null>();
        if (remote) applyProfile(remote);
      } catch {
        // A fresh account may not have a profile row yet.
      }
      return signedIn;
    },
    [applyProfile],
  );

  const signOut = useCallback(async () => {
    api.signOutLocal();
    setUser(null);
    setIsRegistered(false);
    void setItem(AUTH_KEY, "false");
    void removeItem(PROFILE_KEY);
    setProfile(DEFAULT_PROFILE);
  }, []);

  const value = useMemo(
    () => ({ profile, user, isRegistered, saveProfile, register, signIn, signOut, refreshProfile }),
    [profile, user, isRegistered, saveProfile, register, signIn, signOut, refreshProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
