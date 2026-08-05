import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Share,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { VibeFonts } from "../../constants/vibeTheme";
import { api } from "../../services/api";
import { broadcastLiveSpot } from "../../services/spotBroadcast";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const T = {
  purple: "#A78BFA",
  softPurple: "rgba(139, 92, 246, 0.18)",
  bg: "#0D1220",
  card: "rgba(22, 26, 46, 0.98)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  faint: "#7C869C",
  border: "rgba(160, 170, 200, 0.16)",
  promo: ["#7C3AED", "#8B5CF6", "#EC4899"] as const,
};

const VENUE_PRESETS = [
  {
    id: "cafe",
    name: "Cafe",
    emoji: "☕",
    color: "#FBBF24",
    bgGrad: ["rgba(251,191,36,0.16)", "rgba(217,119,6,0.06)"] as const,
    iconGrad: ["#FBBF24", "#F59E0B", "#D97706"] as const,
  },
  {
    id: "food",
    name: "Food",
    emoji: "🍕",
    color: "#FB923C",
    bgGrad: ["rgba(251,146,60,0.16)", "rgba(234,88,12,0.06)"] as const,
    iconGrad: ["#FB923C", "#F97316", "#EA580C"] as const,
  },
  {
    id: "movie",
    name: "Cinema",
    emoji: "🍿",
    color: "#A78BFA",
    bgGrad: ["rgba(167,139,250,0.18)", "rgba(124,58,237,0.06)"] as const,
    iconGrad: ["#A78BFA", "#8B5CF6", "#7C3AED"] as const,
  },
  {
    id: "drive",
    name: "Drive",
    emoji: "🚗",
    color: "#60A5FA",
    bgGrad: ["rgba(96,165,250,0.16)", "rgba(37,99,235,0.06)"] as const,
    iconGrad: ["#60A5FA", "#3B82F6", "#2563EB"] as const,
  },
  {
    id: "drinks",
    name: "Drinks",
    emoji: "🍸",
    color: "#F472B6",
    bgGrad: ["rgba(244,114,182,0.16)", "rgba(219,39,119,0.06)"] as const,
    iconGrad: ["#F472B6", "#EC4899", "#DB2777"] as const,
  },
  {
    id: "gaming",
    name: "Arcade",
    emoji: "🎮",
    color: "#34D399",
    bgGrad: ["rgba(52,211,153,0.16)", "rgba(5,150,105,0.06)"] as const,
    iconGrad: ["#34D399", "#10B981", "#059669"] as const,
  },
];

const TIME_PRESETS = [
  { label: "30 min", val: 30, emoji: "⚡" },
  { label: "45 min", val: 45, emoji: "⏳" },
  { label: "1 hour", val: 60, emoji: "⌛" },
];

