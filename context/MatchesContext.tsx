import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
import { usePlans } from "./PlansContext";
import { DiscoverProfile, MatchProfile, SwipeAction } from "../constants/matches";
import { ChatThread, buildStarterThread } from "../constants/chats";
import { ChatGate, evaluateLocalChatGate } from "../constants/chatGate";
import { API_URL } from "../constants/theme";
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
  chatGates: Record<string, ChatGate>;
  refresh: (mode?: "friends" | "dating" | "everyone") => Promise<void>;
  swipe: (receiverId: string, action: SwipeAction) => Promise<{ isMatch: boolean; profile?: DiscoverProfile }>;
  isMatched: (userId: string) => boolean;
  getConversation: (matchId: string) => ChatThread | undefined;
  getChatGate: (matchId: string) => ChatGate | null;
  sendMessage: (matchId: string, text: string) => Promise<void>;
  unmatch: (otherUserId: string) => Promise<void>;
  markRead: (matchId: string) => Promise<void>;
  typingUsers: Record<string, { userId: string; name: string }[]>;
  sendTypingStatus: (matchId: string, isTyping: boolean) => void;
  updateMessageContent: (messageId: string, newContent: string, matchId: string, isGroup?: boolean) => void;
}

const MatchesContext = createContext<MatchesContextType | null>(null);

