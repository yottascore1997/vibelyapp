import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { VibeFonts } from "../../constants/vibeTheme";
import CounterSettleSheet from "./CounterSettleSheet";

const { width: SCREEN_W } = Dimensions.get("window");
const SHEET_W = Math.min(SCREEN_W - 40, 380);

const coffeeVideo = require("../../assets/cofee.mp4");
const smokeVideo = require("../../assets/smoke.mp4");
const drinkVideo = require("../../assets/drink.mp4");

const ACT_VIDEOS: Record<string, number> = {
  coffee: coffeeVideo,
  cafe: coffeeVideo,
  sutta: smokeVideo,
  smoke: smokeVideo,
  cigarette: smokeVideo,
  drinks: drinkVideo,
  drink: drinkVideo,
  beer: drinkVideo,
};

function resolveVideo(activityName?: string, emoji?: string) {
  const n = (activityName || "").toLowerCase();
  if (n.includes("sutta") || n.includes("smoke") || emoji === "🚬") return smokeVideo;
  if (n.includes("coffee") || n.includes("cafe") || emoji === "☕") return coffeeVideo;
  if (n.includes("drink") || n.includes("beer") || emoji === "🍸" || emoji === "🍺")
    return drinkVideo;
  for (const [k, v] of Object.entries(ACT_VIDEOS)) {
    if (n.includes(k)) return v;
  }
  return coffeeVideo;
}

function activityShortLabel(name?: string) {
  const n = (name || "hang").trim();
  if (/sutta|smoke/i.test(n)) return "sutta";
  if (/coffee|cafe/i.test(n)) return "coffee";
  if (/drink|beer/i.test(n)) return "drinks";
  return n.split(/\s+/)[0]?.toLowerCase() || "hang";
}

export type IncomingInvite = {
  id: string;
  senderName: string;
  senderAvatar?: string | null;
  recipientName?: string;
  activityName: string;
  activityEmoji: string;
  timeLabel: string;
  isCounter?: boolean;
  status: string;
  type: string;
  parentActivity?: {
    activityName: string;
    activityEmoji: string;
    senderName?: string;
  } | null;
  settle?: {
    status: "playing" | "done";
    currentRound: number;
    myScore: number;
    theirScore: number;
    myMove: "rock" | "paper" | "scissors" | null;
    theirMove: "rock" | "paper" | "scissors" | null;
    waitingForOpponent: boolean;
    winningActivity?: { name: string; emoji: string } | null;
    hangoutId?: string | null;
  } | null;
};

export type JoinedHangInfo = {
  partnerName: string;
  partnerAvatar?: string | null;
  myAvatar?: string | null;
  activityName: string;
  activityEmoji: string;
  timeLabel: string;
  hangoutId?: string | null;
};

type Props = {
  visible: boolean;
  invite: IncomingInvite | null;
  phase: "invite" | "joined";
  joined?: JoinedHangInfo | null;
  loading?: boolean;
  onJoin: (remark?: string) => void;
  onDecline: () => void;
  onCounter: (activity: { name: string; emoji: string }) => void;
  myUserId?: string;
  onSettleDone?: (info: {
    activityName: string;
    activityEmoji: string;
    hangoutId?: string | null;
  }) => void;
  onDismiss: () => void;
  onJoinedDone?: () => void;
};

const COUNTER_ACTS = [
  { id: "coffee", name: "coffee", emoji: "🍵" },
  { id: "food", name: "food", emoji: "🍕" },
  { id: "drinks", name: "drinks", emoji: "🍸" },
];

function LoopVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

function BurstSpark({
  delay,
  angle,
  color,
}: {
  delay: number;
  angle: number;
  color: string;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, []);
  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dist = progress.value * 72;
    return {
      opacity: 1 - progress.value * 0.85,
      transform: [
        { translateX: Math.cos(rad) * dist },
        { translateY: Math.sin(rad) * dist },
        { scale: 1.35 - progress.value * 0.75 },
      ],
    };
  });
  return (
    <Animated.View style={[styles.spark, style, { backgroundColor: color }]} />
  );
}

