/** Beautiful WhatsApp / share copy for hangout invites */

export function hangoraInviteUrl(code: string) {
  const clean = String(code || "").trim();
  if (!clean) return "";
  return `https://www.hangora.app/p/${clean}`;
}

export function hangoraAppInviteUrl(code: string) {
  const clean = String(code || "").trim();
  return `vibematch://p/${clean}`;
}

/** Pull invite code from API payload or /p/CODE url */
export function extractInviteCode(pub: any): string | null {
  if (!pub || typeof pub !== "object") return null;
  const direct =
    pub.inviteCode ||
    pub.code ||
    pub.data?.inviteCode ||
    pub.invite?.inviteCode;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const url = String(pub.inviteUrl || pub.url || pub.data?.inviteUrl || "");
  const m = url.match(/\/p\/([A-Za-z0-9_-]+)/i);
  return m?.[1] || null;
}

/** Always returns https://www.hangora.app/p/{code} or null */
export function resolveRsvpInviteUrl(pub: any): string | null {
  const code = extractInviteCode(pub);
  if (!code) return null;
  return hangoraInviteUrl(code);
}

export function buildHangoutInviteShareMessage(opts: {
  senderName?: string | null;
  activityName: string;
  activityEmoji: string;
  timeLabel: string;
  location?: string | null;
  inviteUrl: string;
  inviteeName?: string | null;
}) {
  const who = (opts.senderName || "A friend").trim().split(" ")[0] || "A friend";
  const greeting = opts.inviteeName?.trim()
    ? `Hey ${opts.inviteeName.trim()}! 👋`
    : `Hey! 👋`;
  const place = opts.location?.trim() ? `\n📍 ${opts.location.trim()}` : "";

  // Must be https://www.hangora.app/p/{code} — web RSVP page for guests without the app
  return (
    `${greeting}\n\n` +
    `✨ *You're invited on Hangora*\n\n` +
    `${opts.activityEmoji} *${opts.activityName} Hangout*\n` +
    `🕐 ${opts.timeLabel}${place}\n\n` +
    `${who} wants you to join this hang.\n\n` +
    `👉 *Tap to open invite & RSVP* (works in browser even without the app):\n` +
    `${opts.inviteUrl}\n\n` +
    `See you there 💫`
  );
}

export function buildWhatsAppShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
