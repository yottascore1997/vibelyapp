import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import HangoutInviteModal, {
  HangoutInviteData,
} from "../components/plans/HangoutInviteModal";
import { useAuth } from "./AuthContext";
import { api, getActiveApiBase } from "../services/api";
import { resolveChatWsUrl } from "../constants/theme";

export interface NotificationItem {
  id: string;
  type: "invite" | "reaction" | "post" | "reminder";
  user?: {
    name: string;
    avatar?: string;
    badgeIcon?: string;
    badgeColor?: string;
  };
  titlePrefix?: string;
  titleUser?: string;
  titleAction?: string;
  titleHighlight?: string;
  titleSuffix?: string;
  subtitle: string;
  isHighlighted?: boolean;
  highlightColor?: string;
  isRead: boolean;
  buttonText?: string;
  route?: string;
  hangoutTitle?: string;
  category?: string;
  inviteData?: HangoutInviteData;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-2",
    type: "reaction",
    titleUser: "Kabir",
    titleAction: "reacted to your",
    titleHighlight: "Sunrise 5K",
    subtitle: "2h ago",
    user: {
      name: "Kabir",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      badgeIcon: "flame",
      badgeColor: "#3B82F6",
    },
    isHighlighted: false,
    isRead: false,
    route: "/hangout",
  },
  {
    id: "notif-3",
    type: "post",
    titleUser: "Meher",
    titleAction: "posted in",
    titleHighlight: "Office Gang",
    subtitle: "5h ago",
    user: {
      name: "Meher",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      badgeIcon: "chatbubble",
      badgeColor: "#8B5CF6",
    },
    isHighlighted: false,
    isRead: false,
    route: "/(tabs)/chats",
  },
  {
    id: "notif-4",
    type: "reminder",
    titlePrefix: "Your hang",
    titleHighlight: "Pottery class",
    titleSuffix: "is tomorrow",
    subtitle: "yesterday · 4:00 PM",
    user: {
      name: "Pottery",
      badgeIcon: "school-outline",
      badgeColor: "#EA580C",
    },
    isHighlighted: false,
    isRead: false,
    route: "/hangout",
  },
];

interface NotificationContextType {
  isOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  inviteModalData: HangoutInviteData | null;
  openInviteModal: (data?: HangoutInviteData) => void;
  closeInviteModal: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [inviteModalData, setInviteModalData] =
    useState<HangoutInviteData | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const openNotifications = () => setIsOpen(true);
  const closeNotifications = () => setIsOpen(false);
  const toggleNotifications = () => setIsOpen((prev) => !prev);

  const openInviteModal = useCallback((data?: HangoutInviteData) => {
    if (!data) return;
    setInviteModalData(data);
  }, []);

  const closeInviteModal = () => setInviteModalData(null);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Load real notifications and pending invites from backend
  const refreshNotifications = useCallback(async () => {
    if (!user || !token) return;
    try {
      const [res, invites] = await Promise.all([
        api.getNotifications().catch(() => []),
        api.getInvites().catch(() => []),
      ]);

      const formattedInvites: NotificationItem[] = [];
      if (Array.isArray(invites)) {
        for (const inv of invites) {
          if (inv.type === "received" && String(inv.status).toLowerCase() === "pending") {
            const realSender = inv.senderName || "Friend";
            formattedInvites.push({
              id: `invite-${inv.id}`,
              type: "invite",
              titleUser: realSender,
              titleAction: "invited you for",
              titleHighlight: inv.activityName || "hangout",
              subtitle: `now · ${inv.timeLabel || "Today"}`,
              category: (inv.activityName || "chai").toLowerCase(),
              user: {
                name: realSender,
                avatar: inv.senderAvatar,
                badgeIcon: "people",
                badgeColor: "#22C55E",
              },
              isHighlighted: true,
              highlightColor: "#22C55E",
              isRead: false,
              buttonText: "Open",
              route: "/hangout",
              hangoutTitle: `Down for ${inv.activityEmoji || "☕"} ${inv.activityName || "Chai"}?`,
              inviteData: {
                planId: inv.id,
                senderName: realSender,
                senderAvatar: inv.senderAvatar,
                category: (inv.activityName || "chai").toLowerCase(),
                location: "CHAYOS, GALLERIA",
                time: inv.timeLabel || "6 PM TODAY",
              },
            });
          }
        }
      }

      const serverNotifs = Array.isArray(res) ? res : [];
      const combined = [...formattedInvites, ...serverNotifs];
      if (combined.length > 0) {
        setNotifications((prev) => {
          // Merge server notifications with current, avoiding duplicates
          const serverIds = new Set(combined.map((r: any) => r.id));
          const localOnly = prev.filter((p) => !serverIds.has(p.id) && !p.id.startsWith("notif-"));
          return [...combined, ...localOnly];
        });
      }
    } catch (err) {
      console.warn("[NotificationContext] fetch notifications error:", err);
    }
  }, [user, token]);

