import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
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

const T = {
  bg: "#050508",
  card: "#12121A",
  elevated: "#1A1A24",
  ink: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.32)",
  border: "rgba(255,255,255,0.08)",
  pink: "#FF4B81",
  purple: "#A855F7",
  green: "#22C55E",
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
    colors: ["#34D399", "#059669"] as const,
    accent: "#34D399",
  },
  {
    id: "Maybe",
    label: "Maybe",
    description: "Soft yes",
    icon: "star" as const,
    colors: ["#FBBF24", "#D97706"] as const,
    accent: "#FBBF24",
  },
  {
    id: "Off grid",
    label: "Off grid",
    description: "Low key",
    icon: "moon" as const,
    colors: ["#FB7185", "#BE123C"] as const,
    accent: "#FB7185",
  },
];

const QUICK_ACTIVITIES = [
  { id: "coffee", name: "Coffee", emoji: "☕", accent: "#FBBF24" },
  { id: "food", name: "Food", emoji: "🍕", accent: "#FB923C" },
  { id: "biryani", name: "Biryani", emoji: "🍛", accent: "#F87171" },
  { id: "beer", name: "Beer", emoji: "🍺", accent: "#F59E0B" },
  { id: "sutta", name: "Sutta", emoji: "🚬", accent: "#9CA3AF" },
  { id: "vape", name: "Vape", emoji: "💨", accent: "#60A5FA" },
  { id: "street", name: "Street", emoji: "🌮", accent: "#34D399" },
  { id: "drinks", name: "Drinks", emoji: "🍹", accent: "#F472B6" },
  { id: "dietcoke", name: "Diet Coke", emoji: "🥤", accent: "#EF4444" },
  { id: "movie", name: "Movie", emoji: "🎬", accent: "#818CF8" },
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
    try {
      await api.updateSocialStatus({
        energy,
        freeNow: id === "Lessgo",
      });
    } catch {
      // soft fail — UI still updates
    }
  };

  const handleSendInvite = () => {
    router.push("/reels");
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["rgba(138,86,255,0.22)", "transparent"]}
        style={styles.glowTop}
      />
      <LinearGradient
        colors={["transparent", "rgba(255,75,129,0.12)"]}
        style={styles.glowBottom}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable style={styles.iconBtn} onPress={openSidebar}>
          <Ionicons name="menu" size={20} color={T.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>Hey, {firstName}</Text>
          <Text style={styles.headerTitle}>Your vibe</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/reels")}>
          <Ionicons name="people" size={18} color={T.purple} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 110 }]}
      >
        {/* Energy */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Social energy</Text>
          <Text style={styles.sectionSub}>How are you showing up today?</Text>
          <View style={styles.vibeRow}>
            {VIBE_ORBS.map((orb) => {
              const active = selectedVibe === orb.id;
              return (
                <Pressable
                  key={orb.id}
                  onPress={() => handleOrbPress(orb.id)}
                  style={[styles.vibeCard, active && { borderColor: orb.accent }]}
                >
                  <LinearGradient
                    colors={orb.colors}
                    style={styles.vibeOrb}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
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
              <Text style={styles.sectionTitle}>Quick activities</Text>
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
                    active && {
                      borderColor: act.accent,
                      backgroundColor: `${act.accent}18`,
                    },
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
          <Text style={styles.sectionTitle}>When?</Text>
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
                      colors={["#8A56FF", "#FF4B81"]}
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
                      <Ionicons name={chip.icon} size={15} color={T.faint} />
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

        {/* Invite preview card */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.inviteCard}>
          <LinearGradient
            colors={["#1A1228", "#0E0E14"]}
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
              <View style={[styles.vibePill, { backgroundColor: `${vibe.accent}22` }]}>
                <Text style={[styles.vibePillText, { color: vibe.accent }]}>
                  {selectedVibe}
                </Text>
              </View>
            </View>
            <Text style={styles.inviteHint}>
              Opens Friends Hangout — send to a real match
            </Text>
            <View style={styles.inviteActions}>
              <Pressable style={{ flex: 1 }} onPress={handleSendInvite}>
                <LinearGradient
                  colors={["#8A56FF", "#FF4B81"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendBtn}
                >
                  <Ionicons name="paper-plane" size={16} color="#fff" />
                  <Text style={styles.sendBtnText}>Send Invite</Text>
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

        {/* Premium tip — honest, not fake unlock */}
        <Pressable
          style={styles.premiumCard}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <View style={styles.premiumIcon}>
            <Ionicons name="diamond" size={18} color="#FBBF24" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>Go Premium</Text>
            <Text style={styles.premiumSub}>See likes, boosts & more from Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={T.faint} />
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
    paddingBottom: 10,
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
  },
  headerCenter: { alignItems: "center" },
  greeting: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.faint,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginTop: 1,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  section: { marginBottom: 22 },
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
    color: T.faint,
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
    color: T.faint,
    marginTop: 2,
    textAlign: "center",
  },
  actGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginTop: 8,
  },
  actCell: {
    width: "18.5%",
    aspectRatio: 0.9,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
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
  },
  timeLabelActive: { fontSize: 13, fontFamily: VibeFonts.bold, color: "#fff" },
  timeSubActive: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.7)",
    marginTop: 1,
  },
  timeLabel: { fontSize: 13, fontFamily: VibeFonts.bold, color: T.muted },
  timeSub: { fontSize: 10, fontFamily: VibeFonts.medium, color: T.faint, marginTop: 1 },
  inviteCard: {
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.3)",
  },
  inviteGrad: { padding: 16 },
  inviteTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  inviteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(168,85,247,0.4)",
  },
  inviteTitle: { fontSize: 15, fontFamily: VibeFonts.bold, color: T.ink },
  inviteSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
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
    color: T.faint,
    marginTop: 12,
    marginBottom: 12,
  },
  inviteActions: { flexDirection: "row", gap: 10 },
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
    backgroundColor: T.elevated,
    borderWidth: 1,
    borderColor: T.border,
  },
  chatBtnText: { color: T.ink, fontSize: 13, fontFamily: VibeFonts.bold },
  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    padding: 14,
    marginBottom: 8,
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(251,191,36,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumTitle: { fontSize: 14, fontFamily: VibeFonts.bold, color: T.ink },
  premiumSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    marginTop: 2,
  },
});
