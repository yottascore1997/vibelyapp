import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, API_FALLBACKS } from "../constants/theme";
import { setAuthToken, setActiveApiBase, hydrateActiveApiBase, api } from "../services/api";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  onboardingDone: boolean;
  avatarUrl?: string | null;
  bio?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** @deprecated Email/password — use loginWithFirebase */
  login: (email: string, password: string) => Promise<void>;
  /** @deprecated Email/password — use loginWithFirebase */
  register: (email: string, password: string) => Promise<void>;
  /** Firebase phone OTP → Hangora JWT */
  loginWithFirebase: (idToken: string, name?: string) => Promise<User>;
  /** Dummy OTP login (fixed test number only) */
  loginWithDevOtp: (phone: string, otp: string) => Promise<User>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "AbortError") return true;
  if (err.name === "TypeError") return true;
  const m = err.message.toLowerCase();
  return (
    m.includes("network request failed") ||
    m.includes("failed to fetch") ||
    m.includes("network error") ||
    m.includes("timed out") ||
    m.includes("timeout")
  );
}

async function postJson(baseUrl: string, endpoint: string, body: object, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl.replace(/\/+$/, "")}${cleanEndpoint}`;

  try {
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Server HTML/invalid JSON (${res.status}).\nURL: ${fullUrl}`);
    }

    if (!res.ok || !json.success) {
      const biz = new Error(json.error || `Request failed (${res.status})`);
      (biz as any).isBiz = true;
      throw biz;
    }

    return json.data;
  } finally {
    clearTimeout(timeout);
  }
}

async function apiCall(endpoint: string, body: object) {
  const timeoutMs = 45000;
  const raw = [API_URL, ...API_FALLBACKS].filter(
    (u, i, arr) => !!u && arr.indexOf(u) === i && /hangora\.app/i.test(u)
  );
  // Always prefer Hangora; never Vibely
  const bases = raw.length > 0 ? raw : ["https://www.hangora.app/api"];

  let lastNetworkErr: Error | null = null;

  for (const base of bases) {
    try {
      console.log("[Auth] POST", base + endpoint);
      const data = await postJson(base, endpoint, body, timeoutMs);
      setActiveApiBase(base);
      console.log("[Auth] using API base:", base);
      return data;
    } catch (err) {
      if (err instanceof Error && (err as any).isBiz) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        lastNetworkErr = new Error(
          `Server timeout (${timeoutMs / 1000}s).\nTried: ${base}`
        );
        continue;
      }
      if (isNetworkError(err)) {
        lastNetworkErr = err instanceof Error ? err : new Error(String(err));
        console.warn("[Auth] network fail on", base, lastNetworkErr.message);
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `Network fail — server tak nahi pahuncha.\n` +
      `Tried:\n${bases.map((b) => `• ${b}`).join("\n")}\n` +
      `Internet on rakho, phir dubara try karo.`
  );
}

function normalizeUser(raw: any): User | null {
  if (!raw) return null;
  return {
    ...raw,
    onboardingDone: Boolean(raw.onboardingDone ?? raw.profile?.onboardingDone ?? false),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await hydrateActiveApiBase();
      const [t, u] = await AsyncStorage.multiGet(["token", "user"]);
      if (t[1]) {
        try {
          setAuthToken(t[1]);
          const profile = await api.getProfile(t[1]);
          if (!profile) {
            setToken(null);
            setUser(null);
            setAuthToken(null);
            await AsyncStorage.multiRemove([
              "token",
              "user",
              "@vibematch_swiped",
              "@vibematch_matches",
              "@vibematch_chats",
            ]);
            setLoading(false);
            return;
          }

          const normUser = normalizeUser(profile);
          setToken(t[1]);
          setAuthToken(t[1]);
          setUser(normUser);
          await AsyncStorage.setItem("user", JSON.stringify(normUser));
        } catch {
          setToken(t[1]);
          setAuthToken(t[1]);
          if (u[1]) {
            try {
              setUser(normalizeUser(JSON.parse(u[1])));
            } catch {}
          }
        }
      } else if (u[1]) {
        try {
          setUser(normalizeUser(JSON.parse(u[1])));
        } catch {}
      }
      setLoading(false);
    })();

    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then(() => {
        console.log("API connected:", API_URL);
        setActiveApiBase(API_URL);
      })
      .catch(() => {
        console.warn("Primary API not reachable:", API_URL);
        const fb = API_FALLBACKS[0];
        if (fb) {
          fetch(`${fb}/health`)
            .then((r) => r.json())
            .then(() => {
              console.log("API fallback connected:", fb);
              setActiveApiBase(fb);
            })
            .catch(() => console.warn("API fallback also down:", fb));
        }
      });
  }, []);

  const persist = async (newToken: string, newUser: User) => {
    const normUser = normalizeUser(newUser) || newUser;
    setToken(newToken);
    setAuthToken(newToken);
    setUser(normUser);
    await AsyncStorage.multiSet([
      ["token", newToken],
      ["user", JSON.stringify(normUser)],
    ]);
    return normUser;
  };

  const login = async (email: string, password: string) => {
    const data = await apiCall("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });
    await persist(data.token, data.user);
  };

  const register = async (email: string, password: string) => {
    const data = await apiCall("/auth/register", {
      email: email.trim().toLowerCase(),
      password,
    });
    await persist(data.token, data.user);
  };

  const loginWithFirebase = async (idToken: string, name?: string) => {
    const data = await apiCall("/auth/firebase", {
      idToken,
      ...(name ? { name } : {}),
    });
    return persist(data.token, data.user);
  };

  const loginWithDevOtp = async (phone: string, otp: string) => {
    const data = await apiCall("/auth/dev-otp", { phone, otp });
    return persist(data.token, data.user);
  };

  const logout = async () => {
    setToken(null);
    setAuthToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([
      "token",
      "user",
      "@vibematch_swiped",
      "@vibematch_matches",
      "@vibematch_chats",
    ]);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const updated = normalizeUser({ ...user, onboardingDone: true });
    if (!updated) return;
    setUser(updated);
    await AsyncStorage.setItem("user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithFirebase,
        loginWithDevOtp,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
