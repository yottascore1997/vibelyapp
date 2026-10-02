import React, { createContext, useContext, useState, useMemo } from "react";

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
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "invite",
    titleUser: "Aanya",
    titleAction: "invited you for",
    titleHighlight: "sutta",
    subtitle: "now · Chayos, Galleria · 6 PM",
    user: {
      name: "Aanya",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      badgeIcon: "people",
      badgeColor: "#22C55E",
    },
    isHighlighted: true,
    highlightColor: "#22C55E",
    isRead: false,
    buttonText: "Open",
    route: "/hangout",
    hangoutTitle: "Sutta & Chai Chill",
  },
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

  const openNotifications = () => setIsOpen(true);
  const closeNotifications = () => setIsOpen(false);
  const toggleNotifications = () => setIsOpen((prev) => !prev);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        isHighlighted: false,
      }))
    );
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
      }}
    >
      {children}
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
