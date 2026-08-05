import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
import { usePlans } from "./PlansContext";
import { DiscoverProfile, MatchProfile, SwipeAction } from "../constants/matches";
import { ChatThread, buildEmptyThread, formatChatPreview, parseReplyPayload } from "../constants/chats";
import { ChatGate, evaluateLocalChatGate } from "../constants/chatGate";
import { resolveChatWsUrl } from "../constants/theme";
import { getActiveApiBase } from "../services/api";
import { Alert } from "react-native";

const STORAGE_SWIPED = "@vibematch_swiped";
const STORAGE_MATCHES = "@vibematch_matches";
const STORAGE_CHATS = "@vibematch_chats";

interface MatchesContextType {
  deck: DiscoverProfile[];
  matches: MatchProfile[];
  conversations: ChatThread[];
  likesCount: number;
  likesList: any[];
  loading: boolean;
  hasGps: boolean;
  canRewind: boolean;
  chatGates: Record<string, ChatGate>;
  refresh: (mode?: "friends" | "dating" | "everyone") => Promise<void>;
  swipe: (receiverId: string, action: SwipeAction) => Promise<{ isMatch: boolean; profile?: DiscoverProfile }>;
  rewind: () => Promise<boolean>;
  updateDiscoverPrefs: (prefs: {
    maxDistance?: number;
    minAge?: number;
    maxAge?: number;
    genderPreference?: string;
  }) => Promise<boolean>;
  isMatched: (userId: string) => boolean;
  getConversation: (matchId: string) => ChatThread | undefined;
  getChatGate: (matchId: string) => ChatGate | null;
  sendMessage: (matchId: string, text: string) => Promise<void>;
  unmatch: (otherUserId: string) => Promise<void>;
  markRead: (matchId: string) => Promise<void>;
  typingUsers: Record<string, { userId: string; name: string }[]>;
  sendTypingStatus: (matchId: string, isTyping: boolean) => void;
  updateMessageContent: (messageId: string, newContent: string, matchId: string, isGroup?: boolean) => void;
  deleteMessage: (messageId: string, matchId: string, isGroup?: boolean) => void;
}

const MatchesContext = createContext<MatchesContextType | null>(null);

