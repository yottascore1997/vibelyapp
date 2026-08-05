import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { VibeFonts } from "../../constants/vibeTheme";
import { api } from "../../services/api";

const { width: SCREEN_W } = Dimensions.get("window");
const SHEET_W = Math.min(SCREEN_W - 40, 360);
const POLL_MS = 1800;

type Move = "rock" | "paper" | "scissors";

const MOVES: { id: Move; emoji: string; label: string }[] = [
  { id: "rock", emoji: "✊", label: "Stone" },
  { id: "paper", emoji: "✋", label: "Paper" },
  { id: "scissors", emoji: "✌️", label: "Scissors" },
];

function shortAct(name?: string) {
  return (name || "hang").trim().split(/\s+/)[0]?.toLowerCase() || "hang";
}

export type CounterSide = {
  name: string;
  activityName: string;
  activityEmoji: string;
};

export type SettleState = {
  status: "playing" | "done";
  currentRound: number;
  myScore: number;
  theirScore: number;
  myMove: Move | null;
  theirMove: Move | null;
  waitingForOpponent: boolean;
  winnerId?: string | null;
  winningActivity?: { name: string; emoji: string } | null;
  hangoutId?: string | null;
  rounds?: {
    round: number;
    resolved: boolean;
    winnerId: string | null;
    moves: Record<string, Move | null>;
  }[];
};

type Props = {
  inviteId: string;
  myUserId?: string;
  theirs: CounterSide;
  yours: CounterSide;
  /** When true, user sent the counter — hide "accept theirs" or flip labels */
  iAmCounterSender?: boolean;
  initialSettle?: SettleState | null;
  loading?: boolean;
  onAcceptTheirs: () => void;
  onSettledDone: (info: {
    activityName: string;
    activityEmoji: string;
    hangoutId?: string | null;
  }) => void;
  onDecline: () => void;
};

function VsPulse() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.Text style={[styles.vsText, style]}>VS</Animated.Text>
  );
}