function CelebrationBurst() {
  const colors = ["#22C55E", "#A78BFA", "#F472B6", "#FBBF24", "#60A5FA", "#34D399"];
  const sparks = Array.from({ length: 18 }, (_, i) => ({
    angle: i * 20,
    delay: 30 + (i % 5) * 40,
    color: colors[i % colors.length],
  }));
  return (
    <View style={styles.burstWrap} pointerEvents="none">
      {sparks.map((s, i) => (
        <BurstSpark key={i} delay={s.delay} angle={s.angle} color={s.color} />
      ))}
    </View>
  );
}

function PulseRing() {
  const scale = useSharedValue(0.85);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.35,
  }));
  return <Animated.View style={[styles.pulseRing, style]} />;
}

export default function JoinHangInviteModal({
  visible,
  invite,
  phase,
  joined,
  loading,
  onJoin,
  onDecline,
  onCounter,
  myUserId,
  onSettleDone,
  onDismiss,
  onJoinedDone,
}: Props) {
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (visible && phase === "invite") setRemark("");
  }, [visible, phase, invite?.id]);

  const videoSource = useMemo(() => {
    const name = phase === "joined" ? joined?.activityName : invite?.activityName;
    const emoji = phase === "joined" ? joined?.activityEmoji : invite?.activityEmoji;
    return resolveVideo(name, emoji);
  }, [phase, invite, joined]);

  if (!visible) return null;
  if (phase === "invite" && !invite) return null;
  if (phase === "joined" && !joined) return null;

  const avatar =
    (phase === "joined" ? joined?.partnerAvatar : invite?.senderAvatar) ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";

  const myAvatar =
    joined?.myAvatar ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";

  const partnerFirst =
    (phase === "joined" ? joined?.partnerName : invite?.senderName)?.split(" ")[0] ||
    "Friend";
  const short = activityShortLabel(
    phase === "joined" ? joined?.activityName : invite?.activityName
  );
  const timeLabel = (phase === "joined" ? joined?.timeLabel : invite?.timeLabel) || "";
  const emoji =
    (phase === "joined" ? joined?.activityEmoji : invite?.activityEmoji) || "✨";

  const isCounterInvite = phase === "invite" && !!invite?.isCounter;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        {isCounterInvite && invite ? (
          <CounterSettleSheet
            inviteId={invite.id}
            myUserId={myUserId}
            iAmCounterSender={invite.type === "sent"}
            initialSettle={invite.settle || null}
            theirs={
              invite.type === "sent"
                ? {
                    name:
                      invite.parentActivity?.senderName ||
                      invite.recipientName ||
                      "Them",
                    activityName:
                      invite.parentActivity?.activityName || invite.activityName,
                    activityEmoji:
                      invite.parentActivity?.activityEmoji ||
                      invite.activityEmoji,
                  }
                : {
                    name: invite.senderName,
                    activityName: invite.activityName,
                    activityEmoji: invite.activityEmoji,
                  }
            }
            yours={
              invite.type === "sent"
                ? {
                    name: "You",
                    activityName: invite.activityName,
                    activityEmoji: invite.activityEmoji,
                  }
                : {
                    name: "You",
                    activityName:
                      invite.parentActivity?.activityName ||
                      invite.activityName,
                    activityEmoji:
                      invite.parentActivity?.activityEmoji ||
                      invite.activityEmoji,
                  }
            }
            loading={loading}
            onAcceptTheirs={() => onJoin()}
            onSettledDone={(info) =>
              onSettleDone ? onSettleDone(info) : onJoin()
            }
            onDecline={onDecline}
          />
        ) : (
          <Animated.View entering={ZoomIn.duration(280)} style={styles.sheet}>
            <View
              style={[
                styles.videoHeader,
                phase === "joined" && styles.videoHeaderJoined,
              ]}
            >
              <LoopVideo key={`${phase}-${short}`} source={videoSource} />
              <LinearGradient
                colors={
                  phase === "joined"
                    ? ["rgba(34,197,94,0.35)", "rgba(8,10,18,0.98)"]
                    : ["rgba(8,10,18,0.15)", "rgba(8,10,18,0.92)"]
                }
                style={StyleSheet.absoluteFill}
              />
              <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={10}>
                <Ionicons name="close" size={16} color="#fff" />
              </Pressable>
              {phase === "joined" && <CelebrationBurst />}
              {phase === "invite" ? (
                <View style={styles.headerBadge}>
                  <Ionicons name="sparkles" size={11} color="#FBBF24" />
                  <Text style={styles.headerBadgeText}>INVITE</Text>
                </View>
              ) : null}
            </View>

            {phase === "invite" && invite ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                bounces={false}
                contentContainerStyle={styles.body}
              >
                <View style={styles.hostCard}>
                  <Image source={{ uri: avatar }} style={styles.hostAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hostEyebrow}>Wants to hang with you</Text>
                    <Text style={styles.hostName} numberOfLines={1}>
                      {partnerFirst}
                    </Text>
                  </View>
                  <View style={styles.actChip}>
                    <Text style={styles.actChipEmoji}>{emoji}</Text>
                  </View>
                </View>

                <Animated.Text entering={FadeInDown.duration(280)} style={styles.downFor}>
                  down for {short}?
                </Animated.Text>

                {!!timeLabel && (
                  <View style={styles.whenCard}>
                    <View style={styles.whenIcon}>
                      <Ionicons name="time-outline" size={16} color="#FBBF24" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.whenEyebrow}>WHEN</Text>
                      <Text style={styles.whenValue}>{timeLabel}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.remarkWrap}>
                  <Text style={styles.remarkLabel}>Add a remark (optional)</Text>
                  <TextInput
                    style={styles.remarkInput}
                    value={remark}
                    onChangeText={setRemark}
                    placeholder="e.g. Running 10 mins late · bring a friend?"
                    placeholderTextColor="rgba(255,255,255,0.32)"
                    multiline
                    maxLength={160}
                    editable={!loading}
                  />
                  <Text style={styles.remarkCount}>{remark.length}/160</Text>
                </View>

                <Pressable
                  style={[styles.joinBtnWrap, loading && { opacity: 0.7 }]}
                  onPress={() => onJoin(remark.trim() || undefined)}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#34D399", "#22C55E", "#16A34A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.joinBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#04140A" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#04140A" />
                        <Text style={styles.joinBtnText}>Join the hang</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                <Text style={styles.counterHint}>not feeling it? counter with —</Text>

                <View style={styles.counterRow}>
                  {COUNTER_ACTS.map((act) => (
                    <Pressable
                      key={act.id}
                      style={styles.counterChip}
                      disabled={loading}
                      onPress={() =>
                        onCounter({
                          name:
                            act.id === "coffee"
                              ? "Coffee"
                              : act.id === "food"
                                ? "Food"
                                : "Drinks",
                          emoji: act.emoji,
                        })
                      }
                    >
                      <Text style={styles.counterEmoji}>{act.emoji}</Text>
                      <Text style={styles.counterName}>{act.name}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable onPress={onDecline} disabled={loading} style={styles.declineLink}>
                  <Text style={styles.declineText}>Decline</Text>
                </Pressable>
              </ScrollView>
            ) : joined ? (
              <View style={styles.bodyJoined}>
                <View style={styles.avatarStackWrap}>
                  <PulseRing />
                  <Animated.Image
                    entering={ZoomIn.duration(280)}
                    source={{ uri: myAvatar }}
                    style={[styles.joinedAvatar, styles.avatarLeft]}
                  />
                  <Animated.Image
                    entering={ZoomIn.delay(90).duration(280)}
                    source={{ uri: avatar }}
                    style={[styles.joinedAvatar, styles.avatarRight]}
                  />
                  <View style={styles.emojiBadge}>
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </View>
                </View>

                <Animated.Text entering={ZoomIn.delay(60).duration(320)} style={styles.celebTitle}>
                  It&apos;s a hang!
                </Animated.Text>

                <Animated.Text
                  entering={FadeInDown.delay(120).duration(300)}
                  style={styles.youPlus}
                >
                  you + <Text style={styles.youPlusName}>{partnerFirst}</Text>
                </Animated.Text>

                <Animated.View
                  entering={FadeIn.delay(180).duration(280)}
                  style={styles.joinedPill}
                >
                  <Text style={styles.joinedPillEmoji}>{emoji}</Text>
                  <Text style={styles.joinedPillText}>{short} time</Text>
                  {!!timeLabel && (
                    <>
                      <Text style={styles.joinedPillDot}>·</Text>
                      <Text style={styles.joinedPillTime}>{timeLabel}</Text>
                    </>
                  )}
                </Animated.View>

                <Text style={styles.joinedSub}>you&apos;re both locked in</Text>

                <Pressable style={styles.seePlanBtn} onPress={onJoinedDone || onDismiss}>
                  <Text style={styles.seePlanBtnText}>See plan</Text>
                </Pressable>
              </View>
            ) : null}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4,6,14,0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  sheet: {
    width: SHEET_W,
    maxHeight: "88%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0B0F1A",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 20,
  },
  videoHeader: {
    height: 128,
    backgroundColor: "#111",
    overflow: "hidden",
  },
  videoHeaderJoined: {
    height: 136,
  },
  headerBadge: {
    position: "absolute",
    left: 14,
    top: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },
  headerBadgeText: {
    color: "#FBBF24",
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 1.1,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  burstWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  spark: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  bodyJoined: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(251,191,36,0.45)",
  },
  hostEyebrow: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    letterSpacing: 0.3,
  },
  hostName: {
    color: "#fff",
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    marginTop: 2,
  },
  actChip: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actChipEmoji: { fontSize: 20 },
  downFor: {
    color: "#fff",
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  whenCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.22)",
  },
  whenIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(251,191,36,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  whenEyebrow: {
    color: "rgba(251,191,36,0.7)",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    letterSpacing: 1,
  },
  whenValue: {
    color: "#FDE68A",
    fontSize: 15,
    fontFamily: VibeFonts.semiBold,
    marginTop: 1,
  },
  remarkWrap: {
    gap: 6,
  },
  remarkLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },
  remarkInput: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    color: "#fff",
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    textAlignVertical: "top",
  },
  remarkCount: {
    alignSelf: "flex-end",
    color: "rgba(255,255,255,0.28)",
    fontSize: 10,
    fontFamily: VibeFonts.medium,
  },
  joinBtnWrap: {
    alignSelf: "stretch",
    marginTop: 2,
    borderRadius: 18,
    overflow: "hidden",
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  joinBtnText: {
    color: "#04140A",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
  },
  seePlanBtn: {
    alignSelf: "stretch",
    backgroundColor: "#22C55E",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  seePlanBtnText: {
    color: "#04140A",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
  },
  counterHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    textAlign: "center",
  },
  counterRow: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "stretch",
  },
  counterChip: {
    flex: 1,
    backgroundColor: "#141A28",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  counterEmoji: { fontSize: 22 },
  counterName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
  },
  declineLink: {
    alignItems: "center",
    paddingTop: 2,
    paddingBottom: 4,
  },
  declineText: {
    color: "rgba(255,255,255,0.35)",
    fontFamily: VibeFonts.medium,
    fontSize: 13,
  },
  avatarStackWrap: {
    width: 120,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pulseRing: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "#22C55E",
  },
  joinedAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#0D1220",
    position: "absolute",
  },
  avatarLeft: { left: 12, zIndex: 1 },
  avatarRight: { right: 12, zIndex: 2 },
  emojiBadge: {
    position: "absolute",
    bottom: -2,
    zIndex: 3,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#161B2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  celebTitle: {
    color: "#FBBF24",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  youPlus: {
    color: "#fff",
    fontSize: 28,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.5,
  },
  youPlusName: {
    color: "#22C55E",
  },
  joinedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.28)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 2,
  },
  joinedPillEmoji: { fontSize: 14 },
  joinedPillText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: VibeFonts.semiBold,
  },
  joinedPillDot: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
  },
  joinedPillTime: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },
  joinedSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginBottom: 2,
  },
});