  useEffect(() => {
    if (user && token) {
      refreshNotifications();
    }
  }, [user, token, refreshNotifications]);

  // Real-time socket listener for invites and notifications
  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const wsUrl = resolveChatWsUrl(getActiveApiBase());
    console.log(`[NotificationContext] Connecting to Socket for invites: ${wsUrl}`);

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
      console.log(`[NotificationContext] Socket connected: ${socket.id}`);
    });

    // Real-time Hangout Invite event
    socket.on("hangout:invite", (data: any) => {
      console.log("[NotificationContext] 🔔 Received hangout:invite:", data);
      
      const realSenderName =
        data.senderName ||
        data.user?.name ||
        data.sender?.name ||
        data.titleUser ||
        "Friend";
      const realSenderAvatar =
        data.senderAvatar ||
        data.user?.avatar ||
        data.sender?.profile?.avatarUrl;
      const category = (data.category || data.activityName || "chai").toLowerCase();
      const location = data.location || "CHAYOS, GALLERIA";
      const time = data.time || data.timeLabel || "6 PM TODAY";

      // 1. Immediately trigger the HangoutInviteModal popup!
      openInviteModal({
        planId: data.id || data.inviteId,
        senderName: realSenderName,
        senderAvatar: realSenderAvatar,
        category,
        location,
        time,
      });

      // 2. Prepend to notifications list
      const notifId = data.id ? `invite-${data.id}` : `invite-${Date.now()}`;
      const newNotif: NotificationItem = {
        id: notifId,
        type: "invite",
        titleUser: realSenderName,
        titleAction: "invited you for",
        titleHighlight: data.activityName || category,
        subtitle: `now · ${location} · ${time}`,
        user: {
          name: realSenderName,
          avatar: realSenderAvatar,
          badgeIcon: "people",
          badgeColor: "#22C55E",
        },
        isHighlighted: true,
        highlightColor: "#22C55E",
        isRead: false,
        buttonText: "Open",
        route: "/hangout",
        hangoutTitle: `Down for ${data.activityEmoji || "☕"} ${data.activityName || category}?`,
        category,
        inviteData: {
          planId: data.id || data.inviteId,
          senderName: realSenderName,
          senderAvatar: realSenderAvatar,
          category,
          location,
          time,
        },
      };

      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== notifId)]);
    });

    // Real-time Notification event
    socket.on("notification:new", (data: any) => {
      console.log("[NotificationContext] 🔔 Received notification:new:", data);
      const notifId = data.id || `notif-${Date.now()}`;
      const newNotif: NotificationItem = {
        id: notifId,
        type: data.type || "invite",
        titleUser: data.titleUser || data.senderName || "Friend",
        titleAction: data.titleAction || "invited you for",
        titleHighlight: data.titleHighlight || "hangout",
        subtitle: data.subtitle || "just now",
        user: data.user || {
          name: data.senderName || "Friend",
          avatar: data.senderAvatar,
          badgeIcon: "people",
          badgeColor: "#22C55E",
        },
        isHighlighted: true,
        highlightColor: data.highlightColor || "#22C55E",
        isRead: false,
        buttonText: data.buttonText || "Open",
        route: data.route || "/hangout",
        hangoutTitle: data.hangoutTitle,
        category: data.category,
      };

      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== notifId)]);

      if (data.inviteData) {
        openInviteModal(data.inviteData);
      }
    });

    // Real-time Hangout Accepted event
    socket.on("hangout:accepted", (data: any) => {
      console.log("[NotificationContext] 🔔 Received hangout:accepted:", data);
      const accId = `acc-${data.inviteId || Date.now()}`;
      const newNotif: NotificationItem = {
        id: accId,
        type: "reaction",
        titleUser: data.receiverName || "Friend",
        titleAction: "joined your",
        titleHighlight: data.activityName || "hangout",
        subtitle: "just now",
        user: {
          name: data.receiverName || "Friend",
          avatar: data.receiverAvatar,
          badgeIcon: "checkmark-circle",
          badgeColor: "#22C55E",
        },
        isHighlighted: true,
        highlightColor: "#22C55E",
        isRead: false,
        route: data.hangoutId ? `/plan-details?id=${data.hangoutId}` : "/hangout",
      };

      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== accId)]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token, openInviteModal]);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        isHighlighted: false,
      }))
    );
    api.markAllNotificationsRead().catch(() => {});
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, isHighlighted: false } : n))
    );
    api.markNotificationRead(id).catch(() => {});
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    api.deleteNotification(id).catch(() => {});
  };

  return (
    <NotificationContext.Provider
      value={{
        isOpen,
        openNotifications,
        closeNotifications,
        toggleNotifications,
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        dismissNotification,
        inviteModalData,
        openInviteModal,
        closeInviteModal,
        refreshNotifications,
      }}
    >
      {children}
      <HangoutInviteModal
        visible={!!inviteModalData}
        onClose={closeInviteModal}
        data={inviteModalData}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
