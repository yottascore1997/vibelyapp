export interface PlanParticipant {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface PlanRequest {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface Plan {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  distance?: number;
  scheduledAt?: string;
  time?: string;
  timeLabel?: string;
  maxParticipants: number;
  going: number;
  status?: string;
  imageUrl?: string | null;
  activity?: string;
  badge?: string;
  color?: string;
  creatorId: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  visibility?: "PUBLIC" | "FRIENDS" | string;
  isPrivate?: boolean;
  participants?: PlanParticipant[];
  requests?: PlanRequest[];
}

export const PLAN_ACTIVITIES = [
  { id: "coffee", name: "Coffee", emoji: "☕", color: "#FEF3C7", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop" },
  { id: "travel", name: "Travel / Trip", emoji: "✈️", color: "#E0F2FE", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop" },
  { id: "food", name: "Food", emoji: "🍕", color: "#FFEDD5", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop" },
  { id: "biryani", name: "Biryani", emoji: "🍛", color: "#FEE2E2", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop" },
  { id: "beer", name: "Beer", emoji: "🍺", color: "#FEF9C3", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop" },
  { id: "sutta", name: "Sutta", emoji: "🚬", color: "#F3F4F6", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop" },
  { id: "movie", name: "Movie", emoji: "🎬", color: "#E0E7FF", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop" },
  { id: "sports", name: "Sports", emoji: "🏸", color: "#DCFCE7", image: "https://images.unsplash.com/photo-1531415075278-85f41f894b20?w=400&h=300&fit=crop" },
  { id: "drinks", name: "Drinks", emoji: "🍸", color: "#FCE7F3", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop" },
];

export const TIME_OPTIONS = [
  { id: "now", label: "Now", sub: "Let's go!", minutes: 0 },
  { id: "30min", label: "+30 Min", sub: "", minutes: 30 },
  { id: "1hr", label: "+1 Hr", sub: "", minutes: 60 },
  { id: "6pm", label: "6 PM", sub: "Today", minutes: -1 },
];

export function getScheduledDate(timeId: string): Date {
  const now = new Date();
  const opt = TIME_OPTIONS.find((t) => t.id === timeId);
  if (!opt) return now;
  if (opt.id === "6pm") {
    const d = new Date(now);
    d.setHours(18, 0, 0, 0);
    if (d < now) d.setDate(d.getDate() + 1);
    return d;
  }
  return new Date(now.getTime() + opt.minutes * 60000);
}

export const DATE_OPTIONS = [
  { id: "today", label: "Today", emoji: "📅" },
  { id: "tomorrow", label: "Tomorrow", emoji: "🌅" },
  { id: "custom", label: "Pick Date", emoji: "🗓️" },
];

export function buildScheduledAt(opts: {
  timeId?: string;
  dateId?: string;
  customDate?: string;
  customTime?: string;
}): Date {
  const now = new Date();
  const hasSchedule = Boolean(opts.dateId || opts.timeId || opts.customDate || opts.customTime);
  if (!hasSchedule) return now;

  const base = new Date();
  const dateId = opts.dateId || "today";

  if (dateId === "tomorrow") {
    base.setDate(base.getDate() + 1);
  } else if (dateId === "custom" && opts.customDate?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = opts.customDate.split("-").map(Number);
    base.setFullYear(y, m - 1, d);
  }

  if (opts.customTime?.match(/^\d{1,2}:\d{2}$/)) {
    const [h, min] = opts.customTime.split(":").map(Number);
    base.setHours(h, min, 0, 0);
    return base;
  }

  const timeId = opts.timeId || "now";
  if (timeId === "now") {
    if (dateId === "today") return now;
    base.setHours(now.getHours(), now.getMinutes(), 0, 0);
    return base;
  }

  if (timeId === "6pm") {
    base.setHours(18, 0, 0, 0);
    if (dateId === "today" && base < now) base.setDate(base.getDate() + 1);
    return base;
  }

  const opt = TIME_OPTIONS.find((t) => t.id === timeId);
  if (opt && dateId === "today") {
    return new Date(now.getTime() + opt.minutes * 60000);
  }

  if (opt?.id === "30min") base.setHours(now.getHours(), now.getMinutes() + 30, 0, 0);
  else if (opt?.id === "1hr") base.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);
  else base.setHours(18, 0, 0, 0);

  return base;
}

export function formatPlanSchedule(opts: {
  timeId?: string;
  dateId?: string;
  customDate?: string;
  customTime?: string;
}): { timeLabel: string; dateLabel: string } {
  const hasSchedule = Boolean(opts.dateId || opts.timeId || opts.customDate || opts.customTime);
  if (!hasSchedule) {
    return { timeLabel: "Flexible", dateLabel: "Anytime" };
  }

  const d = buildScheduledAt(opts);
  const dateLabel =
    opts.dateId === "tomorrow"
      ? "Tomorrow"
      : opts.dateId === "custom" && opts.customDate
        ? new Date(opts.customDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : opts.dateId
          ? "Today"
          : "Anytime";

  let timeLabel = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (opts.customTime) {
    timeLabel = opts.customTime;
  } else if (opts.timeId === "now" && (opts.dateId === "today" || !opts.dateId)) {
    timeLabel = "Right now";
  } else if (opts.timeId === "30min") timeLabel = "In 30 min";
  else if (opts.timeId === "1hr") timeLabel = "In 1 hour";
  else if (opts.timeId === "6pm") timeLabel = "6 PM";
  else if (!opts.timeId) timeLabel = "Flexible";

  return { timeLabel, dateLabel };
}

export function formatTimeOption(timeId: string): string {
  const d = getScheduledDate(timeId);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}
