import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, API_FALLBACKS } from "../constants/theme";
import { Plan } from "../constants/plans";

let memoryToken: string | null = null;
let activeBaseUrl = API_URL;
const ACTIVE_BASE_KEY = "@hangora_active_api_base";
const FETCH_TIMEOUT_MS = 20000;

/** Mutations that are safe to retry once (idempotent upserts / deletes). */
function isIdempotentMutation(endpoint: string, method: string) {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD") return false;
  if (endpoint.startsWith("/swipe")) return true;
  if (endpoint.startsWith("/social-status") && m === "POST") return true;
  if (endpoint.startsWith("/auth/location") && m === "POST") return true;
  return false;
}

function isNetworkishError(err: unknown): boolean {
  if (err instanceof ApiError) return false;
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    err.name === "TypeError" ||
    err.name === "AbortError" ||
    msg.includes("network request failed") ||
    msg.includes("aborted") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error")
  );
}

/** Call from AuthContext whenever token changes */
export function setAuthToken(token: string | null) {
  memoryToken = token;
}

function isLanHost(url: string) {
  return /localhost|127\.0\.0\.1|192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[0-1])\./i.test(
    url
  );
}

/** Prefer the host that successfully handled login/register — Hangora only */
export function setActiveApiBase(baseUrl: string | null) {
  if (!baseUrl) return;
  let url = baseUrl.replace(/\/+$/, "");
  if (!url.endsWith("/api")) url = `${url}/api`;
  // Never persist Vibely / non-Hangora hosts
  if (!/hangora\.app/i.test(url) && !isLanHost(url)) {
    url = API_URL;
  }
  activeBaseUrl = url;
  AsyncStorage.setItem(ACTIVE_BASE_KEY, url).catch(() => {});
}

export function getActiveApiBase() {
  return activeBaseUrl;
}

/** Restore last working API host (call once on app start) — Hangora only */
export async function hydrateActiveApiBase() {
  try {
    const saved = await AsyncStorage.getItem(ACTIVE_BASE_KEY);
    if (saved && /hangora\.app/i.test(saved)) {
      activeBaseUrl = saved;
    } else {
      // Drop old Vibely / other hosts
      activeBaseUrl = API_URL;
      await AsyncStorage.setItem(ACTIVE_BASE_KEY, API_URL);
    }
  } catch {
    activeBaseUrl = API_URL;
  }
}

async function resolveToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    const t = await AsyncStorage.getItem("token");
    memoryToken = t;
    return t;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function apiBases(): string[] {
  const raw = [activeBaseUrl, API_URL, ...API_FALLBACKS].filter(
    (u, i, arr) => !!u && arr.indexOf(u) === i
  );
  // Phone often can't reach LAN — try HTTPS cloud first, local last
  const cloud = raw.filter((u) => !isLanHost(u));
  const lan = raw.filter((u) => isLanHost(u));
  if (activeBaseUrl && !isLanHost(activeBaseUrl)) {
    return [activeBaseUrl, ...cloud.filter((u) => u !== activeBaseUrl), ...lan];
  }
  return [...cloud, ...lan];
}

