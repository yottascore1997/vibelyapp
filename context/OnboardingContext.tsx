import React, { createContext, useContext, useState, ReactNode } from "react";
import { defaultOnboardingData, OnboardingData } from "../constants/onboarding";
import { useAuth } from "./AuthContext";
import { API_URL } from "../constants/theme";

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
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Profile save failed");
      }

      return json.data;
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
