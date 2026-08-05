import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { usePlans } from "../../context/PlansContext";
import { api } from "../../services/api";
import JoinHangInviteModal, {
  IncomingInvite,
  JoinedHangInfo,
} from "./JoinHangInviteModal";

const SEEN_KEY = "hang_invite_popup_seen_v1";
const JOINED_SEEN_KEY = "hang_joined_popup_seen_v1";
const JOINED_SEEDED_KEY = "hang_joined_popup_seeded_v1";
const REMINDER_KEY = "hang_reminders_fired_v1";
const POLL_MS = 4000;

function resolveAvatar(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("/")) {
    const { API_URL } = require("../../constants/theme");
    return `${API_URL.replace("/api", "")}${url}`;
  }
  return url;
}

export default function IncomingInviteWatcher() {
  const { user, token } = useAuth();
  const { refresh: refreshPlans, myPlans } = usePlans();
  const router = useRouter();
  const [invite, setInvite] = useState<IncomingInvite | null>(null);
  const [joined, setJoined] = useState<JoinedHangInfo | null>(null);
  const [phase, setPhase] = useState<"invite" | "joined">("invite");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingHangoutId, setPendingHangoutId] = useState<string | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const [storageReady, setStorageReady] = useState(false);
  const joinedSeenRef = useRef<Set<string>>(new Set());
  const reminderFiredRef = useRef<Set<string>>(new Set());
  const joinedSeededRef = useRef(false);
  const statusMapRef = useRef<Map<string, string>>(new Map());
  const statusBootRef = useRef(false);
  const busyRef = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      try {
        const [seen, joinedSeen, reminded, seeded] = await AsyncStorage.multiGet([
          SEEN_KEY,
          JOINED_SEEN_KEY,
          REMINDER_KEY,
          JOINED_SEEDED_KEY,
        ]);
        if (seen[1]) seenRef.current = new Set(JSON.parse(seen[1]));
        if (joinedSeen[1]) joinedSeenRef.current = new Set(JSON.parse(joinedSeen[1]));
        if (reminded[1]) reminderFiredRef.current = new Set(JSON.parse(reminded[1]));
        joinedSeededRef.current = seeded[1] === "1";
      } catch {
        /* ignore */
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  const persistSet = async (key: string, set: Set<string>) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify([...set]));
    } catch {
      /* ignore */
    }
  };

  const showJoined = (info: JoinedHangInfo, key: string) => {
    if (joinedSeenRef.current.has(key)) return;
    joinedSeenRef.current.add(key);
    persistSet(JOINED_SEEN_KEY, joinedSeenRef.current);
    setJoined(info);
    setPhase("joined");
    setPendingHangoutId(info.hangoutId || null);
    setVisible(true);
  };

  const checkPending = useCallback(async () => {
    if (!user || !token || busyRef.current || visible || !storageReady) return;
    try {
      const list = (await api.getInvites()) as any[] | null;
      if (!Array.isArray(list)) return;

      // One-time: mark already-accepted sent invites as seen so old joins don't spam
      if (!joinedSeededRef.current) {
        for (const i of list) {
          if (i.type === "sent" && String(i.status).toLowerCase() === "accepted") {
            joinedSeenRef.current.add(`sent-${i.id}`);
          }
        }
        joinedSeededRef.current = true;
        await persistSet(JOINED_SEEN_KEY, joinedSeenRef.current);
        try {
          await AsyncStorage.setItem(JOINED_SEEDED_KEY, "1");
        } catch {
          /* ignore */
        }
      }

      // Snapshot statuses once, then watch pending → accepted for sender celebration
      if (!statusBootRef.current) {
        for (const i of list) {
          statusMapRef.current.set(i.id, String(i.status).toLowerCase());
        }
        statusBootRef.current = true;

        // Accept happened while app was closed → still celebrate
        const cutoff = Date.now() - 45 * 60 * 1000;
        const missed = list
          .filter((i) => {
            if (i.type !== "sent") return false;
            if (String(i.status).toLowerCase() !== "accepted") return false;
            if (joinedSeenRef.current.has(`sent-${i.id}`)) return false;
            const t = new Date(i.updatedAt || i.createdAt || 0).getTime();
            return Number.isFinite(t) && t >= cutoff;
          })
          .sort(
            (a, b) =>
              new Date(b.updatedAt || b.createdAt || 0).getTime() -
              new Date(a.updatedAt || a.createdAt || 0).getTime()
          );
        if (missed[0]) {
          const a = missed[0];
          showJoined(
            {
              partnerName: a.recipientName || "Friend",
              partnerAvatar: resolveAvatar(a.recipientAvatar),
              myAvatar: resolveAvatar(user?.avatarUrl),
              activityName: a.activityName,
              activityEmoji: a.activityEmoji,
              timeLabel: a.timeLabel,
              hangoutId: a.hangoutId || null,
            },
            `sent-${a.id}`
          );
          refreshPlans().catch(() => undefined);
          return;
        }
      }

      // Active RPS settle — both players (incl. counter sender)
      const settleLive = list
        .filter(
          (i) =>
            !!i.isCounter &&
            String(i.status).toLowerCase() === "pending" &&
            i.settle?.status === "playing" &&
            !seenRef.current.has(`settle-${i.id}`)
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime()
        );

      if (settleLive[0]) {
        const next = settleLive[0];
        setInvite({
          id: next.id,
          senderName: next.senderName || "Someone",
          senderAvatar: resolveAvatar(next.senderAvatar),
          recipientName: next.recipientName,
          activityName: next.activityName,
          activityEmoji: next.activityEmoji,
          timeLabel: next.timeLabel,
          isCounter: true,
          status: next.status,
          type: next.type,
          parentActivity: next.parentActivity || null,
          settle: next.settle || null,
        });
        setPhase("invite");
        setJoined(null);
        setVisible(true);
        for (const i of list) {
          statusMapRef.current.set(i.id, String(i.status).toLowerCase());
        }
        return;
      }

      // Incoming pending invite
      const pending = list
        .filter(
          (i) =>
            i.type === "received" &&
            String(i.status).toLowerCase() === "pending" &&
            !seenRef.current.has(i.id)
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

      if (pending[0]) {
        const next = pending[0];
        setInvite({
          id: next.id,
          senderName: next.senderName || "Someone",
          senderAvatar: resolveAvatar(next.senderAvatar),
          recipientName: next.recipientName,
          activityName: next.activityName,
          activityEmoji: next.activityEmoji,
          timeLabel: next.timeLabel,
          isCounter: !!next.isCounter,
          status: next.status,
          type: next.type,
          parentActivity: next.parentActivity || null,
          settle: next.settle || null,
        });
        setPhase("invite");
        setJoined(null);
        setVisible(true);
        for (const i of list) {
          statusMapRef.current.set(i.id, String(i.status).toLowerCase());
        }
        return;
      }

      // Sender: friend just joined while app is open → same celebration
      const newlyAccepted = list.filter((i) => {
        if (i.type !== "sent") return false;
        const cur = String(i.status).toLowerCase();
        const prev = statusMapRef.current.get(i.id);
        statusMapRef.current.set(i.id, cur);
        if (cur !== "accepted") return false;
        if (joinedSeenRef.current.has(`sent-${i.id}`)) return false;
        return !!prev && prev !== "accepted";
      });

      newlyAccepted.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );

      if (newlyAccepted[0]) {
        const a = newlyAccepted[0];
        showJoined(
          {
            partnerName: a.recipientName || "Friend",
            partnerAvatar: resolveAvatar(a.recipientAvatar),
            myAvatar: resolveAvatar(user?.avatarUrl),
            activityName: a.activityName,
            activityEmoji: a.activityEmoji,
            timeLabel: a.timeLabel,
            hangoutId: a.hangoutId || null,
          },
          `sent-${a.id}`
        );
        refreshPlans().catch(() => undefined);
      }
    } catch {
      /* soft fail */
    }
  }, [user, token, visible, refreshPlans, storageReady]);

  useEffect(() => {
    if (!user || !token || !storageReady) return;
    checkPending();
    const timer = setInterval(checkPending, POLL_MS);
    return () => clearInterval(timer);
  }, [user, token, storageReady, checkPending]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        checkPending();
        refreshPlans().catch(() => undefined);
      }
      appState.current = next;
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [checkPending, refreshPlans]);

  // 10-minute hang reminder for accepted plans
  useEffect(() => {
    if (!user) return;
    const tick = () => {
      const now = Date.now();
      for (const plan of myPlans || []) {
        if (!plan.scheduledAt || !plan.id) continue;
        const when = new Date(plan.scheduledAt).getTime();
        const mins = (when - now) / 60000;
        if (mins > 0 && mins <= 10 && !reminderFiredRef.current.has(plan.id)) {
          reminderFiredRef.current.add(plan.id);
          persistSet(REMINDER_KEY, reminderFiredRef.current);
          Alert.alert(
            "Hang in 10 min ⏰",
            `${plan.title || "Your hang"} starts soon · ${plan.timeLabel || ""}`.trim(),
            [
              { text: "Later", style: "cancel" },
              {
                text: "Open",
                onPress: () => router.push(`/plan-details?id=${plan.id}`),
              },
            ]
          );
        }
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [myPlans, user, router]);

  const close = async (markSeen = true) => {
    if (invite && markSeen && phase === "invite") {
      seenRef.current.add(invite.id);
      await persistSet(SEEN_KEY, seenRef.current);
    }
    setVisible(false);
    setInvite(null);
    setJoined(null);
    setPhase("invite");
    setLoading(false);
    busyRef.current = false;
  };

  const showJoinCelebration = async (
    inviteId: string,
    data: {
      activityName?: string;
      activityEmoji?: string;
      timeLabel?: string;
      hangoutId?: string | null;
      partnerName?: string | null;
      partnerAvatar?: string | null;
    }
  ) => {
    seenRef.current.add(inviteId);
    await persistSet(SEEN_KEY, seenRef.current);
    await refreshPlans().catch(() => undefined);

    const info: JoinedHangInfo = {
      partnerName: data.partnerName || invite?.senderName || "Friend",
      partnerAvatar: resolveAvatar(data.partnerAvatar) || invite?.senderAvatar,
      myAvatar: resolveAvatar(user?.avatarUrl),
      activityName: data.activityName || invite?.activityName || "Hang",
      activityEmoji: data.activityEmoji || invite?.activityEmoji || "✨",
      timeLabel: data.timeLabel || invite?.timeLabel || "",
      hangoutId: data.hangoutId || null,
    };
    joinedSeenRef.current.add(`recv-${inviteId}`);
    await persistSet(JOINED_SEEN_KEY, joinedSeenRef.current);
    setInvite(null);
    setJoined(info);
    setPendingHangoutId(info.hangoutId || null);
    setPhase("joined");
    setVisible(true);
  };

  const onJoin = async (remark?: string) => {
    if (!invite || busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    const inviteId = invite.id;
    try {
      const res: any = await api.respondToInvite(
        inviteId,
        "accepted",
        remark ? { remark } : undefined
      );
      await showJoinCelebration(inviteId, res || {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const maybeDone =
        /already responded/i.test(msg) ||
        /network/i.test(msg) ||
        /failed to fetch/i.test(msg) ||
        /aborted/i.test(msg);

      if (maybeDone) {
        try {
          const list = (await api.getInvites()) as any[] | null;
          const found = Array.isArray(list)
            ? list.find((i) => i.id === inviteId)
            : null;
          if (
            found &&
            String(found.status).toLowerCase() === "accepted"
          ) {
            await showJoinCelebration(inviteId, {
              activityName: found.activityName,
              activityEmoji: found.activityEmoji,
              timeLabel: found.timeLabel,
              hangoutId: found.hangoutId || null,
              partnerName: found.senderName,
              partnerAvatar: found.senderAvatar,
            });
            return;
          }
          if (/already responded/i.test(msg)) {
            await showJoinCelebration(inviteId, {});
            return;
          }
        } catch {
          if (/already responded/i.test(msg)) {
            await showJoinCelebration(inviteId, {});
          }
        }
      }
      /* else keep invite modal so user can retry */
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  };

  /** Best-of-3 finished server-side — show celebration for both players */
  const onSettleDone = async (info: {
    activityName: string;
    activityEmoji: string;
    hangoutId?: string | null;
  }) => {
    if (!invite || busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    const inviteId = invite.id;
    try {
      seenRef.current.add(`settle-${inviteId}`);
      await persistSet(SEEN_KEY, seenRef.current);
      await showJoinCelebration(inviteId, {
        activityName: info.activityName,
        activityEmoji: info.activityEmoji,
        hangoutId: info.hangoutId,
        partnerName:
          invite.type === "sent"
            ? invite.recipientName || "Friend"
            : invite.senderName,
        partnerAvatar: invite.senderAvatar,
      });
    } catch {
      /* keep modal */
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  };

  const onDecline = async () => {
    if (!invite) return;
    busyRef.current = true;
    setLoading(true);
    try {
      await api.respondToInvite(invite.id, "rejected");
      await close(true);
    } catch {
      setLoading(false);
      busyRef.current = false;
    }
  };

  const onCounter = async (activity: { name: string; emoji: string }) => {
    if (!invite) return;
    busyRef.current = true;
    setLoading(true);
    try {
      await api.respondToInvite(invite.id, "counter", {
        activityName: activity.name,
        activityEmoji: activity.emoji,
        timeLabel: invite.timeLabel || "Soon",
      });
      await close(true);
    } catch {
      setLoading(false);
      busyRef.current = false;
    }
  };

  const onJoinedDone = () => {
    const id = pendingHangoutId;
    setVisible(false);
    setJoined(null);
    setPhase("invite");
    setPendingHangoutId(null);
    if (id) router.push(`/plan-details?id=${id}`);
    else router.push("/hangout");
  };

  return (
    <JoinHangInviteModal
      visible={visible}
      invite={invite}
      phase={phase}
      joined={joined}
      loading={loading}
      onJoin={onJoin}
      onDecline={onDecline}
      onCounter={onCounter}
      myUserId={user?.id}
      onSettleDone={onSettleDone}
      onDismiss={() => close(true)}
      onJoinedDone={onJoinedDone}
    />
  );
}
