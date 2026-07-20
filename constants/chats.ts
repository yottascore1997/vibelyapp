export interface ChatMessage {
  id: string;
  text: string;
  sentAt: string;
  fromMe: boolean;
}

export interface ChatThread {
  matchId: string;
  matchName: string;
  avatarUrl: string;
  isOnline?: boolean;
  isVerified?: boolean;
  isGroup?: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  messages: ChatMessage[];
}

export function buildStarterThread(
  matchId: string,
  matchName: string,
  avatarUrl: string,
  opts?: { isOnline?: boolean; isVerified?: boolean }
): ChatThread {
  const now = Date.now();
  const first = matchName.split(" ")[0];
  return {
    matchId,
    matchName,
    avatarUrl,
    isOnline: opts?.isOnline,
    isVerified: opts?.isVerified,
    lastMessage: `Hey ${first}! Match hua 🎉`,
    lastMessageAt: new Date(now - 120000).toISOString(),
    unread: 1,
    messages: [
      {
        id: `${matchId}-m1`,
        text: `Hey! Glad we matched 💘`,
        sentAt: new Date(now - 300000).toISOString(),
        fromMe: false,
      },
      {
        id: `${matchId}-m2`,
        text: `Hey ${first}! Match hua 🎉`,
        sentAt: new Date(now - 120000).toISOString(),
        fromMe: false,
      },
    ],
  };
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