function syncThreads(matches: MatchProfile[], stored: ChatThread[]): ChatThread[] {
  const threads: ChatThread[] = [...stored];

  for (const m of matches) {
    if (!threads.some((t) => t.matchId === m.id)) {
      threads.push(
        buildEmptyThread(m.id, m.name, m.avatarUrl, {
          isOnline: m.isOnline,
          isVerified: m.isVerified,
          lastSeenAt: m.lastSeenAt,
        })
      );
    } else {
      const idx = threads.findIndex((t) => t.matchId === m.id);
      threads[idx] = {
        ...threads[idx],
        matchName: m.name,
        avatarUrl: m.avatarUrl,
        isOnline: m.isOnline,
        lastSeenAt: m.lastSeenAt ?? threads[idx].lastSeenAt,
        isVerified: m.isVerified,
      };
    }
  }

  return threads
    .filter((t) => t.isGroup || matches.some((m) => m.id === t.matchId))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export function MatchesProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const { myPlans, nearbyPlans, requestStatuses, getRequestStatus, refresh: refreshPlans } = usePlans();
  const [deck, setDeck] = useState<DiscoverProfile[]>([]);
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [conversations, setConversations] = useState<ChatThread[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [likesList, setLikesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipedIds, setSwipedIds] = useState<string[]>([]);
  const [chatGates, setChatGates] = useState<Record<string, ChatGate>>({});
  const [hasGps, setHasGps] = useState(true);
  const [lastSwipe, setLastSwipe] = useState<{
    profile: DiscoverProfile;
    action: SwipeAction;
  } | null>(null);

  const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; name: string }[]>>({});

  const [socketConnected, setSocketConnected] = useState(false);
  const lastChatErrorRef = useRef<string | null>(null);
  const socketRef = useRef<any>(null);

  const persistChats = async (threads: ChatThread[]) => {
    await AsyncStorage.setItem(STORAGE_CHATS, JSON.stringify(threads));
  };

  const loadLocal = useCallback(async () => {
    const [swipedRaw, matchesRaw, chatsRaw] = await AsyncStorage.multiGet([
      STORAGE_SWIPED,
      STORAGE_MATCHES,
      STORAGE_CHATS,
    ]);
    const swiped = swipedRaw[1] ? (JSON.parse(swipedRaw[1]) as string[]) : [];
    const localMatches = matchesRaw[1] ? (JSON.parse(matchesRaw[1]) as MatchProfile[]) : [];
    const localChats = chatsRaw[1] ? (JSON.parse(chatsRaw[1]) as ChatThread[]) : [];
    setSwipedIds(swiped);
    setMatches(localMatches);
    setConversations(syncThreads(localMatches, localChats));
    return { swiped, localMatches, localChats };
  }, []);

  const refresh = useCallback(async (mode: "friends" | "dating" | "everyone" = "dating") => {
    if (!user) {
      setDeck([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { swiped, localMatches } = await loadLocal();

      const soft = <T,>(p: Promise<T>) => p.catch(() => null as T | null);

      let discoverCity: string | undefined;
      let viewerHasGps = false;
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const me: any = await api.getProfile(token);
          const profile = me?.profile || me;
          if (profile?.city) discoverCity = profile.city;
          viewerHasGps =
            profile?.latitude != null &&
            profile?.longitude != null &&
            Number.isFinite(Number(profile.latitude)) &&
            Number.isFinite(Number(profile.longitude));
        }
      } catch {
        // keep defaults
      }
      setHasGps(viewerHasGps);

      const [profiles, matchList, likes] = await Promise.all([
        soft(api.getDiscoverProfiles(user.id, mode, discoverCity)),
        soft(api.getMatches(user.id)),
        soft(api.getLikes(user.id)),
        soft(refreshPlans()),
      ]);

      const resolveAvatar = (url?: string | null, name?: string) => {
        if (url) {
          if (url.startsWith("/")) {
            const { API_URL } = require("../constants/theme");
            const serverBaseUrl = API_URL.replace("/api", "");
            return `${serverBaseUrl}${url}`;
          }
          return url;
        }
        const label = encodeURIComponent((name || "User").split(" ")[0]);
        return `https://ui-avatars.com/api/?name=${label}&background=7C3AED&color=fff&size=400`;
      };

      const resolvePhotoList = (photos?: string[], avatar?: string, name?: string) => {
        const list = (photos || [])
          .filter(Boolean)
          .map((u) => resolveAvatar(u, name));
        if (list.length === 0 && avatar) list.push(resolveAvatar(avatar, name));
        if (list.length === 0) list.push(resolveAvatar(null, name));
        return list;
      };

      const apiMatches = ((matchList as MatchProfile[]) || []).map((m) => ({
        ...m,
        avatarUrl: resolveAvatar(m.avatarUrl, m.name),
        photos: resolvePhotoList(m.photos, m.avatarUrl, m.name),
      }));

      const mergedMatches = [
        ...localMatches,
        ...apiMatches.filter((m) => !localMatches.some((x) => x.id === m.id)),
      ].filter((m) => m.id !== user.id);
      setMatches(mergedMatches);
      setLikesCount(likes?.count ?? 0);

      const apiLikes = ((likes?.likes as any[]) || []).map((l) => ({
        ...l,
        avatarUrl: resolveAvatar(l.avatarUrl, l.name),
      }));
      setLikesList(apiLikes);

      const chatsRaw = await AsyncStorage.getItem(STORAGE_CHATS);
      const localChats = chatsRaw ? (JSON.parse(chatsRaw) as ChatThread[]) : [];
      const threads = syncThreads(mergedMatches, localChats);

      // Sync actual historical messages from MySQL database
      const nextGates: Record<string, ChatGate> = {};
      const expiredMatchIds: string[] = [];

      const threadsWithRealHistory = await Promise.all(
        threads.map(async (t) => {
          try {
            if (t.isGroup) {
              const serverMsgs = await api.getGroupChatMessages(t.matchId);
              if (serverMsgs) {
                const messages = serverMsgs.map((m: any) => {
                  const parsed = parseReplyPayload(m.text || "");
                  return {
                    id: m.id,
                    text: m.text,
                    sentAt: m.sentAt,
                    fromMe: m.senderId === user.id,
                    senderName: m.senderName,
                    senderAvatar: m.senderAvatar,
                    replyToId: parsed.replyToId,
                    replyToText: parsed.replyToText,
                  };
                });

                const lastRaw = messages[messages.length - 1]?.text || "";
                return {
                  ...t,
                  messages,
                  lastMessage: lastRaw
                    ? formatChatPreview(lastRaw)
                    : "Say hi to the group",
                  lastMessageAt:
                    messages[messages.length - 1]?.sentAt || t.lastMessageAt,
                  unread: 0,
                };
              }
              return t;
            }

            const res = await api.getChatMessages(t.matchId, user.id);
            if (!res) return t;

            if (res.chatGate) nextGates[t.matchId] = res.chatGate;

            if (res.removed || res.chatGate?.expired) {
              expiredMatchIds.push(t.matchId);
              return null;
            }

            const list = res.messages || [];
            const messages = list.map((m: any) => {
              const parsed = parseReplyPayload(m.text || "");
              return {
                id: m.id,
                text: m.text,
                sentAt: m.sentAt,
                fromMe: m.senderId === user.id,
                isRead: !!m.isRead,
                replyToId: parsed.replyToId,
                replyToText: parsed.replyToText,
              };
            });

            const lastRaw = messages[messages.length - 1]?.text || "";
            const unreadCount = messages.filter((m) => !m.fromMe && !m.isRead).length;

            return {
              ...t,
              messages,
              lastMessage: lastRaw ? formatChatPreview(lastRaw) : "Say hi to start chatting",
              lastMessageAt: messages[messages.length - 1]?.sentAt || t.lastMessageAt,
              unread: unreadCount,
            };
          } catch {
            return t;
          }
        })
      );

      const aliveThreads = threadsWithRealHistory.filter(Boolean) as ChatThread[];
      const keptMatches =
        expiredMatchIds.length > 0
          ? mergedMatches.filter((m) => !expiredMatchIds.includes(m.id))
          : mergedMatches;
      if (expiredMatchIds.length > 0) {
        setMatches(keptMatches);
        await AsyncStorage.setItem(STORAGE_MATCHES, JSON.stringify(keptMatches));
      }
      if (Object.keys(nextGates).length > 0) {
        setChatGates((prev) => ({ ...prev, ...nextGates }));
      }

      setConversations(aliveThreads);
      await persistChats(aliveThreads);

      let nextDeck = ((profiles as DiscoverProfile[]) || []).map((p) => {
        const photos = resolvePhotoList(p.photos, p.avatarUrl, p.name);
        return {
          ...p,
          avatarUrl: photos[0],
          photos,
        };
      });
      nextDeck = nextDeck.filter((p) => !swiped.includes(p.id) && !keptMatches.some((m) => m.id === p.id));

      setDeck(nextDeck);
      setLastSwipe(null);
    } catch (err) {
      console.error("Matches refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user, loadLocal, refreshPlans]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Synchronize Group Chats based on Hangouts created by or joined by the user
  useEffect(() => {
    if (!user) return;

    // Get all plans created by me, OR where I am accepted (going)
    const activePlans = [...myPlans, ...nearbyPlans].filter((p) => {
      const isCreator = p.creatorId === user.id;
      const isAccepted = getRequestStatus(p.id) === "accepted" || p.participants?.some((pt) => pt.id === user.id);
      return isCreator || isAccepted;
    });

    setConversations((prev) => {
      let changed = false;
      const updated = [...prev];

      // Update existing group chats or add new ones
      for (const plan of activePlans) {
        const existingIdx = updated.findIndex((t) => t.matchId === plan.id);
        const groupName = `${plan.title}`;
        const groupAvatar = plan.imageUrl || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop";

        if (existingIdx !== -1) {
          // Sync changes
          const existingThread = updated[existingIdx];
          if (existingThread.matchName !== groupName || existingThread.avatarUrl !== groupAvatar || !existingThread.isGroup) {
            changed = true;
            updated[existingIdx] = {
              ...existingThread,
              isGroup: true,
              matchName: groupName,
              avatarUrl: groupAvatar,
            };
          }
        } else {
          // Add new group chat thread
          changed = true;
          const now = new Date().toISOString();
          updated.push({
            matchId: plan.id,
            matchName: groupName,
            avatarUrl: groupAvatar,
            isGroup: true,
            unread: 0,
            lastMessage: "Say hi to the group",
            lastMessageAt: now,
            messages: [],
          });
        }
      }

      // Cleanup group chats for plans that the user has left
      const cleaned = updated.filter((t) => {
        if (!t.isGroup) return true;
        return activePlans.some((p) => p.id === t.matchId);
      });

      if (cleaned.length !== updated.length) changed = true;

      if (changed) {
        // Sort and persist
        const sorted = cleaned.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        persistChats(sorted);
        return sorted;
      }
      return prev;
    });
  }, [myPlans, nearbyPlans, requestStatuses, user]);

  const addMatch = async (matchProfile: MatchProfile) => {
    const updated = [...matches.filter((m) => m.id !== matchProfile.id), matchProfile];
    setMatches(updated);
    await AsyncStorage.setItem(STORAGE_MATCHES, JSON.stringify(updated));

    const thread = buildEmptyThread(matchProfile.id, matchProfile.name, matchProfile.avatarUrl, {
      isOnline: matchProfile.isOnline,
      isVerified: matchProfile.isVerified,
      lastSeenAt: matchProfile.lastSeenAt,
    });
    const nextThreads = syncThreads(updated, [...conversations.filter((t) => t.matchId !== matchProfile.id), thread]);
    setConversations(nextThreads);
    await persistChats(nextThreads);

    // Instantly subscribe socket to the new room
    if (socketRef.current) {
      socketRef.current.emit("join_room", matchProfile.id);
    }
  };

  const swipe = async (receiverId: string, action: SwipeAction) => {
    const profile = deck.find((p) => p.id === receiverId);
    if (!profile) return { isMatch: false };

    const prevDeck = deck;
    const prevSwiped = swipedIds;
    const newSwiped = [...swipedIds, receiverId];
    setSwipedIds(newSwiped);
    setDeck((d) => d.filter((p) => p.id !== receiverId));
    setLastSwipe({ profile, action });
    await AsyncStorage.setItem(STORAGE_SWIPED, JSON.stringify(newSwiped));

    let isMatch = false;

    if (user) {
      try {
        const res = await api.swipe({ receiverId, action });
        isMatch = !!res?.isMatch && !res?.demo;

        if (isMatch && profile) {
          const matchProfile: MatchProfile = { ...profile, matchedAt: new Date().toISOString() };
          await addMatch(matchProfile);
          return { isMatch, profile };
        }
      } catch (err) {
        console.error("Swipe failed:", err);
        // Roll back optimistic swipe so the card isn't lost forever
        setSwipedIds(prevSwiped);
        setDeck(prevDeck);
        setLastSwipe(null);
        await AsyncStorage.setItem(STORAGE_SWIPED, JSON.stringify(prevSwiped));
        const msg =
          err instanceof Error && /network|timeout|abort/i.test(err.message)
            ? "Network glitch — check Wi‑Fi/data and try the like again."
            : "Could not save that like. Try again.";
        Alert.alert("Swipe failed", msg);
        return { isMatch: false, profile };
      }
    }

    return { isMatch: false, profile };
  };

  const rewind = useCallback(async () => {
    if (!lastSwipe || !user) return false;
    const { profile } = lastSwipe;
    try {
      const res = await api.undoSwipe(profile.id);
      if (!res?.undone) {
        Alert.alert("Rewind failed", "Could not undo that swipe.");
        return false;
      }

      const nextSwiped = swipedIds.filter((id) => id !== profile.id);
      setSwipedIds(nextSwiped);
      await AsyncStorage.setItem(STORAGE_SWIPED, JSON.stringify(nextSwiped));
      setDeck((d) => [profile, ...d.filter((p) => p.id !== profile.id)]);
      setLastSwipe(null);

      if (res.matchRemoved) {
        setMatches((prev) => {
          const next = prev.filter((m) => m.id !== profile.id);
          AsyncStorage.setItem(STORAGE_MATCHES, JSON.stringify(next));
          return next;
        });
        setConversations((prev) => {
          const next = prev.filter((t) => t.matchId !== profile.id);
          persistChats(next);
          return next;
        });
      }
      return true;
    } catch (err) {
      console.error("Rewind failed:", err);
      Alert.alert("Rewind failed", "Please try again.");
      return false;
    }
  }, [lastSwipe, user, swipedIds]);

  const updateDiscoverPrefs = useCallback(
    async (prefs: {
      maxDistance?: number;
      minAge?: number;
      maxAge?: number;
      genderPreference?: string;
    }) => {
      if (!token) {
        Alert.alert("Login required", "Please log in again.");
        return false;
      }
      try {
        await api.updateProfile(prefs, token);
        await refresh();
        return true;
      } catch (err) {
        console.error("updateDiscoverPrefs failed:", err);
        Alert.alert("Could not save filters", "Try again.");
        return false;
      }
    },
    [token, refresh]
  );

  // Manage real-time socket connection lifecycle
  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const wsUrl = resolveChatWsUrl(getActiveApiBase());
    console.log(`[MatchesContext] Connecting to Chat WebSocket: ${wsUrl}`);

    const socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      forceNew: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 1200,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[MatchesContext] Chat WebSocket connected: ${socket.id}`);
      lastChatErrorRef.current = null;
      setSocketConnected(true);
    });

    socket.on("connect_error", (err) => {
      const msg = String(err?.message || err);
      lastChatErrorRef.current = msg;
      console.warn("[MatchesContext] Chat socket connect_error:", msg);
      setSocketConnected(false);
      if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("token")) {
        console.warn(
          "[MatchesContext] Chat JWT rejected — Hangora API JWT_SECRET must match chat Railway JWT_SECRET (no quotes). Then logout/login."
        );
      }
    });


    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("message_rejected", (payload: { matchId: string; reason?: string; chatGate?: ChatGate }) => {
      const { matchId, reason, chatGate } = payload;
      if (chatGate) setChatGates((prev) => ({ ...prev, [matchId]: chatGate }));
      setConversations((prev) => {
        const next = prev.map((t) => {
          if (t.matchId !== matchId) return t;
          const withoutTemp = t.messages.filter((m) => !m.id.startsWith("temp-"));
          return { ...t, messages: withoutTemp };
        });
        persistChats(next);
        return next;
      });
      if (reason) Alert.alert("Message not sent", reason);
    });

    socket.on("match_removed", (payload: { matchId: string; reason?: string }) => {
      const otherId = payload.matchId;
      setMatches((prev) => {
        const next = prev.filter((m) => m.id !== otherId);
        AsyncStorage.setItem(STORAGE_MATCHES, JSON.stringify(next));
        return next;
      });
      setConversations((prev) => {
        const next = prev.filter((t) => t.matchId !== otherId);
        persistChats(next);
        return next;
      });
      setChatGates((prev) => {
        const next = { ...prev };
        delete next[otherId];
        return next;
      });
      if (payload.reason) {
        Alert.alert("Match ended", payload.reason);
      }
    });

    socket.on("new_message", (payload: {
      id: string;
      text: string;
      sentAt: string;
      senderId: string;
      matchId: string;
      senderName?: string;
      senderAvatar?: string;
      isRead?: boolean;
    }) => {
      console.log("[MatchesContext] Socket received new_message:", payload);
      const { matchId, id, text, sentAt, senderId, senderName, senderAvatar, isRead } = payload;
      const fromMe = senderId === user.id;
      const threadKey = fromMe ? matchId : senderId;
      const parsed = parseReplyPayload(text || "");
      const preview = formatChatPreview(text);

      setConversations((prev) => {
        const next = prev.map((t) => {
            const isThreadMatch = t.isGroup 
              ? t.matchId === matchId 
              : t.matchId === threadKey;

            if (isThreadMatch) {
              if (t.messages.some((m) => m.id === id)) return t;

              // Check if we have an optimistic temporary message and update its ID
              const tempIdx = t.messages.findIndex((m) => m.id.startsWith("temp-") && m.text === text);
              if (tempIdx !== -1) {
                const updated = [...t.messages];
                updated[tempIdx] = {
                  ...updated[tempIdx],
                  id,
                  sentAt,
                  isRead: !!isRead,
                  replyToId: parsed.replyToId,
                  replyToText: parsed.replyToText,
                };
                return {
                  ...t,
                  messages: updated,
                  lastMessage: preview,
                  lastMessageAt: sentAt,
                  unread: fromMe ? 0 : (t.unread + 1),
                };
              }

              // Fallback window deduplication
              const isDuplicate = t.messages.some(
                (m) => m.text === text && Math.abs(new Date(m.sentAt).getTime() - new Date(sentAt).getTime()) < 5000
              );
              if (isDuplicate) {
                return {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.text === text && Math.abs(new Date(m.sentAt).getTime() - new Date(sentAt).getTime()) < 5000
                      ? { ...m, id, isRead: !!isRead }
                      : m
                  ),
                  lastMessage: preview,
                };
              }

              const msg = {
                id,
                text,
                sentAt,
                fromMe,
                senderName,
                senderAvatar,
                isRead: !!isRead,
                replyToId: parsed.replyToId,
                replyToText: parsed.replyToText,
              };

              return {
                ...t,
                messages: [...t.messages, msg],
                lastMessage: preview,
                lastMessageAt: sentAt,
                unread: fromMe ? 0 : (t.unread + 1),
              };
            }
          return t;
        });

        persistChats(next);
        return next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
    });

    socket.on("presence_update", (payload: { userId: string; isOnline: boolean; lastSeenAt?: string | null }) => {
      const { userId: otherId, isOnline, lastSeenAt } = payload;
      setMatches((prev) =>
        prev.map((m) =>
          m.id === otherId ? { ...m, isOnline, lastSeenAt: lastSeenAt ?? m.lastSeenAt } : m
        )
      );
      setDeck((prev) =>
        prev.map((p) =>
          p.id === otherId ? { ...p, isOnline, lastSeenAt: lastSeenAt ?? p.lastSeenAt } : p
        )
      );
      setConversations((prev) => {
        const next = prev.map((t) =>
          !t.isGroup && t.matchId === otherId
            ? { ...t, isOnline, lastSeenAt: lastSeenAt ?? t.lastSeenAt }
            : t
        );
        persistChats(next);
        return next;
      });
    });

    socket.on("messages_read", (payload: { matchId: string; readerId: string; messageIds: string[] }) => {
      const { matchId, readerId, messageIds } = payload;
      if (!messageIds?.length) return;

      setConversations((prev) => {
        const next = prev.map((t) => {
          if (t.isGroup) return t;

          // I opened the chat — clear unread
          if (readerId === user.id && t.matchId === matchId) {
            return {
              ...t,
              unread: 0,
              messages: t.messages.map((m) =>
                !m.fromMe ? { ...m, isRead: true } : m
              ),
            };
          }

          // They read my messages — show double-check
          if (readerId !== user.id && t.matchId === readerId) {
            return {
              ...t,
              messages: t.messages.map((m) =>
                messageIds.includes(m.id) ? { ...m, isRead: true } : m
              ),
            };
          }

          return t;
        });
        persistChats(next);
        return next;
      });
    });

    socket.on("message_deleted", (payload: { id: string; matchId: string; senderId: string; isGroup?: boolean }) => {
      const { id, matchId, senderId, isGroup } = payload;
      const fromMe = senderId === user.id;
      setConversations((prev) => {
        const next = prev.map((t) => {
          const isThreadMatch = isGroup
            ? t.matchId === matchId
            : t.matchId === (fromMe ? matchId : senderId);
          if (!isThreadMatch) return t;
          const messages = t.messages.map((m) =>
            m.id === id ? { ...m, text: "[DELETED]" } : m
          );
          const last = messages[messages.length - 1];
          return {
            ...t,
            messages,
            lastMessage: last ? formatChatPreview(last.text) : t.lastMessage,
          };
        });
        persistChats(next);
        return next;
      });
    });

    socket.on("user_typing", (payload: { matchId: string; senderId: string; senderName: string }) => {
      const { matchId, senderId, senderName } = payload;
      if (senderId === user?.id) return;

      setTypingUsers((prev) => {
        const currentList = prev[matchId] || [];
        if (currentList.some((u) => u.userId === senderId)) return prev;
        return {
          ...prev,
          [matchId]: [...currentList, { userId: senderId, name: senderName }],
        };
      });
    });

    socket.on("user_stop_typing", (payload: { matchId: string; senderId: string }) => {
      const { matchId, senderId } = payload;
      if (senderId === user?.id) return;

      setTypingUsers((prev) => {
        const currentList = prev[matchId] || [];
        if (!currentList.some((u) => u.userId === senderId)) return prev;
        return {
          ...prev,
          [matchId]: currentList.filter((u) => u.userId !== senderId),
        };
      });
    });

    socket.on("message_updated", (payload: { id: string; text: string; matchId: string; senderId: string; isGroup?: boolean }) => {
      console.log("[MatchesContext] Socket received message_updated:", payload);
      const { id, text, matchId, senderId, isGroup } = payload;
      const fromMe = senderId === user?.id;

      setConversations((prev) => {
        const next = prev.map((t) => {
          const isThreadMatch = isGroup 
            ? t.matchId === matchId 
            : t.matchId === (fromMe ? matchId : senderId);

          if (isThreadMatch) {
            return {
              ...t,
              messages: t.messages.map((m) => {
                if (m.id === id) {
                  return { ...m, text };
                }
                return m;
              }),
              lastMessage: t.messages[t.messages.length - 1]?.id === id ? formatChatPreview(text) : t.lastMessage
            };
          }
          return t;
        });
        persistChats(next);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token]);

  // Handle dynamic room subscription updates
  useEffect(() => {
    if (socketRef.current && socketConnected) {
      console.log("[MatchesContext] Dynamic joining rooms:", conversations.map((t) => t.matchId));
      conversations.forEach((t) => {
        socketRef.current.emit("join_room", t.matchId);
      });
    }
  }, [socketConnected, conversations.map((t) => t.matchId).join(",")]);

  const getConversation = (matchId: string) => conversations.find((t) => t.matchId === matchId);

  const getChatGate = useCallback(
    (matchId: string): ChatGate | null => {
      const thread = conversations.find((t) => t.matchId === matchId);
      if (!thread || thread.isGroup || !user) return chatGates[matchId] || null;
      const match = matches.find((m) => m.id === matchId);
      // Prefer live local evaluation from thread messages so reply unlocks immediately
      return evaluateLocalChatGate({
        userId: user.id,
        matchedAt: match?.matchedAt,
        messages: thread.messages.map((m) => ({ fromMe: !!m.fromMe, sentAt: m.sentAt })),
      });
    },
    [chatGates, conversations, matches, user]
  );

  const removeMatchLocal = useCallback(
    async (otherUserId: string) => {
      setMatches((prev) => {
        const next = prev.filter((m) => m.id !== otherUserId);
        AsyncStorage.setItem(STORAGE_MATCHES, JSON.stringify(next));
        return next;
      });
      setConversations((prev) => {
        const next = prev.filter((t) => t.matchId !== otherUserId);
        persistChats(next);
        return next;
      });
      setChatGates((prev) => {
        const next = { ...prev };
        delete next[otherUserId];
        return next;
      });
    },
    []
  );

  const unmatch = useCallback(
    async (otherUserId: string) => {
      try {
        await api.unmatch(otherUserId);
      } catch (err) {
        console.error("Unmatch failed:", err);
        Alert.alert("Unmatch failed", "Please try again.");
        return;
      }
      await removeMatchLocal(otherUserId);
    },
    [removeMatchLocal]
  );

  const sendMessage = async (matchId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;

    const thread = conversations.find((t) => t.matchId === matchId);
    const isGroup = thread?.isGroup === true;

    if (!isGroup) {
      const gate = getChatGate(matchId);
      if (gate && !gate.canSend) {
        Alert.alert("Chat locked", gate.reason || "You cannot send another message yet.");
        return;
      }
    }

    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const parsed = parseReplyPayload(trimmed);
    const msg = {
      id: tempId,
      text: trimmed,
      sentAt: now,
      fromMe: true,
      isRead: false,
      replyToId: parsed.replyToId,
      replyToText: parsed.replyToText,
    };
    const preview = formatChatPreview(trimmed);

    // Optimistically update local thread state
    setConversations((prev) => {
      const next = prev.map((t) =>
        t.matchId === matchId
          ? { ...t, messages: [...t.messages, msg], lastMessage: preview, lastMessageAt: now, unread: 0 }
          : t
      );
      persistChats(next);
      return next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    });

    if (!isGroup) {
      const match = matches.find((m) => m.id === matchId);
      const provisional = evaluateLocalChatGate({
        userId: user.id,
        matchedAt: match?.matchedAt,
        messages: [...(thread?.messages || []), { fromMe: true, sentAt: now }].map((m) => ({
          fromMe: m.fromMe,
          sentAt: m.sentAt,
        })),
      });
      setChatGates((prev) => ({ ...prev, [matchId]: provisional }));
    }

    // Emit live message over the socket connection (production only — no REST fallback)
    if (socketRef.current?.connected && socketConnected) {
      const payload = {
        matchId,
        senderId: user.id,
        content: trimmed,
        isGroup,
      };
      socketRef.current.emit("send_message", payload);
      console.log("[MatchesContext] Emitted send_message:", payload);
    } else {
      console.warn("[MatchesContext] Socket not connected — message not sent");
      const err = (lastChatErrorRef.current || "").toLowerCase();
      const isJwt =
        err.includes("unauthorized") || err.includes("token") || err.includes("jwt");
      const isDown =
        err.includes("websocket error") ||
        err.includes("xhr poll error") ||
        err.includes("timeout") ||
        err.includes("502") ||
        !lastChatErrorRef.current;

      Alert.alert(
        "Chat not connected",
        isJwt
          ? "Chat server rejected your login token. On BOTH Railway services (Hangora API + Chat) set the same JWT_SECRET with no quotes, redeploy both, then logout and login again in the app."
          : isDown
            ? "Chat server is down or unreachable (check Railway chat service is running — Start Command: npm run start:chat). Secret match nahi, server online hona chahiye."
            : `Chat connection failed: ${lastChatErrorRef.current}`
      );
      setConversations((prev) => {
        const next = prev.map((t) =>
          t.matchId === matchId
            ? { ...t, messages: t.messages.filter((m) => m.id !== tempId) }
            : t
        );
        persistChats(next);
        return next;
      });
    }
  };

  const markRead = useCallback(async (matchId: string) => {
    setConversations((prev) => {
      const thread = prev.find((t) => t.matchId === matchId);
      if (!thread) return prev;

      if (socketRef.current && !thread.isGroup) {
        socketRef.current.emit("mark_read", { matchId, isGroup: false });
      }

      const next = prev.map((t) =>
        t.matchId === matchId
          ? {
              ...t,
              unread: 0,
              messages: t.messages.map((m) =>
                !m.fromMe ? { ...m, isRead: true } : m
              ),
            }
          : t
      );
      persistChats(next);
      return next;
    });
  }, []);

  const deleteMessage = useCallback((messageId: string, matchId: string, isGroup?: boolean) => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("delete_message", { messageId, matchId, isGroup });
    setConversations((prev) => {
      const next = prev.map((t) => {
        if (t.matchId !== matchId) return t;
        const messages = t.messages.map((m) =>
          m.id === messageId ? { ...m, text: "[DELETED]" } : m
        );
        const last = messages[messages.length - 1];
        return {
          ...t,
          messages,
          lastMessage: last ? formatChatPreview(last.text) : t.lastMessage,
        };
      });
      persistChats(next);
      return next;
    });
  }, [user]);

  const isMatched = (userId: string) => matches.some((m) => m.id === userId);

  const sendTypingStatus = useCallback((matchId: string, isTyping: boolean) => {
    if (!socketRef.current || !user) return;
    const event = isTyping ? "typing" : "stop_typing";
    const payload = isTyping
      ? { matchId, senderId: user.id, senderName: user.name || "Someone" }
      : { matchId, senderId: user.id };
    socketRef.current.emit(event, payload);
  }, [user]);

  const updateMessageContent = useCallback((messageId: string, newContent: string, matchId: string, isGroup?: boolean) => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("update_message", {
      messageId,
      newContent,
      matchId,
      senderId: user.id,
      isGroup
    });
    // Also update locally to reflect immediately (optimistic UI)
    setConversations((prev) => {
      const next = prev.map((t) => {
        if (t.matchId === matchId) {
          return {
            ...t,
            messages: t.messages.map((m) => {
              if (m.id === messageId) {
                return { ...m, text: newContent };
              }
              return m;
            }),
            lastMessage: t.messages[t.messages.length - 1]?.id === messageId ? formatChatPreview(newContent) : t.lastMessage
          };
        }
        return t;
      });
      persistChats(next);
      return next;
    });
  }, [user]);

  return (
    <MatchesContext.Provider
      value={{
        deck,
        matches,
        conversations,
        likesCount,
        likesList,
        loading,
        hasGps,
        canRewind: !!lastSwipe,
        chatGates,
        refresh,
        swipe,
        rewind,
        updateDiscoverPrefs,
        isMatched,
        getConversation,
        getChatGate,
        sendMessage,
        unmatch,
        markRead,
        typingUsers,
        sendTypingStatus,
        updateMessageContent,
        deleteMessage,
      }}
    >
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatches() {
  const ctx = useContext(MatchesContext);
  if (!ctx) throw new Error("useMatches must be used within MatchesProvider");
  return ctx;
}
