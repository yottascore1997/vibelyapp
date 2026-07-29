import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/vibe/GlassCard";
import TabBar from "../components/TabBar";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";
import { api } from "../services/api";
import VibeSplitModal from "../components/vibe/VibeSplitModal";

const { width } = Dimensions.get("window");

export default function EventDetailsScreen() {
  const router = useRouter();
  const [showSplitModal, setShowSplitModal] = useState(false);
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    category: string;
    location: string;
    timeLabel: string;
    creatorName: string;
    creatorAvatar: string;
    creatorTimeAgo: string;
    tags: string;
    description: string;
    imageUrl: string;
    goingCount: string;
    commentCount: string;
    isVerified: string;
    isFree: string;
  }>();

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [goingNum, setGoingNum] = useState(parseInt(params.goingCount || "12", 10));

  const tagsList = params.tags ? params.tags.split(",") : ["Chill", "Meetup"];

  const handleJoinPress = async () => {
    if (joined) {
      setJoined(false);
      setGoingNum((prev) => Math.max(1, prev - 1));
      return;
    }
    if (!params.id) return;
    setJoining(true);
    try {
      await api.joinPlan(String(params.id));
      setJoined(true);
      setGoingNum((prev) => prev + 1);
      try {
        await api.addJarItem({
          title: `Joined ${params.title || "event"}`,
          type: "PLAN",
          description: String(params.location || ""),
        });
      } catch {
        // optional
      }
      Alert.alert("You're in! 🎉", "Registration successful — see you at the venue.");
    } catch (e) {
      Alert.alert("Join failed", e instanceof Error ? e.message : "Could not join event");
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Background glowing orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      {/* Absolute Floating Header Actions */}
      <SafeAreaView style={styles.floatingHeader} edges={["top"]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Event Details</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="share-social-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="bookmark-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image & Vignette at the very top of ScrollView */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: params.imageUrl || "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=800" }}
            style={styles.coverImage}
          />
          <LinearGradient
            colors={["rgba(5,5,8,0.15)", "rgba(5,5,8,0.5)", "#050508"]}
            style={styles.vignette}
          />
        </View>

        {/* Content Wrapper with padding */}
        <View style={styles.mainContent}>
          {/* Main overlapping Card Details */}
          <GlassCard style={styles.glassCard}>
            
            {/* Category Tag badge */}
            <View style={styles.badgeRow}>
              <LinearGradient
                colors={["#8A56FF", "#FF4B81"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.categoryBadge}
              >
                <Ionicons name="sparkles" size={10} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.categoryBadgeText}>
                  {params.category ? params.category.toUpperCase() : "CHILL"}
                </Text>
              </LinearGradient>
              
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE EVENT</Text>
              </View>
            </View>

            {/* Event Title */}
            <Text style={styles.title}>{params.title || "Rooftop Sunset Hangout"}</Text>
            
            {/* Host Creator info card row */}
            <View style={styles.hostRow}>
              <Image
                source={{ uri: params.creatorAvatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" }}
                style={styles.hostAvatar}
              />
              <View style={styles.hostMeta}>
                <View style={styles.hostNameRow}>
                  <Text style={styles.hostName}>{params.creatorName || "Rohan"}</Text>
                  {params.isVerified === "true" && (
                    <Ionicons name="checkmark-circle" size={12} color="#8A56FF" style={{ marginLeft: 3 }} />
                  )}
                </View>
                <Text style={styles.hostRole}>Event Host / Organizer</Text>
              </View>
              <TouchableOpacity style={styles.messageHostBtn}>
                <Ionicons name="chatbubble-ellipses" size={14} color="#C084FC" />
                <Text style={styles.messageHostText}>Chat</Text>
              </TouchableOpacity>
            </View>

            {/* Logistics Rows */}
            <View style={styles.logisticsContainer}>
              {/* Location row */}
              <View style={styles.logisticsRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location" size={18} color="#C084FC" />
                </View>
                <View style={styles.logisticsText}>
                  <Text style={styles.logisticsLabel}>Venue Location</Text>
                  <Text style={styles.logisticsValue}>{params.location || "Empress City Rooftop, Nagpur"}</Text>
                </View>
              </View>

              {/* Timing row */}
              <View style={styles.logisticsRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar" size={18} color="#C084FC" />
                </View>
                <View style={styles.logisticsText}>
                  <Text style={styles.logisticsLabel}>Time & Schedule</Text>
                  <Text style={styles.logisticsValue}>{params.timeLabel || "Today, 6:00 PM Onwards"}</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          {/* Event description block */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Event</Text>
            <Text style={styles.descriptionText}>
              {params.description || "Join us for an amazing local hangout with Nagpur's premium member community! Good vibes, chill conversations, food meetups, and new memories are guaranteed."}
            </Text>
          </View>

          {/* VibeSplit Event Expenses Banner */}
          <TouchableOpacity
            onPress={() => setShowSplitModal(true)}
            style={{ marginHorizontal: 16, marginVertical: 12, borderRadius: 20, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 24 }}>💳</Text>
                <View>
                  <Text style={{ fontSize: 14, fontFamily: VibeFonts.bold, color: "#FFFFFF" }}>
                    VibeSplit — Split Bills 💳💸
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: VibeFonts.medium, color: "rgba(255,255,255,0.85)" }}>
                    Track shared food, drinks & tickets
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontFamily: VibeFonts.bold, color: "#FFFFFF" }}>
                  Open Jar ›
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Event Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Tags</Text>
            <View style={styles.tagsRow}>
              {tagsList.map((tag, idx) => (
                <View key={idx} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag.trim()}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Attendees roster */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who's going ({goingNum} Members)</Text>
            
            <View style={styles.attendeesList}>
              {["https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
                "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
              ].map((uri, idx) => (
                <View key={idx} style={styles.attendeePill}>
                  <Image source={{ uri }} style={styles.attendeeAvatar} />
                  <Text style={styles.attendeeName}>Member</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sticky join CTA bar */}
          <View style={styles.joinActionArea}>
            <TouchableOpacity style={styles.mainJoinBtn} onPress={handleJoinPress} activeOpacity={0.85}>
              <LinearGradient
                colors={joined ? ["#22C55E", "#16A34A"] : ["#8A56FF", "#FF4B81"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainJoinGrad}
              >
                <Ionicons name={joined ? "checkmark-circle" : "sparkles"} size={18} color="#fff" />
                <Text style={styles.mainJoinBtnText}>
                  {joined ? "Interested Registered!" : "I'm Interested"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer tab bar */}
      <VibeSplitModal
        visible={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        eventId={params.id}
        titleName={params.title || "Event"}
      />
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050508" },
  orb: { position: "absolute", borderRadius: 999, opacity: 0.5 },
  orb1: { width: 220, height: 220, top: 180, right: -60, backgroundColor: "rgba(138,86,255,0.12)" },
  orb2: { width: 200, height: 200, bottom: 90, left: -60, backgroundColor: "rgba(255,75,129,0.08)" },

  imageContainer: {
    width: "100%",
    height: 280,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  vignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  // Header Actions
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(5,5,8,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontFamily: VibeFonts.bold, color: "#fff", maxWidth: 160 },
  headerRightActions: { flexDirection: "row", gap: 6 },

  // Content Wrapper
  mainContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    marginTop: -50,
    zIndex: 5,
  },

  // Main overlap details card
  glassCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: "#0D0B18",
    borderColor: "rgba(138, 86, 255, 0.22)",
    borderWidth: 1,
  },
  badgeRow: { flexDirection: "row", gap: 6, marginBottom: Spacing.md },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  categoryBadgeText: { color: "#fff", fontSize: 9, fontFamily: VibeFonts.bold, letterSpacing: 0.5 },
  freeBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 0.5,
    borderColor: "rgba(34,197,94,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    justifyContent: "center",
  },
  freeBadgeText: { color: "#22C55E", fontSize: 8, fontFamily: VibeFonts.bold },
  title: { fontSize: 24, fontFamily: VibeFonts.extraBold, color: "#fff", marginBottom: Spacing.md },
  
  // Host organizer row
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.06)",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  hostAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  hostMeta: { flex: 1 },
  hostNameRow: { flexDirection: "row", alignItems: "center" },
  hostName: { color: "#fff", fontSize: 13, fontFamily: VibeFonts.bold },
  hostRole: { color: VibeColors.textMuted, fontSize: 9, fontFamily: VibeFonts.medium },
  messageHostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(138,86,255,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(138,86,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  messageHostText: { color: "#C084FC", fontSize: 10, fontFamily: VibeFonts.bold },

  // Logistics rows
  logisticsContainer: { gap: Spacing.md },
  logisticsRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(138,86,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  logisticsText: { flex: 1, gap: 1 },
  logisticsLabel: { color: VibeColors.textMuted, fontSize: 9, fontFamily: VibeFonts.medium },
  logisticsValue: { color: "#fff", fontSize: 12, fontFamily: VibeFonts.bold },

  // Page Sections
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 15, fontFamily: VibeFonts.bold, color: "#fff", marginBottom: Spacing.sm },
  descriptionText: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontFamily: VibeFonts.medium, lineHeight: 18 },

  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagPill: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  tagText: { color: "#C084FC", fontSize: 10, fontFamily: VibeFonts.bold },

  // Attendees list
  attendeesList: { flexDirection: "row", gap: Spacing.md, flexWrap: "wrap" },
  attendeePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  attendeeAvatar: { width: 22, height: 22, borderRadius: 11 },
  attendeeName: { color: VibeColors.textMuted, fontSize: 10, fontFamily: VibeFonts.medium },

  // Join Action Button Area
  joinActionArea: { marginTop: Spacing.lg },
  mainJoinBtn: { borderRadius: Radius.full, overflow: "hidden" },
  mainJoinGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  mainJoinBtnText: { color: "#fff", fontSize: 13, fontFamily: VibeFonts.bold },
});