async function fetchWithTimeout(url: string, options: RequestInit, ms: number) {
  // Avoid AbortController on RN Android — it often surfaces as
  // "Network request failed" even when the request would succeed.
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      const err = new Error("Request timed out");
      err.name = "AbortError";
      reject(err);
    }, ms);
  });
  try {
    return await Promise.race([fetch(url, options), timeoutPromise]);
  } catch (err) {
    if (timedOut) {
      const e = new Error("Request timed out");
      e.name = "AbortError";
      throw e;
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { skipAuth?: boolean; retries?: number }
): Promise<T | null> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (!options?.skipAuth) {
    const token = await resolveToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const method = (options?.method || "GET").toUpperCase();
  const isMutation = method !== "GET" && method !== "HEAD";
  const maxAttempts =
    typeof options?.retries === "number"
      ? Math.max(1, options.retries)
      : isIdempotentMutation(endpoint, method)
        ? 3
        : 1;

  const bases = apiBases();
  let lastErr: unknown = null;

  baseLoop: for (const base of bases) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetchWithTimeout(
          `${base}${endpoint}`,
          {
            ...options,
            headers: { ...headers, ...(options?.headers as Record<string, string>) },
          },
          FETCH_TIMEOUT_MS
        );

        let json: any = null;
        try {
          json = await res.json();
        } catch {
          throw new ApiError(`Invalid response (${res.status})`, res.status);
        }

        if (!res.ok || (json && json.success === false && json.error)) {
          if (res.status === 401 || (res.status === 404 && json?.error === "User not found")) {
            if (!endpoint.includes("/auth/location")) {
              setAuthToken(null);
              AsyncStorage.multiRemove(["token", "user"]);
            }
          }
          throw new ApiError(json?.error || `Request failed (${res.status})`, res.status);
        }

        setActiveApiBase(base);
        return (json?.data ?? json) as T;
      } catch (err) {
        lastErr = err;

        if (err instanceof ApiError) {
          break baseLoop;
        }

        if (isNetworkishError(err)) {
          if (attempt < maxAttempts) {
            console.warn(`fetchApi retry ${attempt}/${maxAttempts} on`, base, endpoint);
            await new Promise((r) => setTimeout(r, 450 * attempt));
            continue;
          }
          console.warn("fetchApi network fail on", base, endpoint);
          // Try next host for GET, or for idempotent mutations (swipe upsert is safe)
          if (!isMutation || isIdempotentMutation(endpoint, method)) {
            continue baseLoop;
          }
          break baseLoop;
        }

        break baseLoop;
      }
    }
  }

  if (endpoint.includes("/auth/location") && !(lastErr instanceof ApiError && lastErr.status >= 400)) {
    console.warn("fetchApi soft-fail:", endpoint, lastErr instanceof Error ? lastErr.message : lastErr);
  } else {
    console.error("fetchApi error on endpoint:", endpoint, lastErr);
  }
  if (lastErr instanceof ApiError) throw lastErr;
  throw new ApiError(lastErr instanceof Error ? lastErr.message : "Network error", 0);
}

