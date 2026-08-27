import { Alert } from "react-native";
import { api } from "../services/api";

const REPORT_REASONS: { id: string; label: string }[] = [
  { id: "spam", label: "Spam or scam" },
  { id: "harassment", label: "Harassment" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "fake", label: "Fake profile" },
  { id: "underage", label: "Underage" },
  { id: "other", label: "Something else" },
];

export function promptReportUser(userId: string, onDone?: () => void) {
  Alert.alert(
    "Report profile",
    "Why are you reporting this person?",
    [
      ...REPORT_REASONS.map((r) => ({
        text: r.label,
        onPress: () => {
          api
            .reportUser({ userId, reason: r.id })
            .then(() => {
              Alert.alert("Thanks", "We received your report and will review it.");
              onDone?.();
            })
            .catch((e) => {
              Alert.alert("Error", e instanceof Error ? e.message : "Could not submit report");
            });
        },
      })),
      { text: "Cancel", style: "cancel" as const },
    ]
  );
}

export function promptBlockUser(
  userId: string,
  opts?: { name?: string; alsoUnmatch?: () => Promise<void>; onDone?: () => void }
) {
  const who = opts?.name ? opts.name.split(" ")[0] : "this person";
  Alert.alert(
    "Block user?",
    `${who} won't be able to message or see you. This also removes the match.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            await api.blockUser(userId);
            if (opts?.alsoUnmatch) await opts.alsoUnmatch();
            Alert.alert("Blocked", `${who} has been blocked.`);
            opts?.onDone?.();
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not block user");
          }
        },
      },
    ]
  );
}

export function showSafetyMenu(opts: {
  userId: string;
  name?: string;
  onUnmatch?: () => void;
  onDone?: () => void;
  alsoUnmatchOnBlock?: () => Promise<void>;
}) {
  Alert.alert("Safety", undefined, [
    opts.onUnmatch
      ? { text: "Unmatch", style: "destructive" as const, onPress: opts.onUnmatch }
      : null,
    {
      text: "Report",
      onPress: () => promptReportUser(opts.userId, opts.onDone),
    },
    {
      text: "Block",
      style: "destructive" as const,
      onPress: () =>
        promptBlockUser(opts.userId, {
          name: opts.name,
          alsoUnmatch: opts.alsoUnmatchOnBlock,
          onDone: opts.onDone,
        }),
    },
    { text: "Cancel", style: "cancel" as const },
  ].filter(Boolean) as any);
}

/** Suggested openers for new matches */
export const ICEBREAKERS = [
  "Hey! What's your go-to weekend plan? ☕",
  "Your profile made me smile — what's one thing you're into lately?",
  "Quick one: coffee or a sunset walk?",
  "If we hang this week, what should we do?",
  "What's the best place in your city right now?",
];