function syncThreads(matches: MatchProfile[], stored: ChatThread[]): ChatThread[] {
  const threads: ChatThread[] = [...stored];

  for (const m of matches) {
    if (!threads.some((t) => t.matchId === m.id)) {
      threads.push(
        buildStarterThread(m.id, m.name, m.avatarUrl, {
          isOnline: m.isOnline,
          isVerified: m.isVerified,
        })
      );
    } else {
      const idx = threads.findIndex((t) => t.matchId === m.id);
      threads[idx] = {
        ...threads[idx],
        matchName: m.name,
        avatarUrl: m.avatarUrl,
        isOnline: m.isOnline,
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

  const [typingUsers, setTypingUsers] = useState<Record<string, { userId: string; name: string }[]>>({});

  const [socketConnected, setSocketConnected] = useState(false);
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
      const [profiles, matchList, likes] = await Promise.all([
        soft(api.getDiscoverProfiles(user.id, mode, "Nagpur")),
        soft(api.getMatches(user.id)),
        soft(api.getLikes(user.id)),
        soft(refreshPlans()),
      ]);

      const resolveAvatar = (url?: string | null) => {
        if (url) {
          if (url.startsWith("/")) {
            const { API_URL } = require("../constants/theme");
            const serverBaseUrl = API_URL.replace("/api", "");
            return `${serverBaseUrl}${url}`;
          }
          return url;
        }
        return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";
      };

      const apiMatches = ((matchList as MatchProfile[]) || []).map((m) => ({
        ...m,
        avatarUrl: resolveAvatar(m.avatarUrl),
      }));

      const mergedMatches = [
        ...localMatches,
        ...apiMatches.filter((m) => !localMatches.some((x) => x.id === m.id)),
      ].filter((m) => m.id !== user.id);
      setMatches(mergedMatches);
      setLikesCount(likes?.count ?? 0);

      const apiLikes = ((likes?.likes as any[]) || []).map((l) => ({
        ...l,
        avatarUrl: resolveAvatar(l.avatarUrl),
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
                const messages = serverMsgs.map((m: any) => ({
                  id: m.id,
                  text: m.text,
                  sentAt: m.sentAt,
                  fromMe: m.senderId === user.id,
                  senderName: m.senderName,
                  senderAvatar: m.senderAvatar,
                }));

                const lastMsgText = messages[messages.length - 1]?.text || t.lastMessage;
                const lastMsgTime = messages[messages.length - 1]?.sentAt || t.lastMessageAt;

                return {
                  ...t,
                  messages: messages.length > 0 ? messages : t.messages,
                  lastMessage: lastMsgText,
                  lastMessageAt: lastMsgTime,
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
            const messages = list.map((m: any) => ({
              id: m.id,
              text: m.text,
              sentAt: m.sentAt,
              fromMe: m.senderId === user.id,
            }));

            const lastMsgText = messages[messages.length - 1]?.text || t.lastMessage;
            const lastMsgTime = messages[messages.length - 1]?.sentAt || t.lastMessageAt;

            return {
              ...t,
              messages,
              lastMessage: lastMsgText,
              lastMessageAt: lastMsgTime,
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

      let nextDeck = ((profiles as DiscoverProfile[]) || []).map((p) => ({
        ...p,
        avatarUrl: resolveAvatar(p.avatarUrl),
      }));
      nextDeck = nextDeck.filter((p) => !swiped.includes(p.id) && !keptMatches.some((m) => m.id === p.id));

      setDeck(nextDeck);
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
            unread: 1,
            lastMessage: `Group chat activated for: ${plan.title}! 🎉`,
            lastMessageAt: now,
            messages: [
              {
                id: `group-${plan.id}-starter`,
                text: `Welcome! Plan is created. Members can now coordinate here 🍿`,
                sentAt: new Date(Date.now() - 60000).toISOString(),
                fromMe: false,
              }
            ],
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

    const thread = buildStarterThread(matchProfile.id, matchProfile.name, matchProfile.avatarUrl, {
      isOnline: matchProfile.isOnline,
      isVerified: matchProfile.isVerified,
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
    const newSwiped = [...swipedIds, receiverId];
    setSwipedIds(newSwiped);
    setDeck((d) => d.filter((p) => p.id !== receiverId));
    await AsyncStorage.setItem(STORAGE_SWIPED, JSON.stringify(newSwiped));

    let isMatch = false;

    if (user) {
      try {
        const res = await api.swipe({ receiverId, action });
        // Never invent matches — ignore demo / failed responses
        isMatch = !!res?.isMatch && !res?.demo;

        if (isMatch && profile) {
          const matchProfile: MatchProfile = { ...profile, matchedAt: new Date().toISOString() };
          await addMatch(matchProfile);
          return { isMatch, profile };
        }
      } catch (err) {
        console.error("Swipe failed:", err);
      }
    }

    return { isMatch: false, profile };
  };

  // Manage real-time socket connection lifecycle
  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const base = API_URL.replace("/api", "");
    const wsUrl = base.replace(":3000", ":3001");
    console.log(`[MatchesContext] Connecting to Chat WebSocket: ${wsUrl}`);

    const socket = io(wsUrl, {
      transports: ["websocket"],
      forceNew: true,
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[MatchesContext] Chat WebSocket connected: ${socket.id}`);
      setSocketConnected(true);
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

    socket.on("new_message", (payload: { id: string; text: string; sentAt: string; senderId: string; matchId: string; senderName?: string; senderAvatar?: string }) => {
      console.log("[MatchesContext] Socket received new_message:", payload);
      const { matchId, id, text, sentAt, senderId, senderName, senderAvatar } = payload;
      const fromMe = senderId === user.id;
      const threadKey = fromMe ? matchId : senderId;

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
                };
                return {
                  ...t,
                  messages: updated,
                  lastMessage: text,
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
                      ? { ...m, id }
                      : m
                  ),
                };
              }

              const msg = {
                id,
                text,
                sentAt,
                fromMe,
                senderName,
                senderAvatar,
              };

              return {
                ...t,
                messages: [...t.messages, msg],
                lastMessage: text,
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
              lastMessage: t.messages[t.messages.length - 1]?.id === id ? text : t.lastMessage
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
    const msg = { id: tempId, text: trimmed, sentAt: now, fromMe: true };

    // Optimistically update local thread state
    setConversations((prev) => {
      const next = prev.map((t) =>
        t.matchId === matchId
          ? { ...t, messages: [...t.messages, msg], lastMessage: trimmed, lastMessageAt: now, unread: 0 }
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

    // Emit live message over the socket connection
    if (socketRef.current) {
      const payload = {
        matchId,
        senderId: user.id,
        content: trimmed,
        isGroup,
      };
      socketRef.current.emit("send_message", payload);
      console.log("[MatchesContext] Emitted send_message:", payload);
    } else {
      console.warn("[MatchesContext] Socket not connected");
      Alert.alert("Offline", "Connect to the internet to send messages.");
      // Roll back optimistic message
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
      if (!thread || thread.unread === 0) return prev;

      const next = prev.map((t) => (t.matchId === matchId ? { ...t, unread: 0 } : t));
      persistChats(next);
      return next;
    });
  }, []);

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
            lastMessage: t.messages[t.messages.length - 1]?.id === messageId ? newContent : t.lastMessage
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
        chatGates,
        refresh,
        swipe,
        isMatched,
        getConversation,
        getChatGate,
        sendMessage,
        unmatch,
        markRead,
        typingUsers,
        sendTypingStatus,
        updateMessageContent,
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
