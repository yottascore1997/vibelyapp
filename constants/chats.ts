export interface ChatMessage {
  id: string;
  text: string;
  sentAt: string;
  fromMe: boolean;
  senderName?: string;
  senderAvatar?: string;
  isRead?: boolean;
  replyToId?: string;
  replyToText?: string;
}

export interface ChatThread {
  matchId: string;
  matchName: string;
  avatarUrl: string;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  isVerified?: boolean;
  isGroup?: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  messages: ChatMessage[];
}

export function buildEmptyThread(
  matchId: string,
  matchName: string,
  avatarUrl: string,
  opts?: { isOnline?: boolean; isVerified?: boolean; lastSeenAt?: string | null }
): ChatThread {
  const now = new Date().toISOString();
  return {
    matchId,
    matchName,
    avatarUrl,
    isOnline: opts?.isOnline,
    lastSeenAt: opts?.lastSeenAt,
    isVerified: opts?.isVerified,
    lastMessage: "Say hi to start chatting",
    lastMessageAt: now,
    unread: 0,
    messages: [],
  };
}

/** @deprecated use buildEmptyThread — kept for any leftover imports */
export function buildStarterThread(
  matchId: string,
  matchName: string,
  avatarUrl: string,
  opts?: { isOnline?: boolean; isVerified?: boolean }
): ChatThread {
  return buildEmptyThread(matchId, matchName, avatarUrl, opts);
}

export function formatChatPreview(text: string): string {
  if (!text) return "";
  const photo = text.match(/^\[PHOTO:(.+)\]$/);
  if (photo) return "📷 Photo";

  const invite = text.match(/^\[INVITE:([^:]+):/);
  if (invite) return `☕ ${invite[1]} invite`;

  if (text.includes("[VibeSplit]")) return "💳 VibeSplit update";

  const reply = text.match(/^\[REPLY:[^\]]+\]([\s\S]*)$/);
  if (reply) return (reply[1] || "").trim() || "Reply";

  if (text === "[DELETED]") return "Message deleted";

  return text;
}

export function parseReplyPayload(text: string): {
  replyToId?: string;
  replyToText?: string;
  body: string;
} {
  const m = text.match(/^\[REPLY:([^|]+)\|([^\]]*)\]([\s\S]*)$/);
  if (!m) return { body: text };
  return {
    replyToId: m[1],
    replyToText: decodeURIComponent(m[2] || ""),
    body: m[3] || "",
  };
}

export function encodeReplyMessage(
  replyToId: string,
  replyToText: string,
  body: string
): string {
  const preview = encodeURIComponent((replyToText || "").slice(0, 80));
  return `[REPLY:${replyToId}|${preview}]${body}`;
}

export function parsePhotoUrl(text: string): string | null {
  const m = text.match(/^\[PHOTO:(.+)\]$/);
  return m ? m[1] : null;
}

export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function formatLastSeen(iso?: string | null): string {
  if (!iso) return "Offline";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Offline";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Last seen just now";
  if (diffMin < 60) return `Last seen ${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Last seen ${diffHr}h ago`;
  return `Last seen ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday.getTime() - startMsg.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function sameCalendarDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