function BounceEmoji({ emoji, size = 40 }: { emoji: string; size?: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 650, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.Text style={[{ fontSize: size }, anim]}>{emoji}</Animated.Text>;
}

export default function SpotBeaconModal({ visible, onClose }: Props) {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState(VENUE_PRESETS[0]);
  const [venueName, setVenueName] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  const activityId = selectedPreset.id === "cafe" ? "coffee" : selectedPreset.id;

  const handleBroadcastSpot = async () => {
    setLoading(true);
    try {
      const spot = await broadcastLiveSpot({
        activityId,
        activityName: selectedPreset.name,
        emoji: selectedPreset.emoji,
        venue: venueName.trim() || `${selectedPreset.emoji} ${selectedPreset.name}`,
        durationMins: duration,
      });
      onClose();
      router.push({
        pathname: "/spot-radar",
        params: {
          venue: spot.venue,
          vibe: spot.vibe,
          emoji: spot.emoji,
          duration: String(spot.duration),
          activityId: spot.activityId,
          ...(spot.hangoutId ? { hangoutId: spot.hangoutId } : {}),
        },
      });
    } catch {
      onClose();
      router.push({
        pathname: "/spot-radar",
        params: {
          venue: venueName.trim() || `${selectedPreset.emoji} ${selectedPreset.name}`,
          vibe: selectedPreset.name,
          emoji: selectedPreset.emoji,
          duration: String(duration),
          activityId,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareToWhatsApp = async () => {
    const finalVenue = venueName.trim() || selectedPreset.name;
    setLoading(true);
    try {
      const spot = await broadcastLiveSpot({
        activityId,
        activityName: selectedPreset.name,
        emoji: selectedPreset.emoji,
        venue: finalVenue,
        durationMins: duration,
      });
      const res = await api.createPublicInvite({
        activityName: selectedPreset.name,
        activityEmoji: selectedPreset.emoji,
        timeLabel: `At ${finalVenue} for next ${duration} mins!`,
        hangoutId: spot.hangoutId,
      });

      const shareMsg = `Hey! Sitting at ${finalVenue} (${selectedPreset.emoji}). Join my table: ${
        res?.inviteUrl || "https://www.hangora.app"
      }`;
      await Share.share({ message: shareMsg });
    } catch {
      const shareMsg = `Sitting at ${finalVenue} (${selectedPreset.emoji}) right now! Join me: https://www.hangora.app`;
      await Share.share({ message: shareMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <Animated.View entering={FadeInDown.duration(280)} style={styles.sheet}>
          <LinearGradient colors={[...T.promo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBand}>
            <View style={styles.dragHandle} />
            <View style={styles.heroShine} />
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.badgeIconWrap}>
                  <BounceEmoji emoji="📡" size={28} />
                </View>
                <View>
                  <Text style={styles.title}>Live Spot Beacon</Text>
                  <Text style={styles.subtitle}>Broadcast · scan · ping nearby ✨</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.secLabel}>WHERE ARE YOU AT? ✨</Text>
            <View style={styles.presetsGrid}>
              {VENUE_PRESETS.map((item) => {
                const isSelected = selectedPreset.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedPreset(item)}
                    activeOpacity={0.88}
                    style={styles.presetTileWrap}
                  >
                    <LinearGradient
                      colors={[...item.bgGrad]}
                      style={[
                        styles.presetTile,
                        isSelected && {
                          borderColor: item.color,
                          borderWidth: 2.5,
                          transform: [{ scale: 1.04 }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={[...item.iconGrad]}
                        start={{ x: 0.2, y: 0.1 }}
                        end={{ x: 0.9, y: 0.9 }}
                        style={styles.tileIconSphere}
                      >
                        <View style={styles.sphereGlint} />
                        {isSelected ? (
                          <BounceEmoji emoji={item.emoji} size={38} />
                        ) : (
                          <Text style={styles.tileEmoji}>{item.emoji}</Text>
                        )}
                      </LinearGradient>
                      <Text style={[styles.tileName, { color: item.color }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <View style={[styles.activeCheck, { backgroundColor: item.color }]}>
                          <Ionicons name="checkmark" size={11} color="#FFF" />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputWrap}>
              <View style={styles.inputIcon}>
                <Ionicons name="location" size={17} color={T.purple} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Custom spot (e.g. Cafe Mocha)..."
                placeholderTextColor={T.faint}
                value={venueName}
                onChangeText={setVenueName}
              />
            </View>

            <Text style={styles.secLabel}>TIMER DURATION ⏱️</Text>
            <View style={styles.timeRow}>
              {TIME_PRESETS.map((t) => {
                const isSelected = duration === t.val;
                return (
                  <TouchableOpacity
                    key={t.val}
                    style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                    onPress={() => setDuration(t.val)}
                    activeOpacity={0.88}
                  >
                    {isSelected ? (
                      <LinearGradient colors={[...T.promo]} style={styles.timeChipGrad}>
                        <Text style={styles.timeEmoji}>{t.emoji}</Text>
                        <Text style={styles.timeTextSelected}>{t.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.timeChipInner}>
                        <Text style={styles.timeEmoji}>{t.emoji}</Text>
                        <Text style={styles.timeText}>{t.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.broadcastBtn}
              onPress={handleBroadcastSpot}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient colors={[...T.promo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.broadcastBtnGrad}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={{ fontSize: 20 }}>📡</Text>
                    <Text style={styles.broadcastBtnText}>SCAN NEARBY USERS</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareToWhatsApp}
              disabled={loading}
              activeOpacity={0.88}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#16A34A" />
              <Text style={styles.shareBtnText}>Share Table Link</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "flex-end",
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: T.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    overflow: "hidden",
  },
  heroBand: {
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 18,
    overflow: "hidden",
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignSelf: "center",
    marginBottom: 14,
  },
  heroShine: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  title: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.88)",
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  secLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: T.purple,
    letterSpacing: 0.6,
    marginBottom: 12,
    marginTop: 4,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  presetTileWrap: {
    width: "31%",
  },
  presetTile: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.border,
    position: "relative",
  },
  tileIconSphere: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  sphereGlint: {
    position: "absolute",
    top: 8,
    left: 12,
    width: 14,
    height: 9,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ rotate: "-20deg" }],
  },
  tileEmoji: {
    fontSize: 38,
  },
  tileName: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    textAlign: "center",
  },
  activeCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.border,
    height: 50,
    marginTop: 14,
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  inputIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.ink,
  },
  timeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  timeChip: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.bg,
  },
  timeChipSelected: {
    borderColor: "transparent",
  },
  timeChipGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
  },
  timeChipInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
  },
  timeEmoji: {
    fontSize: 15,
  },
  timeText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
  },
  timeTextSelected: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: "#FFF",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 10,
    backgroundColor: T.card,
  },
  broadcastBtn: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: T.purple,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  broadcastBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
  },
  broadcastBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(52, 211, 153, 0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.35)",
  },
  shareBtnText: {
    color: "#34D399",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
});
