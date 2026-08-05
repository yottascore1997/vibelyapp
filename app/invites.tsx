import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Linking,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import GlassCard from "../components/vibe/GlassCard";
import AppHeader from "../components/vibe/AppHeader";
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
  status: "pending" | "accepted" | "rejected" | "countered";
  type: "received" | "sent";
  isCounter?: boolean;
}

const inviteActivities = [
  { id: "coffee", name: "Coffee", emoji: "☕" },
  { id: "drinks", name: "Drinks", emoji: "🍸" },
  { id: "movie", name: "Movie", emoji: "🍿" },
  { id: "food", name: "Food", emoji: "🍕" },
  { id: "drive", name: "Drive", emoji: "🚗" },
];

export default function InvitesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [invites, setInvites] = useState<DirectInvite[]>([]);
  const [activeDashFilter, setActiveDashFilter] = useState<"All" | "Accepted" | "Pending" | "Rejected" | "Countered">("All");
  const [counterForId, setCounterForId] = useState<string | null>(null);

  // WhatsApp Invite Modal State
  const [showWaModal, setShowWaModal] = useState(false);
  const [selectedAct, setSelectedAct] = useState(inviteActivities[0]);
  const [timeLabel, setTimeLabel] = useState("Today 6 PM");
  const [inviteeName, setInviteeName] = useState("");
  const [isSendingWa, setIsSendingWa] = useState(false);

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

  const handleCounterInvite = async (id: string, act: { name: string; emoji: string }) => {
    try {
      const res = await api.respondToInvite(id, "counter", {
        activityName: act.name,
        activityEmoji: act.emoji,
        timeLabel: "Soon",
      });
      if (res) {
        setCounterForId(null);
        await loadInvites();
        Alert.alert("Counter sent", `You suggested ${act.emoji} ${act.name}`);
      }
    } catch (err) {
      console.error("Counter invite failed:", err);
      Alert.alert("Error", "Could not send counter offer.");
    }
  };

  const handleCreateWhatsAppInvite = async () => {
    setIsSendingWa(true);
    try {
      const res = await api.createPublicInvite({
        activityName: selectedAct.name,
        activityEmoji: selectedAct.emoji,
        timeLabel: timeLabel || "Today 6 PM",
        inviteeName: inviteeName.trim() || undefined,
      });

      if (res && res.whatsappUrl) {
        setShowWaModal(false);
        setInviteeName("");
        await Linking.openURL(res.whatsappUrl);
        await loadInvites();
      }
    } catch (err) {
      Alert.alert("Error", "Could not generate WhatsApp invite. Please check server connection.");
    } finally {
      setIsSendingWa(false);
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
        <AppHeader variant="light" tagline="Squad pings & direct RSVPs" />

        {/* Header matching Hangout theme */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#18181B" />
          </Pressable>
          <View style={styles.titleWrap}>
            <View style={styles.eyebrowPill}>
              <Ionicons name="flash" size={11} color="#7C3AED" />
              <Text style={styles.eyebrowText}>DIRECT PINGS & MOVES</Text>
            </View>
            <Text style={styles.title}>
              Friends <Text style={{ color: "#7C3AED" }}>Pings 💌</Text>
            </Text>
            <Text style={styles.subtitle}>Direct hangs & squad RSVPs</Text>
          </View>
          <Pressable style={styles.waHeaderBtn} onPress={() => setShowWaModal(true)}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          </Pressable>
        </View>

        {/* WhatsApp Invite Banner */}
        <Pressable onPress={() => setShowWaModal(true)} style={styles.waBannerContainer}>
          <LinearGradient colors={["#FFFFFF", "#F0FDF4"]} style={styles.waBanner}>
            <View style={styles.waBannerLeft}>
              <View style={styles.waIconWrap}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.waBannerTitle}>Invite Non-App Friends 🚀</Text>
                <Text style={styles.waBannerSub}>Send WhatsApp Coffee link & web RSVP</Text>
              </View>
            </View>
            <View style={styles.waGoBtn}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Tab Filters */}
        <View style={styles.filters}>
          {["All", "Accepted", "Pending", "Rejected", "Countered"].map((filter) => {
            const active = activeDashFilter === filter;
            return (
              <Pressable key={filter} onPress={() => setActiveDashFilter(filter as any)} style={styles.filterPressable}>
                {active ? (
                  <LinearGradient colors={["#7C3AED", "#EC4899"]} style={styles.filterActivePill}>
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
              <Ionicons name="mail-open-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No invitations in this section</Text>
            </View>
          ) : (
            filteredInvites.map((inv) => (
              <View key={inv.id} style={styles.rsvpCard}>
                <View style={styles.rsvpHeader}>
                  <View style={styles.rsvpLeft}>
                    <View style={styles.avatarWrap}>
                      <Image source={{ uri: inv.type === "sent" ? inv.recipientAvatar : inv.senderAvatar }} style={styles.rsvpAvatar} />
                      <View style={styles.verifiedCheck}>
                        <Ionicons name="checkmark" size={9} color="#fff" />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.rsvpTitle}>{inv.type === "sent" ? "Outgoing Ping" : "Incoming Ping"}</Text>
                        <View style={styles.actTagPill}>
                          <Text style={styles.actTagText}>{inv.activityEmoji} {inv.activityName}</Text>
                        </View>
                      </View>
                      <Text style={styles.rsvpSub}>
                        {inv.type === "sent" ? `to ${inv.recipientName}` : `from ${inv.senderName}`} · {inv.timeLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardMetaRow}>
                  {/* Status Pill */}
                  {inv.status === "pending" ? (
                    <View style={[styles.statusPill, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}>
                      <Text style={[styles.statusText, { color: "#B45309" }]}>
                        {inv.isCounter ? "🔄 Counter pending" : "⏳ Pending RSVP"}
                      </Text>
                    </View>
                  ) : inv.status === "accepted" ? (
                    <View style={[styles.statusPill, { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" }]}>
                      <Text style={[styles.statusText, { color: "#15803D" }]}>🟢 Accepted</Text>
                    </View>
                  ) : inv.status === "countered" ? (
                    <View style={[styles.statusPill, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}>
                      <Text style={[styles.statusText, { color: "#B45309" }]}>🔄 Countered</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusPill, { backgroundColor: "#FFE4E6", borderColor: "#FECDD3" }]}>
                      <Text style={[styles.statusText, { color: "#BE185D" }]}>🔴 Declined</Text>
                    </View>
                  )}
                </View>

                {/* Accept/Reject/Counter for received pending */}
                {inv.type === "received" && inv.status === "pending" && (
                  <View style={{ gap: 8 }}>
                    <View style={styles.actionsRow}>
                      <Pressable onPress={() => handleRejectInvite(inv.id)} style={[styles.actBtn, styles.rejectBtn]}>
                        <Ionicons name="close-circle" size={16} color="#E11D48" />
                        <Text style={styles.rejectText}>Decline</Text>
                      </Pressable>
                      <Pressable onPress={() => handleAcceptInvite(inv.id)} style={[styles.actBtn, styles.acceptBtn]}>
                        <LinearGradient colors={["#22C55E", "#15803D"]} style={styles.acceptGradient}>
                          <Ionicons name="checkmark-circle" size={16} color="#fff" />
                          <Text style={styles.acceptText}>Join Hang</Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={() => setCounterForId(counterForId === inv.id ? null : inv.id)}
                      style={[styles.actBtn, { backgroundColor: "#F3E8FF", borderColor: "#DDD6FE", borderWidth: 1 }]}
                    >
                      <Ionicons name="swap-horizontal" size={16} color="#7C3AED" />
                      <Text style={{ color: "#7C3AED", fontFamily: VibeFonts.bold, fontSize: 13 }}>
                        Counter offer
                      </Text>
                    </Pressable>
                    {counterForId === inv.id && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {inviteActivities.map((act) => (
                          <Pressable
                            key={act.id}
                            onPress={() => handleCounterInvite(inv.id, act)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 12,
                              backgroundColor: "#fff",
                              borderWidth: 1,
                              borderColor: "#E2E8F0",
                            }}
                          >
                            <Text style={{ fontFamily: VibeFonts.bold, fontSize: 12, color: "#18181B" }}>
                              {act.emoji} {act.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
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
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      {/* WhatsApp Invite Modal */}
      <Modal visible={showWaModal} transparent animationType="slide" onRequestClose={() => setShowWaModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                <Text style={styles.modalTitle}>Invite via WhatsApp</Text>
              </View>
              <Pressable onPress={() => setShowWaModal(false)}>
                <Ionicons name="close" size={22} color={VibeColors.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.modalDesc}>
              Choose a vibe activity and share a dynamic Web RSVP link with non-app friends or WhatsApp groups!
            </Text>

            {/* Select Activity */}
            <Text style={styles.sectionLabel}>Select Activity:</Text>
            <View style={styles.actGrid}>
              {inviteActivities.map((act) => {
                const selected = selectedAct.id === act.id;
                return (
                  <Pressable
                    key={act.id}
                    onPress={() => setSelectedAct(act)}
                    style={[styles.actChip, selected && styles.actChipSelected]}
                  >
                    <Text style={styles.actChipEmoji}>{act.emoji}</Text>
                    <Text style={[styles.actChipText, selected && styles.actChipTextSelected]}>{act.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Optional Friend Name */}
            <Text style={styles.sectionLabel}>Friend's Name (Optional):</Text>
            <TextInput
              value={inviteeName}
              onChangeText={setInviteeName}
              placeholder="e.g. Priya or WhatsApp Group"
              placeholderTextColor={VibeColors.textMuted}
              style={styles.modalInput}
            />

            {/* Time label */}
            <Text style={styles.sectionLabel}>Time / Schedule:</Text>
            <TextInput
              value={timeLabel}
              onChangeText={setTimeLabel}
              placeholder="e.g. Today 6 PM"
              placeholderTextColor={VibeColors.textMuted}
              style={styles.modalInput}
            />

            {/* Share Button */}
            <Pressable disabled={isSendingWa} onPress={handleCreateWhatsAppInvite} style={styles.shareBtnWrap}>
              <LinearGradient colors={["#25D366", "#128C7E"]} style={styles.shareBtn}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.shareBtnText}>
                  {isSendingWa ? "Generating Link..." : `Share ${selectedAct.name} Invite to WhatsApp`}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  safe: {
    flex: 1,
  },
  ambient: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleWrap: {
    alignItems: "center",
  },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 2,
  },
  eyebrowText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 1,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  waHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  waBannerContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  waBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    backgroundColor: "#FFFFFF",
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  waBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  waIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  waBannerTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  waBannerSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#475569",
    marginTop: 1,
  },
  waGoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  filterPressable: {
    flex: 1,
  },
  filterActivePill: {
    paddingVertical: 9,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filterActiveText: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  filterIdlePill: {
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  filterIdleText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  listScroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  rsvpCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: 16,
    gap: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 3,
  },
  rsvpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rsvpLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    position: "relative",
  },
  rsvpAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: "#7C3AED",
  },
  verifiedCheck: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  rsvpTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  actTagPill: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  actTagText: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
  },
  rsvpSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  actBtn: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    overflow: "hidden",
  },
  rejectBtn: {
    backgroundColor: "#FFE4E6",
    borderWidth: 1,
    borderColor: "#FECDD3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rejectText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#E11D48",
  },
  acceptBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  acceptGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  rsvpAttendees: { gap: 6, marginTop: 4 },
  attendeesLabel: { fontSize: 10, fontFamily: VibeFonts.bold, color: "#64748B", textTransform: "uppercase" },
  attendeeList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  attendeePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  attAvatar: { width: 18, height: 18, borderRadius: 9 },
  attName: { fontSize: 11, fontFamily: VibeFonts.bold, color: "#7C3AED" },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(10,8,20,0.65)", justifyContent: "center", padding: 20 },
  modalContent: { padding: 22, borderRadius: 26, backgroundColor: "#FFFFFF" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 16, fontFamily: VibeFonts.extraBold, color: "#18181B" },
  modalDesc: { fontSize: 12, fontFamily: VibeFonts.medium, color: "#64748B", marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontFamily: VibeFonts.bold, color: "#18181B", marginBottom: 6 },
  actGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  actChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "#F8F9FD", borderWidth: 1, borderColor: "#E2E8F0" },
  actChipSelected: { backgroundColor: "#F3E8FF", borderColor: "#7C3AED" },
  actChipEmoji: { fontSize: 14 },
  actChipText: { fontSize: 12, fontFamily: VibeFonts.medium, color: "#18181B" },
  actChipTextSelected: { fontFamily: VibeFonts.bold, color: "#7C3AED" },
  modalInput: { backgroundColor: "#F8F9FD", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, fontFamily: VibeFonts.medium, color: "#18181B", marginBottom: 12 },
  shareBtnWrap: { borderRadius: 16, overflow: "hidden", marginTop: 6 },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  shareBtnText: { fontSize: 14, fontFamily: VibeFonts.extraBold, color: "#fff" },
});
