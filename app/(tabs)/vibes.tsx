import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { VibeFonts } from "../../constants/vibeTheme";

/** Light clean theme matching Hangout screen reference */
const T = {
  bg: "#F8F9FD",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  ink: "#18181B",
  muted: "#64748B",
  faint: "#94A3B8",
  border: "#E2E8F0",
  purple: "#7C3AED",
  purpleDeep: "#6D28D9",
  purpleBright: "#8B5CF6",
  softPurple: "#F3E8FF",
  pink: "#EC4899",
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
  blue: "#2563EB",
  cta: ["#7C3AED", "#8B5CF6"] as const,
  promo: ["#7C3AED", "#8B5CF6", "#EC4899"] as const,
};

const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
];

const VIBE_ORBS = [
  {
    id: "Lessgo",
    label: "Lessgo",
    description: "Up for anything",
    icon: "flash" as const,
    colors: ["#4ADE80", "#22C55E", "#15803D"] as const,
    accent: "#16A34A",
    bgSoft: "#DCFCE7",
  },
  {
    id: "Maybe",
    label: "Maybe",
    description: "Soft yes",
    icon: "star" as const,
    colors: ["#FDE047", "#F59E0B", "#B45309"] as const,
    accent: "#D97706",
    bgSoft: "#FEF3C7",
  },
  {
    id: "Off grid",
    label: "Off grid",
    description: "Low key",
    icon: "moon" as const,
    colors: ["#FCA5A5", "#EF4444", "#991B1B"] as const,
    accent: "#DC2626",
    bgSoft: "#FEE2E2",
  },
];

const QUICK_ACTIVITIES = [
  { id: "coffee", name: "Coffee", emoji: "☕", accent: "#7C3AED", bg: "#F3E8FF" },
  { id: "food", name: "Food", emoji: "🍕", accent: "#EA580C", bg: "#FFEDD5" },
  { id: "biryani", name: "Biryani", emoji: "🍛", accent: "#E11D48", bg: "#FFE4E6" },
  { id: "beer", name: "Beer", emoji: "🍺", accent: "#D97706", bg: "#FEF3C7" },
  { id: "sutta", name: "Sutta", emoji: "🚬", accent: "#475569", bg: "#F1F5F9" },
  { id: "vape", name: "Vape", emoji: "💨", accent: "#0284C7", bg: "#E0F2FE" },
  { id: "street", name: "Street", emoji: "🌮", accent: "#059669", bg: "#D1FAE5" },
  { id: "drinks", name: "Drinks", emoji: "🍹", accent: "#DB2777", bg: "#FCE7F3" },
  { id: "dietcoke", name: "Diet Coke", emoji: "🥤", accent: "#DC2626", bg: "#FEE2E2" },
  { id: "movie", name: "Movie", emoji: "🎬", accent: "#4F46E5", bg: "#EEF2FF" },
];

const TIME_CHIPS = [
  { id: "now", label: "Now", sub: "Let's go", icon: "flash" as const },
  { id: "30min", label: "+30 Min", sub: "Soon", icon: "time" as const },
  { id: "1hr", label: "+1 Hr", sub: "Later", icon: "alarm" as const },
  { id: "6pm", label: "6 PM", sub: "Evening", icon: "sunny" as const },
];