export const api = {
  getProfiles: (mode = "dating", userId?: string, city?: string) =>
    fetchApi(
      `/profiles?mode=${mode}${userId ? `&userId=${userId}` : ""}${city ? `&city=${encodeURIComponent(city)}` : ""}`
    ),
  getNearbyPeople: (opts?: { maxKm?: number; limit?: number; mode?: string }) => {
    const maxKm = opts?.maxKm ?? 10;
    const limit = opts?.limit ?? 40;
    const mode = opts?.mode ?? "dating";
    return fetchApi<
      {
        id: string;
        name: string;
        age?: number;
        bio?: string;
        city?: string;
        distance: number;
        isOnline?: boolean;
        isVerified?: boolean;
        avatarUrl?: string;
        jobTitle?: string;
        vibeMatch?: number;
        interests?: { name: string }[];
      }[]
    >(`/profiles?nearby=1&maxKm=${maxKm}&limit=${limit}&mode=${mode}`);
  },
  getDiscoverProfiles: (userId: string, mode = "dating", city?: string) =>
    fetchApi(
      `/profiles?mode=${mode}&userId=${userId}${city ? `&city=${encodeURIComponent(city)}` : ""}`
    ),
  undoSwipe: (receiverId: string) =>
    fetchApi<{ undone?: boolean; matchRemoved?: boolean; action?: string }>("/swipe", {
      method: "DELETE",
      body: JSON.stringify({ receiverId }),
    }),
  getMatches: (_userId?: string) => fetchApi(`/matches`),
  getLikes: (_userId?: string) => fetchApi<{ count: number; likes: unknown[] }>(`/likes`),
  getOnlineUsers: () => fetchApi("/users/online"),
  getActivities: () => fetchApi("/activities"),
  getHangouts: (filter = "all", kind?: string) =>
    fetchApi<Plan[]>(
      `/hangouts?filter=${filter}${kind ? `&kind=${kind}` : ""}`
    ),
  getMyPlans: (_userId?: string, kind?: string) =>
    fetchApi<Plan[]>(`/hangouts?mine=true${kind ? `&kind=${kind}` : ""}`),
  getNearbyPlans: (_userId?: string, kind?: string, maxKm?: number) => {
    const qs = new URLSearchParams();
    if (kind) qs.set("kind", kind);
    if (maxKm != null) qs.set("maxKm", String(maxKm));
    const q = qs.toString();
    return fetchApi<Plan[]>(`/hangouts${q ? `?${q}` : ""}`);
  },
  createPlan: (data: object) =>
    fetchApi<Plan>("/hangouts", { method: "POST", body: JSON.stringify(data) }),
  joinPlan: (planId: string, remark?: string) =>
    fetchApi<{ message?: string; status?: string; going?: number }>(
      `/hangouts/${planId}/join`,
      {
        method: "POST",
        body: JSON.stringify(remark?.trim() ? { remark: remark.trim() } : {}),
      }
    ),
  respondToJoinRequest: (
    planId: string,
    userId: string,
    accept: boolean,
    remark?: string
  ) =>
    fetchApi(`/hangouts/${planId}/respond`, {
      method: "POST",
      body: JSON.stringify({ userId, accept, remark }),
    }),
  cancelPlan: (planId: string, remark?: string) =>
    fetchApi(`/hangouts/${planId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ remark }),
    }),
  leavePlan: (planId: string) =>
    fetchApi(`/hangouts/${planId}/leave`, { method: "POST", body: JSON.stringify({}) }),
  kickFromPlan: (planId: string, userId: string, remark?: string) =>
    fetchApi(`/hangouts/${planId}/kick`, {
      method: "POST",
      body: JSON.stringify({ userId, remark }),
    }),
  getSocialStatus: () => fetchApi("/social-status"),
  getVibes: () => fetchApi("/vibes"),
  swipe: (data: { receiverId: string; action: string; senderId?: string }) =>
    fetchApi<{ isMatch?: boolean; demo?: boolean }>("/swipe", {
      method: "POST",
      body: JSON.stringify({ receiverId: data.receiverId, action: data.action }),
      retries: 3,
    }),
  sendVibe: (data: { receiverId: string; vibeType: string; senderId?: string }) =>
    fetchApi("/vibes", {
      method: "POST",
      body: JSON.stringify({ receiverId: data.receiverId, vibeType: data.vibeType }),
    }),
  updateSocialStatus: (data: object) =>
    fetchApi("/social-status", { method: "POST", body: JSON.stringify(data) }),
  getProfile: (token: string) =>
    fetchApi("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateProfile: (data: object, token: string) =>
    fetchApi("/auth/profile", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
  updateLocation: (data: {
    latitude: number;
    longitude: number;
    city?: string;
  }) =>
    fetchApi("/auth/location", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  uploadImage: async (uri: string, token: string): Promise<{ url: string } | null> => {
    const formData = new FormData();
    const name = uri.split("/").pop() || "upload.jpg";
    const match = /\.(\w+)$/.exec(name);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append("file", {
      uri,
      name,
      type,
    } as any);

    return fetchApi("/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  },
  getInvites: (_userId?: string) => fetchApi<any[]>(`/invites`),
  sendInvite: (data: {
    receiverId: string;
    activityName: string;
    activityEmoji: string;
    timeLabel: string;
    senderId?: string;
    hangoutId?: string;
  }) =>
    fetchApi<any>("/invites", {
      method: "POST",
      body: JSON.stringify({
        receiverId: data.receiverId,
        activityName: data.activityName,
        activityEmoji: data.activityEmoji,
        timeLabel: data.timeLabel,
        hangoutId: data.hangoutId,
      }),
    }),
  createPublicInvite: (data: {
    activityName: string;
    activityEmoji: string;
    timeLabel: string;
    inviteeName?: string;
    inviteePhone?: string;
    hangoutId?: string;
  }) =>
    fetchApi<{
      id: string;
      inviteCode: string;
      inviteUrl: string;
      whatsappUrl: string;
      shareMessage: string;
      senderName: string;
      hangoutId?: string | null;
    }>("/invites/public-create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPublicInvite: (code: string) =>
    fetchApi<{
      inviteCode?: string;
      activityName?: string;
      activityEmoji?: string;
      timeLabel?: string;
      hangoutId?: string | null;
      hangout?: { id: string } | null;
      senderName?: string;
    }>(`/invites/public/${encodeURIComponent(code)}`),
  publicRsvp: (data: {
    inviteCode: string;
    status: "accepted" | "rejected";
    name?: string;
    phone?: string;
  }) =>
    fetchApi<{ hangoutId?: string | null }>("/invites/public-rsvp", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  respondToInvite: (
    inviteId: string,
    status: "accepted" | "rejected" | "counter",
    extra?: {
      activityName?: string;
      activityEmoji?: string;
      timeLabel?: string;
      remark?: string;
      note?: string;
    }
  ) =>
    fetchApi<any>("/invites/respond", {
      method: "POST",
      body: JSON.stringify({
        inviteId,
        status,
        ...(extra || {}),
      }),
    }),
  /** Best-of-3 RPS settle between counter players */
  settleInvite: (
    inviteId: string,
    action: "start" | "move",
    move?: "rock" | "paper" | "scissors"
  ) =>
    fetchApi<any>("/invites/settle", {
      method: "POST",
      body: JSON.stringify({ inviteId, action, ...(move ? { move } : {}) }),
    }),
  getSettleInvite: (inviteId: string) =>
    fetchApi<{ settle: any }>(
      `/invites/settle?inviteId=${encodeURIComponent(inviteId)}`
    ),
  getJarItems: (_userId?: string) => fetchApi<any[]>(`/jar`),
  addJarItem: (data: {
    title: string;
    type: string;
    description?: string;
    imageUrl?: string;
    meta?: string;
  }) =>
    fetchApi("/jar", { method: "POST", body: JSON.stringify(data) }),
  deleteJarItem: (id: string) =>
    fetchApi(`/jar?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  getChatMessages: (matchId: string, _userId?: string) =>
    fetchApi<{
      messages: any[];
      chatGate?: {
        unlocked: boolean;
        canSend: boolean;
        waitingForOther: boolean;
        mustSendOpener: boolean;
        expired: boolean;
        expiresAt: string | null;
        reason: string | null;
      };
      removed?: boolean;
    }>(`/matches/${matchId}/messages`),
  getGroupChatMessages: (hangoutId: string) => fetchApi<any[]>(`/hangouts/${hangoutId}/messages`),
  sendGroupChatMessage: (hangoutId: string, content: string) =>
    fetchApi(`/hangouts/${hangoutId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  unmatch: (otherUserId: string) =>
    fetchApi<{ unmatched: boolean }>(`/matches/${otherUserId}`, { method: "DELETE" }),
  getExpenses: (opts: { hangoutId?: string; eventId?: string }) => {
    const query = opts.hangoutId ? `hangoutId=${opts.hangoutId}` : `eventId=${opts.eventId}`;
    return fetchApi<any>(`/expenses?${query}`);
  },
  addExpense: (data: {
    hangoutId?: string;
    eventId?: string;
    payerId: string;
    title: string;
    amount: number;
    category?: string;
    receiptUrl?: string;
    splitMemberIds?: string[];
  }) => fetchApi<any>(`/expenses`, { method: "POST", body: JSON.stringify(data) }),
  settleExpenseSplit: (splitIdOrUserId: string) =>
    fetchApi<any>(`/expenses/settle`, { method: "POST", body: JSON.stringify({ splitId: splitIdOrUserId, userId: splitIdOrUserId }) }),
  deleteAccount: (token?: string) =>
    fetchApi<{ message: string }>("/auth/delete-account", {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
};

