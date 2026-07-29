/** Client-side mirror of server match opener rules (1 message → 48h reply or expire, permanently unlocks once replied). */

export const MATCH_REPLY_WINDOW_MS = 48 * 60 * 60 * 1000;

export type ChatGate = {
  unlocked: boolean;
  canSend: boolean;
  waitingForOther: boolean;
  mustSendOpener: boolean;
  expired: boolean;
  expiresAt: string | null;
  reason: string | null;
};

export function evaluateLocalChatGate(params: {
  userId: string;
  matchedAt?: string | null;
  messages: { fromMe: boolean; sentAt: string }[];
}): ChatGate {
  const now = Date.now();
  const myCount = params.messages.filter((m) => m.fromMe).length;
  const theirCount = params.messages.filter((m) => !m.fromMe).length;

  if (myCount >= 1 && theirCount >= 1) {
    return {
      unlocked: true,
      canSend: true,
      waitingForOther: false,
      mustSendOpener: false,
      expired: false,
      expiresAt: null,
      reason: null,
    };
  }

  if (params.messages.length === 0) {
    const base = params.matchedAt ? new Date(params.matchedAt).getTime() : now;
    const expiresAt = new Date(base + MATCH_REPLY_WINDOW_MS).toISOString();
    const expired = now > new Date(expiresAt).getTime();
    return {
      unlocked: false,
      canSend: !expired,
      waitingForOther: false,
      mustSendOpener: !expired,
      expired,
      expiresAt,
      reason: expired
        ? "Match expired — no message within 48 hours"
        : "Send one hello — they have 48 hours to reply",
    };
  }

  const first = [...params.messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  )[0];
  const expiresAt = new Date(
    new Date(first.sentAt).getTime() + MATCH_REPLY_WINDOW_MS
  ).toISOString();
  const expired = now > new Date(expiresAt).getTime();

  if (expired) {
    return {
      unlocked: false,
      canSend: false,
      waitingForOther: false,
      mustSendOpener: false,
      expired: true,
      expiresAt,
      reason: "Match expired — no reply within 48 hours",
    };
  }

  if (myCount >= 1 && theirCount === 0) {
    return {
      unlocked: false,
      canSend: false,
      waitingForOther: true,
      mustSendOpener: false,
      expired: false,
      expiresAt,
      reason: "Waiting for their reply (48h) — then chat unlocks permanently",
    };
  }

  return {
    unlocked: false,
    canSend: true,
    waitingForOther: false,
    mustSendOpener: false,
    expired: false,
    expiresAt,
    reason: "Reply to unlock the chat permanently — or match expires in 48h",
  };
}
