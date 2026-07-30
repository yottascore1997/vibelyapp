import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, API_FALLBACKS } from "../constants/theme";
import { setAuthToken } from "../services/api";

export interface User {
  id: string;
  email: string;
  name: string;
  onboardingDone: boolean;
  avatarUrl?: string | null;
  bio?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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
      throw new Error(
        `Server HTML/invalid JSON (${res.status}).\nURL: ${fullUrl}`
      );
    }

    if (!res.ok || !json.success) {
      // Business errors (wrong password etc.) — do not retry other hosts
      const biz = new Error(json.error || `Request failed (${res.status})`);
      (biz as any).isBiz = true;
      throw biz;
    }

    return json.data;
  } finally {
    clearTimeout(timeout);
  }
}

/** Try primary API then Railway fallback — fixes flaky custom-domain SSL on some phones. */
async function apiCall(endpoint: string, body: object) {
  const timeoutMs = 45000;
  const bases = [API_URL, ...API_FALLBACKS].filter(
    (u, i, arr) => !!u && arr.indexOf(u) === i
  );

  let lastNetworkErr: Error | null = null;

  for (const base of bases) {
    try {
      console.log("[Auth] POST", base + endpoint);
      return await postJson(base, endpoint, body, timeoutMs);
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
    AsyncStorage.multiGet(["token", "user"]).then(async ([t, u]) => {
      if (t[1]) {
        try {
          const res = await fetch(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${t[1]}`, Accept: "application/json" },
          });
          let json: any = null;
          try {
            json = await res.json();
          } catch {}

          if (!res.ok || json?.success === false || !json?.data) {
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

          const normUser = normalizeUser(json.data);
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
    });

    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then(() => console.log("API connected:", API_URL))
      .catch(() => {
        console.warn("Primary API not reachable:", API_URL);
        const fb = API_FALLBACKS[0];
        if (fb) {
          fetch(`${fb}/health`)
            .then((r) => r.json())
            .then(() => console.log("API fallback connected:", fb))
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
      value={{ user, token, loading, login, register, logout, completeOnboarding }}
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
