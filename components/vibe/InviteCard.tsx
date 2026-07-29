import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing } from "../../constants/theme";

type Phase = "ready" | "sent";

interface Props {
  phase: Phase;
  activityName: string;
  activityEmoji: string;
  friendName: string;
  friendEnergy?: string;
  timeLabel: string;
  friendAvatar?: string;
  myAvatar?: string;
  loading?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  onWhatsAppConfirm?: () => void;
}

const T = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  ink: "#18181B",
  muted: "#64748B",
  faint: "#94A3B8",
  border: "#F1F5F9",
  purple: "#7C3AED",
  pink: "#EC4899",
  green: "#22C55E",
  cta: ["#7C3AED", "#EC4899"] as const,
  softPurple: "#F3E8FF",
};

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
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dist = progress.value * 52;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: Math.cos(rad) * dist },
        { translateY: Math.sin(rad) * dist },
        { scale: 1.1 - progress.value * 0.6 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.spark,
        style,
        { backgroundColor: color },
      ]}
    />
  );
}

function SuccessBurst() {
  const colors = [T.pink, T.purple, T.green, "#FBBF24", "#A78BFA"];
  const sparks = Array.from({ length: 10 }, (_, i) => ({
    angle: i * 36,
    delay: 80 + (i % 3) * 40,
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

export default function InviteCard({
  phase,
  activityName,
  activityEmoji,
  friendName,
  timeLabel,
  friendAvatar,
  myAvatar,
  loading = false,
  onClose,
  onConfirm,
  onWhatsAppConfirm,
}: Props) {
  const defaultMyAvatar =
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";
  const defaultFriendAvatar =
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";
  const avatarToUse = myAvatar || defaultMyAvatar;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (phase === "ready") {
      pulse.value = withSequence(
        withTiming(1.04, { duration: 700 }),
        withTiming(1, { duration: 700 })
      );
    }
  }, [phase]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (phase === "sent") {
    return (
      <Animated.View entering={ZoomIn.duration(420).springify()} style={styles.wrap}>
        <LinearGradient
          colors={[T.bg, T.card, "#F5FFF8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <SuccessBurst />

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={T.muted} />
          </Pressable>

          <View style={styles.sentPill}>
            <Ionicons name="checkmark-circle" size={14} color={T.green} />
            <Text style={styles.sentPillText}>INVITE SENT</Text>
          </View>

          <View style={styles.avatarsRow}>
            <Image
              source={{ uri: avatarToUse }}
              style={[styles.avatar, { borderColor: T.purple }]}
            />
            <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.middleCircle}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </LinearGradient>
            <Image
              source={{ uri: friendAvatar || defaultFriendAvatar }}
              style={[styles.avatar, { borderColor: T.green }]}
            />
          </View>

          <Text style={styles.sentTitle}>
            you + <Text style={{ color: T.green }}>{friendName}</Text>
          </Text>
          <Text style={styles.sentSub}>
            {activityEmoji} {activityName} · {timeLabel}
          </Text>

          <Text style={styles.hintText}>They'll get a ping — wait for the reply!</Text>

          <Pressable onPress={onClose} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Back to Friends</Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(420).springify()} style={styles.wrap}>
      <Animated.View style={pulseStyle}>
        <LinearGradient
          colors={[T.bg, T.card, T.softPurple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <LinearGradient
            colors={["rgba(237,231,255,0.65)", "transparent"]}
            style={styles.cardGlow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <Pressable style={styles.closeBtn} onPress={onClose} disabled={loading}>
            <Ionicons name="close" size={20} color={T.muted} />
          </Pressable>

          <View style={styles.readyPill}>
            <Ionicons name="rocket" size={12} color={T.purple} />
            <Text style={styles.readyPillText}>READY TO SEND</Text>
          </View>

          <View style={styles.avatarsRow}>
            <Image
              source={{ uri: avatarToUse }}
              style={[styles.avatar, { borderColor: T.purple }]}
            />
            <LinearGradient colors={[...T.cta]} style={styles.middleCircle}>
              <Text style={styles.middleEmoji}>{activityEmoji}</Text>
            </LinearGradient>
            <Image
              source={{ uri: friendAvatar || defaultFriendAvatar }}
              style={[styles.avatar, { borderColor: T.pink }]}
            />
          </View>

          <Text style={styles.hangTitle}>
            Hang for <Text style={{ color: T.pink }}>{activityName}</Text>?
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={13} color={T.purple} />
              <Text style={styles.metaChipText}>{timeLabel}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="person-outline" size={13} color={T.pink} />
              <Text style={styles.metaChipText}>{friendName}</Text>
            </View>
          </View>

          <Text style={styles.toFriend}>
            They'll get a direct invite for this hangout.
          </Text>

          <Pressable onPress={onConfirm} disabled={loading} style={styles.confirmBtnWrap}>
            <LinearGradient
              colors={[...T.cta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color="#fff" />
                  <Text style={styles.confirmText}>Send Invite</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {onWhatsAppConfirm ? (
            <Pressable onPress={onWhatsAppConfirm} disabled={loading} style={{ width: "100%", marginTop: 10 }}>
              <View style={{ backgroundColor: "rgba(37,211,102,0.12)", borderWidth: 1.5, borderColor: "#25D366", borderRadius: 18, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                <Text style={{ fontSize: 14, fontFamily: VibeFonts.bold, color: "#25D366" }}>
                  Invite via WhatsApp 💬
                </Text>
              </View>
            </Pressable>
          ) : null}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 4,
    marginTop: 8,
  },
  card: {
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#1A1F36",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  readyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.softPurple,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 18,
  },
  readyPillText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.purple,
    letterSpacing: 1.2,
  },
  sentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 18,
  },
  sentPillText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.green,
    letterSpacing: 1.2,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.md,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
  },
  middleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -14,
    zIndex: 2,
    borderWidth: 2,
    borderColor: T.card,
  },
  middleEmoji: {
    fontSize: 18,
  },
  hangTitle: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.softPurple,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  metaChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: T.ink,
  },
  toFriend: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 14,
    marginBottom: 22,
    textAlign: "center",
  },
  confirmBtnWrap: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    width: "100%",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  confirmText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: VibeFonts.bold,
  },
  sentTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    textAlign: "center",
    marginTop: 4,
  },
  sentSub: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 8,
    textAlign: "center",
  },
  hintText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    marginTop: 16,
    marginBottom: 18,
    textAlign: "center",
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.bg,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: T.ink,
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  burstWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    top: 40,
  },
  spark: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
