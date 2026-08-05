import React, { createContext, useContext, useState, ReactNode } from "react";
import { defaultOnboardingData, OnboardingData } from "../constants/onboarding";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";

interface OnboardingContextType {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  saveProfile: (override?: Partial<OnboardingData>) => Promise<void>;
  saving: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();

  const update = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const saveProfile = async (override?: Partial<OnboardingData>) => {
    if (!token) {
      throw new Error("Login token missing. Please login again.");
    }

    setSaving(true);
    const payload = { ...data, ...override, onboardingDone: true };

    try {
      // Use fetchApi (activeBaseUrl + fallbacks) — same host as register/login
      const res = await api.updateProfile(payload, token);
      if (!res) {
        throw new Error("Profile save failed — empty server response");
      }
      return res;
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingContext.Provider value={{ data, update, saveProfile, saving }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