export default function CounterSettleSheet({
  inviteId,
  myUserId,
  theirs,
  yours,
  iAmCounterSender,
  initialSettle,
  loading,
  onAcceptTheirs,
  onSettledDone,
  onDecline,
}: Props) {
  const [mode, setMode] = useState<"call" | "rps">(
    initialSettle?.status === "playing" || initialSettle?.status === "done"
      ? "rps"
      : "call"
  );
  const [settle, setSettle] = useState<SettleState | null>(initialSettle || null);
  const [busy, setBusy] = useState(false);
  const [lastReveal, setLastReveal] = useState<{
    my: Move;
    their: Move;
    youWonRound: boolean | null;
  } | null>(null);
  const doneRef = useRef(false);
  const prevRoundResolved = useRef(0);

  const theirShort = shortAct(theirs.activityName);
  const yourShort = shortAct(yours.activityName);

  const applySettle = (s: SettleState | null) => {
    if (!s) return;
    setSettle(s);
    setMode("rps");

    // Opponent finished the round — show reveal from resolved round moves
    const resolved = (s.rounds || []).filter((r) => r.resolved);
    const last = resolved[resolved.length - 1];
    if (
      last &&
      last.round > prevRoundResolved.current &&
      myUserId &&
      last.moves
    ) {
      prevRoundResolved.current = last.round;
      const my = last.moves[myUserId];
      const theirEntry = Object.entries(last.moves).find(([id]) => id !== myUserId);
      const their = theirEntry?.[1];
      if (my && their) {
        setLastReveal({
          my,
          their,
          youWonRound: last.winnerId === myUserId,
        });
        setTimeout(() => setLastReveal(null), 1600);
      }
    }

    if (s.status === "done" && s.winningActivity && !doneRef.current) {
      doneRef.current = true;
      onSettledDone({
        activityName: s.winningActivity.name,
        activityEmoji: s.winningActivity.emoji,
        hangoutId: s.hangoutId,
      });
    }
  };

  // Poll while playing
  useEffect(() => {
    if (mode !== "rps") return;
    let alive = true;
    const tick = async () => {
      try {
        const res: any = await api.getSettleInvite(inviteId);
        if (!alive) return;
        if (res?.settle) applySettle(res.settle);
      } catch {
        /* soft */
      }
    };
    tick();
    const t = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [mode, inviteId]);

  useEffect(() => {
    if (initialSettle) applySettle(initialSettle);
  }, [initialSettle?.status, initialSettle?.currentRound, initialSettle?.myScore, initialSettle?.theirScore, initialSettle?.myMove]);

  const startSettle = async () => {
    if (busy || loading) return;
    setBusy(true);
    try {
      const res: any = await api.settleInvite(inviteId, "start");
      if (res?.settle) applySettle(res.settle);
      else setMode("rps");
    } catch {
      setMode("rps");
    } finally {
      setBusy(false);
    }
  };

  const playMove = async (move: Move) => {
    if (busy || loading || settle?.waitingForOpponent || settle?.myMove) return;
    setBusy(true);
    try {
      const res: any = await api.settleInvite(inviteId, "move", move);
      if (res?.lastReveal) {
        setLastReveal({
          my: res.lastReveal.my,
          their: res.lastReveal.their,
          youWonRound: res.lastReveal.youWonRound,
        });
        setTimeout(() => setLastReveal(null), 1600);
      }
      if (res?.settle) {
        const s = res.settle as SettleState;
        const resolved = (s.rounds || []).filter((r) => r.resolved);
        const last = resolved[resolved.length - 1];
        if (last) prevRoundResolved.current = last.round;
        applySettle(s);
        if (
          !doneRef.current &&
          res.status === "accepted" &&
          res.activityName
        ) {
          doneRef.current = true;
          onSettledDone({
            activityName: res.activityName,
            activityEmoji: res.activityEmoji,
            hangoutId: res.hangoutId,
          });
        }
      }
    } catch {
      /* keep UI */
    } finally {
      setBusy(false);
    }
  };

  const myScore = settle?.myScore ?? 0;
  const theirScore = settle?.theirScore ?? 0;
  const round = settle?.currentRound ?? 1;
  const locked = !!(settle?.myMove || settle?.waitingForOpponent);
  const waiting = !!settle?.waitingForOpponent;

  return (
    <Animated.View entering={ZoomIn.duration(260)} style={styles.sheet}>
      <View style={styles.stackEdge} />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {mode === "rps" ? "👊 BEST OF 3" : "⚔️ COUNTER SENT"}
        </Text>
      </View>

      <View style={styles.vsRow}>
        <View style={styles.side}>
          <Text style={styles.sideWho} numberOfLines={1}>
            {theirs.name.split(" ")[0].toUpperCase()}
          </Text>
          <Text style={[styles.sideAct, { color: "#FBBF24" }]} numberOfLines={1}>
            {theirShort}
          </Text>
          <Text style={styles.sideEmoji}>{theirs.activityEmoji}</Text>
        </View>

        <VsPulse />

        <View style={styles.side}>
          <Text style={styles.sideWho}>YOU</Text>
          <Text style={[styles.sideAct, { color: "#C4B5FD" }]} numberOfLines={1}>
            {yourShort}
          </Text>
          <Text style={styles.sideEmoji}>{yours.activityEmoji}</Text>
        </View>
      </View>

      {mode === "call" && (
        <Animated.View entering={FadeInDown.duration(280)} style={styles.callBlock}>
          <Text style={styles.yourCall}>YOUR CALL</Text>
          <View style={styles.callRow}>
            {!iAmCounterSender && (
              <Pressable
                style={[styles.acceptBtn, loading && { opacity: 0.6 }]}
                onPress={onAcceptTheirs}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1A1200" />
                ) : (
                  <>
                    <Text style={styles.acceptEmoji}>{theirs.activityEmoji}</Text>
                    <Text style={styles.acceptText}>fine, {theirShort}</Text>
                  </>
                )}
              </Pressable>
            )}

            <Pressable
              style={[
                styles.playBtn,
                loading && { opacity: 0.6 },
                iAmCounterSender && { flex: 1 },
              ]}
              onPress={startSettle}
              disabled={loading || busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.playEmoji}>👊</Text>
                  <Text style={styles.playText}>play to settle</Text>
                </>
              )}
            </Pressable>
          </View>
          <Pressable onPress={onDecline} disabled={loading} style={styles.decline}>
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>
        </Animated.View>
      )}

      {mode === "rps" && (
        <Animated.View entering={FadeIn.duration(250)} style={styles.rpsBlock}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>
              {theirScore} — {myScore}
            </Text>
            <Text style={styles.roundText}>Round {Math.min(round, 3)} / 3</Text>
          </View>
          <Text style={styles.rpsHint}>First to 2 wins · winner’s plan locks in</Text>

          {lastReveal ? (
            <View style={styles.revealRow}>
              <View style={styles.resultSide}>
                <Text style={styles.resultWho}>You</Text>
                <Text style={styles.resultEmoji}>
                  {MOVES.find((m) => m.id === lastReveal.my)?.emoji}
                </Text>
              </View>
              <Text style={styles.resultVs}>vs</Text>
              <View style={styles.resultSide}>
                <Text style={styles.resultWho}>{theirs.name.split(" ")[0]}</Text>
                <Text style={styles.resultEmoji}>
                  {MOVES.find((m) => m.id === lastReveal.their)?.emoji}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.movesRow}>
              {MOVES.map((m) => (
                <Pressable
                  key={m.id}
                  style={[
                    styles.moveBtn,
                    settle?.myMove === m.id && styles.moveBtnActive,
                    (locked || busy) && { opacity: 0.45 },
                  ]}
                  onPress={() => playMove(m.id)}
                  disabled={locked || busy || loading}
                >
                  <Text style={styles.moveEmoji}>{m.emoji}</Text>
                  <Text style={styles.moveLabel}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {waiting && !lastReveal && (
            <Text style={styles.thinking}>
              Locked in — waiting for {theirs.name.split(" ")[0]}…
            </Text>
          )}
          {busy && !waiting && !lastReveal && (
            <ActivityIndicator color="#A78BFA" style={{ marginTop: 6 }} />
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: SHEET_W,
    borderRadius: 28,
    backgroundColor: "#14102A",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    overflow: "hidden",
  },
  stackEdge: {
    position: "absolute",
    right: -6,
    top: 18,
    bottom: 18,
    width: 10,
    borderRadius: 8,
    backgroundColor: "rgba(88, 60, 160, 0.55)",
  },
  badge: {
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: "#E9D5FF",
    letterSpacing: 0.6,
  },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  side: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  sideWho: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.8,
  },
  sideAct: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.4,
  },
  sideEmoji: { fontSize: 42, marginTop: 4 },
  vsText: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#A78BFA",
    textShadowColor: "rgba(167,139,250,0.8)",
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
    marginHorizontal: 6,
  },
  callBlock: { gap: 10 },
  yourCall: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 2,
  },
  callRow: { flexDirection: "row", gap: 10 },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#FBBF24",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#FBBF24",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    minHeight: 72,
  },
  acceptEmoji: { fontSize: 18 },
  acceptText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#1A1200",
    textAlign: "center",
  },
  playBtn: {
    flex: 1,
    backgroundColor: "#7C3AED",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#A78BFA",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    minHeight: 72,
  },
  playEmoji: { fontSize: 18 },
  playText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    textAlign: "center",
  },
  decline: { alignItems: "center", paddingTop: 4 },
  declineText: {
    color: "rgba(255,255,255,0.35)",
    fontFamily: VibeFonts.medium,
    fontSize: 13,
  },
  rpsBlock: { alignItems: "center", gap: 10 },
  scoreRow: { alignItems: "center", gap: 2 },
  scoreText: {
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: 2,
  },
  roundText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#A78BFA",
  },
  rpsHint: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 4,
    textAlign: "center",
  },
  movesRow: { flexDirection: "row", gap: 10 },
  moveBtn: {
    width: 88,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  moveBtnActive: {
    borderColor: "#A78BFA",
    backgroundColor: "rgba(167,139,250,0.2)",
  },
  moveEmoji: { fontSize: 28 },
  moveLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.7)",
  },
  thinking: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#A78BFA",
    marginTop: 4,
    textAlign: "center",
  },
  revealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  resultSide: { alignItems: "center", gap: 4 },
  resultWho: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.45)",
  },
  resultEmoji: { fontSize: 40 },
  resultVs: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.35)",
  },
});
