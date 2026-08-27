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
const SHEET_W = Math.min(SCREEN_W - 36, 380);

const recSmokeVideo = require("../../assets/recsmoke.mp4");
const accSmokeVideo = require("../../assets/accsmoke.mp4");

/** Match create-hang / Who’s coming palette */
const T = {
  bg: "#121216",
  card: "#1A1A22",
  ink: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.4)",
  purple: "#A855F7",
  lilac: "#C4B5FD",
  pink: "#EC4899",
  orange: "#F97316",
  peach: "#FF9A72",
  cta: ["#EC4899", "#F97316"] as const,
  inviteBadge: ["#FF8A00", "#FF2D7A"] as const,
};

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
    p.muted = false;
    p.volume = 1;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      nativeControls={false}
    />
  );
}

function CelebrationVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.muted = false;
    p.volume = 1;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
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
  const colors = [T.orange, T.pink, T.purple, "#FBBF24", T.lilac, "#FF6B9D"];
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
    if (phase === "joined") return accSmokeVideo;
    return recSmokeVideo;
  }, [phase]);

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
                      invite.parentActivity?.activityEmoji || invite.activityEmoji,
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
                      invite.parentActivity?.activityName || invite.activityName,
                    activityEmoji:
                      invite.parentActivity?.activityEmoji || invite.activityEmoji,
                  }
            }
            loading={loading}
            onAcceptTheirs={() => onJoin()}
            onSettledDone={(info) => (onSettleDone ? onSettleDone(info) : onJoin())}
            onDecline={onDecline}
          />
        ) : (
          <Animated.View entering={ZoomIn.duration(280)} style={styles.sheet}>
            <LinearGradient
              colors={["#1C1C22", "#16161C", "#121216"]}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={[
                "rgba(168,85,247,0.16)",
                "rgba(236,72,153,0.08)",
                "transparent",
                "rgba(249,115,22,0.12)",
              ]}
              locations={[0, 0.35, 0.7, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            <View
              style={[
                styles.videoHeader,
                phase === "joined" && styles.videoHeaderJoined,
              ]}
            >
              {phase === "joined" ? (
                <CelebrationVideo key="acc-smoke" source={videoSource} />
              ) : (
                <LoopVideo key="rec-smoke" source={videoSource} />
              )}
              <LinearGradient
                colors={
                  phase === "joined"
                    ? ["rgba(236,72,153,0.28)", "rgba(18,18,22,0.96)"]
                    : ["rgba(18,18,22,0.12)", "rgba(18,18,22,0.92)"]
                }
                style={StyleSheet.absoluteFill}
              />
              <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={10}>
                <Ionicons name="close" size={15} color="rgba(255,255,255,0.8)" />
              </Pressable>
              {phase === "joined" && <CelebrationBurst />}
              {phase === "invite" ? (
                <LinearGradient
                  colors={[...T.inviteBadge]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.headerBadge}
                >
                  <Ionicons name="paper-plane" size={10} color="#fff" />
                  <Text style={styles.headerBadgeText}>INVITE</Text>
                </LinearGradient>
              ) : null}
            </View>

            {phase === "invite" && invite ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
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
                  down for <Text style={styles.downForAccent}>{short}</Text>?
                </Animated.Text>

                {!!timeLabel && (
                  <LinearGradient
                    colors={[T.purple, T.pink, T.orange]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.whenBorder}
                  >
                    <View style={styles.whenCard}>
                      <View style={styles.whenIcon}>
                        <Ionicons name="time-outline" size={15} color={T.lilac} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.whenEyebrow}>WHEN</Text>
                        <Text style={styles.whenValue}>{timeLabel}</Text>
                      </View>
                    </View>
                  </LinearGradient>
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
                    colors={[...T.cta]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.joinBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
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
                    <Text style={{ fontSize: 16 }}>{emoji}</Text>
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

                <Pressable
                  style={styles.seePlanBtnWrap}
                  onPress={onJoinedDone || onDismiss}
                >
                  <LinearGradient
                    colors={[...T.cta]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.seePlanBtn}
                  >
                    <Text style={styles.seePlanBtnText}>See plan</Text>
                  </LinearGradient>
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
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sheet: {
    width: SHEET_W,
    maxHeight: "88%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(18,18,22,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  videoHeader: {
    height: 200,
    backgroundColor: "#111",
    overflow: "hidden",
  },
  videoHeaderJoined: {
    height: 220,
  },
  headerBadge: {
    position: "absolute",
    left: 14,
    top: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 1,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  bodyJoined: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    alignItems: "center",
    gap: 8,
  },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(168,85,247,0.55)",
  },
  hostEyebrow: {
    color: T.faint,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    letterSpacing: 0.2,
  },
  hostName: {
    color: T.ink,
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    marginTop: 1,
  },
  actChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(236,72,153,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.28)",
  },
  actChipEmoji: { fontSize: 18 },
  downFor: {
    color: T.ink,
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  downForAccent: {
    color: T.peach,
  },
  whenBorder: {
    borderRadius: 14,
    padding: 1.5,
  },
  whenCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: T.card,
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  whenIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(168,85,247,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  whenEyebrow: {
    color: T.lilac,
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    letterSpacing: 1,
  },
  whenValue: {
    color: "#fff",
    fontSize: 14,
    fontFamily: VibeFonts.semiBold,
    marginTop: 1,
  },
  remarkWrap: {
    gap: 5,
  },
  remarkLabel: {
    color: T.faint,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
  },
  remarkInput: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    color: "#fff",
    fontSize: 13,
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
    borderRadius: 999,
    overflow: "hidden",
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },
  seePlanBtnWrap: {
    alignSelf: "stretch",
    marginTop: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  seePlanBtn: {
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
  },
  seePlanBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },
  counterHint: {
    color: T.faint,
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    textAlign: "center",
  },
  counterRow: {
    flexDirection: "row",
    gap: 7,
    alignSelf: "stretch",
  },
  counterChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  counterEmoji: { fontSize: 20 },
  counterName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
  },
  declineLink: {
    alignItems: "center",
    paddingTop: 2,
    paddingBottom: 2,
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
    borderColor: T.pink,
  },
  joinedAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#1C1C22",
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
    backgroundColor: "#1A1A22",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.4)",
  },
  celebTitle: {
    color: T.peach,
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  youPlus: {
    color: "#fff",
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.4,
  },
  youPlusName: {
    color: T.lilac,
  },
  joinedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(168,85,247,0.14)",
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 2,
  },
  joinedPillEmoji: { fontSize: 14 },
  joinedPillText: {
    color: "#fff",
    fontSize: 13,
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
    color: T.faint,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginBottom: 2,
  },
});
