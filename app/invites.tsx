import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import GlassCard from "../components/vibe/GlassCard";
import TabBar from "../components/TabBar";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";

interface DirectInvite {
  id: string;
  senderName: string;
  senderAvatar: string;
  recipientName: string;
  recipientAvatar: string;
  activityEmoji: string;
  activityName: string;
  timeLabel: string;
  status: "pending" | "accepted" | "rejected";
  type: "received" | "sent";
}

export default function InvitesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [invites, setInvites] = useState<DirectInvite[]>([]);
  const [activeDashFilter, setActiveDashFilter] = useState<"All" | "Accepted" | "Pending" | "Rejected">("All");

  const loadInvites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getInvites(user.id);
      if (res) {
        const resolveAvatar = (url?: string | null) => {
          if (url) {
            if (url.startsWith("/")) {
              const { API_URL } = require("../constants/theme");
              const serverBaseUrl = API_URL.replace("/api", "");
              return `${serverBaseUrl}${url}`;
            }
            return url;
          }
          return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";
        };

        const resolved = (res as any[]).map((inv) => ({
          ...inv,
          senderAvatar: resolveAvatar(inv.senderAvatar),
          recipientAvatar: resolveAvatar(inv.recipientAvatar),
        }));

        setInvites(resolved);
      }
    } catch (err) {
      console.error("Load invites failed:", err);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadInvites();
    }, [loadInvites])
  );

  const handleAcceptInvite = async (id: string) => {
    try {
      const res = await api.respondToInvite(id, "accepted");
      if (res) {
        await loadInvites();
      }
    } catch (err) {
      console.error("Accept invite failed:", err);
    }
  };

  const handleRejectInvite = async (id: string) => {
    try {
      const res = await api.respondToInvite(id, "rejected");
      if (res) {
        await loadInvites();
      }
    } catch (err) {
      console.error("Reject invite failed:", err);
    }
  };

  const filteredInvites = invites.filter((inv) => {
    if (activeDashFilter === "All") return true;
    return inv.status.toLowerCase() === activeDashFilter.toLowerCase();
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Ambient backgrounds */}
      <View style={[styles.ambient, { top: 60, left: -40, backgroundColor: "rgba(138,86,255,0.18)" }]} />
      <View style={[styles.ambient, { top: 220, right: -50, backgroundColor: "rgba(59,130,246,0.15)" }]} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.title}>All Invitations</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Tab Filters */}
        <View style={styles.filters}>
          {["All", "Accepted", "Pending", "Rejected"].map((filter) => {
            const active = activeDashFilter === filter;
            return (
              <Pressable key={filter} onPress={() => setActiveDashFilter(filter as any)} style={styles.filterPressable}>
                {active ? (
                  <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.filterActivePill}>
                    <Text style={styles.filterActiveText}>{filter}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterIdlePill}>
                    <Text style={styles.filterIdleText}>{filter}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Scroll list */}
        <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
          {filteredInvites.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="mail-open-outline" size={48} color={VibeColors.textMuted} />
              <Text style={styles.emptyText}>No invitations in this section</Text>
            </View>
          ) : (
            filteredInvites.map((inv) => (
              <GlassCard key={inv.id} style={styles.rsvpCard}>
                <View style={styles.rsvpHeader}>
                  <View style={styles.rsvpLeft}>
                    <Image source={{ uri: inv.type === "sent" ? inv.recipientAvatar : inv.senderAvatar }} style={styles.rsvpAvatar} />
                    <View>
                      <Text style={styles.rsvpTitle}>{inv.type === "sent" ? "Outgoing" : "Incoming"} · {inv.activityName} {inv.activityEmoji}</Text>
                      <Text style={styles.rsvpSub}>{inv.type === "sent" ? `to ${inv.recipientName}` : `from ${inv.senderName}`} · {inv.timeLabel}</Text>
                    </View>
                  </View>
                  
                  {/* Status Pill */}
                  {inv.status === "pending" ? (
                    <View style={[styles.statusPill, { backgroundColor: "rgba(234,179,8,0.12)", borderColor: "rgba(234,179,8,0.22)" }]}>
                      <Text style={[styles.statusText, { color: "#FBBF24" }]}>Pending</Text>
                    </View>
                  ) : inv.status === "accepted" ? (
                    <View style={[styles.statusPill, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.22)" }]}>
                      <Text style={[styles.statusText, { color: "#4ADE80" }]}>Accepted 🟢</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusPill, { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.22)" }]}>
                      <Text style={[styles.statusText, { color: "#F87171" }]}>Declined 🔴</Text>
                    </View>
                  )}
                </View>
                
                {/* Accept/Reject actions for received pending plans */}
                {inv.type === "received" && inv.status === "pending" && (
                  <View style={styles.actionsRow}>
                    <Pressable onPress={() => handleRejectInvite(inv.id)} style={[styles.actBtn, styles.rejectBtn]}>
                      <Ionicons name="close" size={14} color="#EF4444" />
                      <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                    <Pressable onPress={() => handleAcceptInvite(inv.id)} style={[styles.actBtn, styles.acceptBtn]}>
                      <LinearGradient colors={["#22C55E", "#15803D"]} style={styles.acceptGradient}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                        <Text style={styles.acceptText}>Accept</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                )}

                {/* Attendees list (Who's coming) */}
                <View style={styles.rsvpAttendees}>
                  <Text style={styles.attendeesLabel}>Joined Status:</Text>
                  <View style={styles.attendeeList}>
                    <View style={styles.attendeePill}>
                      <Image source={{ uri: inv.type === "sent" ? inv.senderAvatar : inv.recipientAvatar }} style={styles.attAvatar} />
                      <Text style={styles.attName}>{inv.type === "sent" ? "You (Host)" : "You"}</Text>
                    </View>
                    {inv.status === "accepted" && (
                      <Animated.View entering={FadeIn.duration(300)} style={styles.attendeePill}>
                        <Image source={{ uri: inv.type === "sent" ? inv.recipientAvatar : inv.senderAvatar }} style={styles.attAvatar} />
                        <Text style={styles.attName}>{inv.type === "sent" ? `${inv.recipientName} (Coming)` : `${inv.senderName} (Host)`}</Text>
                      </Animated.View>
                    )}
                  </View>
                </View>
              </GlassCard>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: VibeColors.bg },
  ambient: { position: "absolute", width: 160, height: 160, borderRadius: 80, zIndex: 0 },
  safe: { flex: 1, zIndex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontFamily: VibeFonts.bold, color: "#fff" },
  filters: { flexDirection: "row", paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: 8 },
  filterPressable: { flex: 1 },
  filterActivePill: { paddingVertical: 8, borderRadius: Radius.full, alignItems: "center", justifyContent: "center" },
  filterActiveText: { fontSize: 11, fontFamily: VibeFonts.bold, color: "#fff" },
  filterIdlePill: { paddingVertical: 8, borderRadius: Radius.full, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  filterIdleText: { fontSize: 11, fontFamily: VibeFonts.medium, color: VibeColors.textMuted },
  listScroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40, gap: 12 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: VibeFonts.medium, color: VibeColors.textMuted },
  
  // RSVP Cards inside list
  rsvpCard: { padding: 12, borderRadius: Radius.md },
  rsvpHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", paddingBottom: 10, marginBottom: 8 },
  rsvpLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rsvpAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#C084FC" },
  rsvpTitle: { fontSize: 12, fontFamily: VibeFonts.bold, color: VibeColors.text },
  rsvpSub: { fontSize: 10, fontFamily: VibeFonts.regular, color: VibeColors.textMuted },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  statusText: { fontSize: 9, fontFamily: VibeFonts.bold },
  actionsRow: { flexDirection: "row", gap: 10, marginVertical: 8 },
  actBtn: { flex: 1, height: 36, borderRadius: Radius.md, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  rejectBtn: { backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  rejectText: { fontSize: 12, fontFamily: VibeFonts.bold, color: "#EF4444" },
  acceptBtn: { },
  acceptGradient: { width: "100%", height: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  acceptText: { fontSize: 12, fontFamily: VibeFonts.bold, color: "#fff" },
  rsvpAttendees: { gap: 6 },
  attendeesLabel: { fontSize: 10, fontFamily: VibeFonts.bold, color: VibeColors.textMuted, textTransform: "uppercase" },
  attendeeList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  attendeePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  attAvatar: { width: 16, height: 16, borderRadius: 8 },
  attName: { fontSize: 10, fontFamily: VibeFonts.medium, color: VibeColors.text },
});