export default function VibesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openSidebar } = useSidebar();
  const { user } = useAuth();

  const [selectedVibe, setSelectedVibe] = useState("Lessgo");
  const [selectedActivity, setSelectedActivity] = useState("coffee");
  const [selectedTime, setSelectedTime] = useState("30min");

  const currentActivity =
    QUICK_ACTIVITIES.find((a) => a.id === selectedActivity) || QUICK_ACTIVITIES[0];
  const currentTimeChip =
    TIME_CHIPS.find((t) => t.id === selectedTime) || TIME_CHIPS[0];
  const vibe = VIBE_ORBS.find((o) => o.id === selectedVibe) || VIBE_ORBS[0];

  const handleOrbPress = async (id: string) => {
    setSelectedVibe(id);
    const energy =
      id === "Lessgo" ? "LESSGO" : id === "Maybe" ? "MAYBE" : "OFF_GRID";
    const activity =
      QUICK_ACTIVITIES.find((a) => a.id === selectedActivity)?.name || selectedActivity;
    const timeLabel =
      TIME_CHIPS.find((t) => t.id === selectedTime)?.label || selectedTime;
    try {
      await api.updateSocialStatus({
        energy,
        freeNow: id === "Lessgo",
        activityName: activity,
        timeLabel,
      });
    } catch {
      // soft fail — UI still updates
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const status: any = await api.getSocialStatus();
        if (!status) return;
        const energy = status.energy || status?.energy;
        if (energy === "LESSGO") setSelectedVibe("Lessgo");
        else if (energy === "OFF_GRID") setSelectedVibe("Off grid");
        else if (energy === "MAYBE") setSelectedVibe("Maybe");
        if (status.activityName) {
          const found = QUICK_ACTIVITIES.find(
            (a) => a.name.toLowerCase() === String(status.activityName).toLowerCase()
          );
          if (found) setSelectedActivity(found.id);
        }
        if (status.timeLabel) {
          const foundT = TIME_CHIPS.find((t) => t.label === status.timeLabel);
          if (foundT) setSelectedTime(foundT.id);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleSendInvite = () => {
    router.push("/reels");
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <LinearGradient
        colors={["rgba(124,58,237,0.06)", "transparent"]}
        style={styles.glowTop}
      />
      <LinearGradient
        colors={["transparent", "rgba(139,92,246,0.04)"]}
        style={styles.glowBottom}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable style={styles.iconBtn} onPress={openSidebar}>
          <Ionicons name="menu" size={20} color={T.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>Hey, {firstName} 👋</Text>
          <Text style={styles.headerTitle}>Your Vibe ✨</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/reels")}>
          <Ionicons name="people" size={18} color={T.purple} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 110 }]}
      >
        {/* Social Energy */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Social energy ⚡</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>Live Mood</Text>
            </View>
          </View>
          <Text style={styles.sectionSub}>How are you showing up today?</Text>
          
          <View style={styles.vibeRow}>
            {VIBE_ORBS.map((orb) => {
              const active = selectedVibe === orb.id;
              return (
                <Pressable
                  key={orb.id}
                  onPress={() => handleOrbPress(orb.id)}
                  style={[
                    styles.vibeCard,
                    active && { borderColor: orb.accent, backgroundColor: orb.bgSoft },
                  ]}
                >
                  <LinearGradient
                    colors={orb.colors}
                    style={styles.vibeOrb}
                    start={{ x: 0.2, y: 0.2 }}
                    end={{ x: 0.8, y: 0.8 }}
                  >
                    <Ionicons name={orb.icon} size={22} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.vibeLabel, active && { color: orb.accent }]}>
                    {orb.label}
                  </Text>
                  <Text style={styles.vibeDesc}>{orb.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Activities */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.section}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>Quick activities 🎯</Text>
              <Text style={styles.sectionSub}>What do you want to do?</Text>
            </View>
            <Pressable onPress={() => router.push("/reels")}>
              <Text style={styles.link}>Friends ›</Text>
            </Pressable>
          </View>

          <View style={styles.actGrid}>
            {QUICK_ACTIVITIES.map((act) => {
              const active = selectedActivity === act.id;
              return (
                <Pressable
                  key={act.id}
                  onPress={() => setSelectedActivity(act.id)}
                  style={[
                    styles.actCell,
                    active
                      ? { borderColor: act.accent, backgroundColor: act.bg }
                      : { backgroundColor: T.card, borderColor: T.border },
                  ]}
                >
                  <Text style={styles.actEmoji}>{act.emoji}</Text>
                  <Text style={[styles.actName, active && { color: act.accent }]}>
                    {act.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* When */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>When? 🕒</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeRow}
          >
            {TIME_CHIPS.map((chip) => {
              const active = selectedTime === chip.id;
              return (
                <Pressable key={chip.id} onPress={() => setSelectedTime(chip.id)}>
                  {active ? (
                    <LinearGradient
                      colors={[...T.cta]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.timeActive}
                    >
                      <Ionicons name={chip.icon} size={15} color="#fff" />
                      <View>
                        <Text style={styles.timeLabelActive}>{chip.label}</Text>
                        <Text style={styles.timeSubActive}>{chip.sub}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.timeIdle}>
                      <Ionicons name={chip.icon} size={15} color={T.muted} />
                      <View>
                        <Text style={styles.timeLabel}>{chip.label}</Text>
                        <Text style={styles.timeSub}>{chip.sub}</Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Spontaneous Invite Hero Card */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.inviteCard}>
          <LinearGradient
            colors={["#1E1B4B", "#2E1065", "#0F172A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inviteGrad}
          >
            <View style={styles.inviteTop}>
              <Image source={{ uri: MOCK_AVATARS[0] }} style={styles.inviteAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inviteTitle}>Spontaneous invite</Text>
                <Text style={styles.inviteSub}>
                  {currentActivity.emoji} {currentActivity.name} ·{" "}
                  {selectedTime === "now" ? "now" : currentTimeChip.label}
                </Text>
              </View>
              <View style={[styles.vibePill, { backgroundColor: vibe.bgSoft }]}>
                <Text style={[styles.vibePillText, { color: vibe.accent }]}>
                  {selectedVibe}
                </Text>
              </View>
            </View>

            <Text style={styles.inviteHint}>
              1-Tap Instant Move — ping your friends right now without filling forms!
            </Text>

            <View style={styles.quickMovesBox}>
              <Text style={styles.quickMovesTitle}>
                1-Tap Quick Moves ⚡ (Instant Ping)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[
                  { name: "Coffee", emoji: "☕", bg: ["#FEF3C7", "#FDE68A"], color: "#B45309" },
                  { name: "Food", emoji: "🍕", bg: ["#FFEDD5", "#FED7AA"], color: "#C2410C" },
                  { name: "Beer", emoji: "🍺", bg: ["#FEF9C3", "#FEF08A"], color: "#A16207" },
                  { name: "Sutta", emoji: "🚬", bg: ["#F1F5F9", "#E2E8F0"], color: "#334155" },
                  { name: "Movie", emoji: "🎬", bg: ["#E0E7FF", "#C7D2FE"], color: "#4338CA" },
                ].map((chip) => (
                  <Pressable
                    key={chip.name}
                    onPress={handleSendInvite}
                    style={{ overflow: "hidden", borderRadius: 14 }}
                  >
                    <LinearGradient
                      colors={chip.bg as any}
                      style={styles.quickMovePill}
                    >
                      <Text style={{ fontSize: 13 }}>{chip.emoji}</Text>
                      <Text style={[styles.quickMoveText, { color: chip.color }]}>
                        {chip.name} NOW ⚡
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inviteActions}>
              <Pressable style={{ flex: 1 }} onPress={handleSendInvite}>
                <LinearGradient
                  colors={[...T.cta]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendBtn}
                >
                  <Ionicons name="paper-plane" size={16} color="#fff" />
                  <Text style={styles.sendBtnText}>Send Instant Move</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                style={styles.chatBtn}
                onPress={() => router.push("/(tabs)/chats")}
              >
                <Text style={styles.chatBtnText}>Chats</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Likes & Matches Card */}
        <Pressable
          style={styles.premiumCard}
          onPress={() => router.push("/my-matches")}
        >
          <View style={styles.premiumIcon}>
            <Ionicons name="heart" size={18} color={T.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>See your likes & matches 💕</Text>
            <Text style={styles.premiumSub}>Connect with members who are free now</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={T.muted} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  glowTop: { position: "absolute", top: 0, left: 0, right: 0, height: 260 },
  glowBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 160 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: T.bg,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: { alignItems: "center" },
  greeting: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginTop: 1,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 6 },
  section: { marginBottom: 22 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.green,
  },
  liveBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.green,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
    marginBottom: 12,
  },
  link: { fontSize: 12, fontFamily: VibeFonts.bold, color: T.purple },
  vibeRow: { flexDirection: "row", gap: 10 },
  vibeCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    shadowColor: T.purple,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vibeOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  vibeLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  vibeDesc: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
    textAlign: "center",
  },
  actGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginTop: 4,
  },
  actCell: {
    width: "18.5%",
    aspectRatio: 0.9,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actEmoji: { fontSize: 22, marginBottom: 4 },
  actName: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: T.muted,
    textAlign: "center",
  },
  timeRow: { gap: 10, paddingTop: 4 },
  timeActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 110,
    shadowColor: T.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  timeIdle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 110,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  timeLabelActive: { fontSize: 13, fontFamily: VibeFonts.bold, color: "#fff" },
  timeSubActive: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.8)",
    marginTop: 1,
  },
  timeLabel: { fontSize: 13, fontFamily: VibeFonts.bold, color: T.ink },
  timeSub: { fontSize: 10, fontFamily: VibeFonts.medium, color: T.muted, marginTop: 1 },
  inviteCard: {
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: T.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  inviteGrad: { padding: 16 },
  inviteTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  inviteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: T.purpleBright,
  },
  inviteTitle: { fontSize: 15, fontFamily: VibeFonts.bold, color: "#FFFFFF" },
  inviteSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
  },
  vibePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  vibePillText: { fontSize: 10, fontFamily: VibeFonts.bold },
  inviteHint: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.65)",
    marginTop: 12,
    marginBottom: 12,
  },
  quickMovesBox: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 10,
  },
  quickMovesTitle: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#F59E0B",
    marginBottom: 8,
  },
  quickMovePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickMoveText: { fontSize: 11, fontFamily: VibeFonts.bold },
  inviteActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  sendBtnText: { color: "#fff", fontSize: 14, fontFamily: VibeFonts.bold },
  chatBtn: {
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  chatBtnText: { color: "#FFF", fontSize: 13, fontFamily: VibeFonts.bold },
  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.15)",
    padding: 14,
    marginBottom: 8,
    shadowColor: T.purple,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumTitle: { fontSize: 14, fontFamily: VibeFonts.bold, color: T.ink },
  premiumSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
  },
});
