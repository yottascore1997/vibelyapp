import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/theme";
import { Plan } from "../constants/plans";

let memoryToken: string | null = null;

/** Call from AuthContext whenever token changes */
export function setAuthToken(token: string | null) {
  memoryToken = token;
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

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T | null> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };

    if (!(options?.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (!options?.skipAuth) {
      const token = await resolveToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...(options?.headers as Record<string, string>) },
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      throw new ApiError(`Invalid response (${res.status})`, res.status);
    }

    if (!res.ok || (json && json.success === false && json.error)) {
      if (res.status === 401 || (res.status === 404 && json?.error === "User not found")) {
        setAuthToken(null);
        AsyncStorage.multiRemove(["token", "user"]);
      }
      throw new ApiError(json?.error || `Request failed (${res.status})`, res.status);
    }

    return (json?.data ?? json) as T;
  } catch (err) {
    console.error("fetchApi error on endpoint:", endpoint, err);
    // Propagate API/HTTP errors so UI can show real messages; only soft-fail unknown errors
    if (err instanceof ApiError) throw err;
    throw new ApiError(err instanceof Error ? err.message : "Network error", 0);
  }
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
  getNearbyPlans: (_userId?: string, kind?: string) =>
    fetchApi<Plan[]>(`/hangouts${kind ? `?kind=${kind}` : ""}`),
  createPlan: (data: object) =>
    fetchApi<Plan>("/hangouts", { method: "POST", body: JSON.stringify(data) }),
  joinPlan: (planId: string, _userId?: string) =>
    fetchApi(`/hangouts/${planId}/join`, { method: "POST", body: JSON.stringify({}) }),
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
  }) =>
    fetchApi<any>("/invites", {
      method: "POST",
      body: JSON.stringify({
        receiverId: data.receiverId,
        activityName: data.activityName,
        activityEmoji: data.activityEmoji,
        timeLabel: data.timeLabel,
      }),
    }),
  createPublicInvite: (data: {
    activityName: string;
    activityEmoji: string;
    timeLabel: string;
    inviteeName?: string;
    inviteePhone?: string;
  }) =>
    fetchApi<{
      id: string;
      inviteCode: string;
      inviteUrl: string;
      whatsappUrl: string;
      shareMessage: string;
      senderName: string;
    }>("/invites/public-create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  respondToInvite: (inviteId: string, status: "accepted" | "rejected") =>
    fetchApi<any>("/invites/respond", {
      method: "POST",
      body: JSON.stringify({ inviteId, status }),
    }),
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
};
