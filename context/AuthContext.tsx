import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/theme";
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

async function apiCall(endpoint: string, body: object) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      if (res.status === 404) {
        throw new Error(`API endpoint not found (404).\nURL: ${API_URL}${endpoint}`);
      }
      throw new Error(
        `Server HTML response (Status ${res.status}).\n\nPossible Reasons:\n1. Backend Next.js server not running (cd web -> npm run dev)\n2. MySQL database error or not running\n3. Wrong IP address in mobile/.env: ${API_URL}`
      );
    }

    if (!res.ok || !json.success) {
      throw new Error(json.error || `Request failed (${res.status})`);
    }

    return json.data;
  } catch (err) {
    clearTimeout(timeout);

    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Request timeout (30s).\n\n1. Backend restart: cd web → npm run dev\n2. Phone same WiFi\n3. Windows Firewall port 3000 allow karo\n4. API: ${API_URL}`
      );
    }

    if (err instanceof TypeError) {
      throw new Error(
        `Network fail — server tak nahi pahuncha.\n\nBackend: npm run dev\nAPI URL: ${API_URL}\nPhone aur PC same WiFi hon.`
      );
    }

    throw err;
  }
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
            // Stale token/deleted user: clear token immediately
            setToken(null);
            setUser(null);
            setAuthToken(null);
            await AsyncStorage.multiRemove(["token", "user", "@vibematch_swiped", "@vibematch_matches", "@vibematch_chats"]);
            setLoading(false);
            return;
          }

          // Valid token
          const normUser = normalizeUser(json.data);
          setToken(t[1]);
          setAuthToken(t[1]);
          setUser(normUser);
          await AsyncStorage.setItem("user", JSON.stringify(normUser));
        } catch {
          // Network offline - fallback to cached user
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
      .catch(() => console.warn("API not reachable:", API_URL));
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
    const data = await apiCall("/auth/login", { email, password });
    await persist(data.token, data.user);
  };

  const register = async (email: string, password: string) => {
    const data = await apiCall("/auth/register", { email, password });
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
      "@vibematch_chats"
    ]);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const updated = normalizeUser({ ...user, onboardingDone: true });
    setUser(updated);
    await AsyncStorage.setItem("user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
