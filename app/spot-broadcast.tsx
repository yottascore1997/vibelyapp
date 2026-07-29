import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Share,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { VibeFonts } from "../constants/vibeTheme";
import { api } from "../services/api";
import { usePlans } from "../context/PlansContext";
import TabBar from "../components/TabBar";

const { width: SCREEN_W } = Dimensions.get("window");

const VENUE_PRESETS = [
  { id: "cafe", name: "Starbucks / Cafe", emoji: "☕", color: "#F59E0B" },
  { id: "food", name: "Pizza / Dinner", emoji: "🍕", color: "#EF4444" },
  { id: "movie", name: "Cinema / Movie", emoji: "🍿", color: "#8B5CF6" },
  { id: "drive", name: "Late Drive", emoji: "🚗", color: "#3B82F6" },
  { id: "drinks", name: "Pub / Cocktails", emoji: "🍸", color: "#EC4899" },
  { id: "gaming", name: "Gaming / Arcade", emoji: "🎮", color: "#10B981" },
];

const DEMO_EVENTS = [
  {
    id: "evt-1",
    title: "Coffee & Board Games ☕",
    location: "Starbucks FC Road",
    time: "Right Now ⚡",
    hostName: "Alex M.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop",
    membersCount: 3,
  },
  {
    id: "evt-2",
    title: "Late Night Pizza Move 🍕",
    location: "Domino's Central",
    time: "Tonight 9 PM 🌆",
    hostName: "Rohan S.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop",
    membersCount: 4,
  },
];

const TIME_PRESETS = [
  { label: "30 Mins ⚡", val: 30 },
  { label: "45 Mins ⏳", val: 45 },
  { label: "1 Hour ⌛", val: 60 },
];

export default function SpotBroadcastScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedPreset, setSelectedPreset] = useState(VENUE_PRESETS[0]);
  const [venueName, setVenueName] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [eventsList, setEventsList] = useState<any[]>([]);

  // Fetch created events safely
  useEffect(() => {
    let isMounted = true;
    api
      .getHangouts()
      .then((res: any) => {
        if (!isMounted) return;
        if (res && Array.isArray(res) && res.length > 0) {
          const mapped = res.map((h: any) => ({
            id: h.id,
            title: h.activityName || h.title || "Live Spot",
            location: h.location || h.destination || "Nagpur",
            time: h.timeLabel || "Active ⚡",
            hostName: h.creator?.name || "Host",
            avatarUrl: h.creator?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop",
            membersCount: h.participantsCount || h.going || 2,
          }));
          setEventsList(mapped);
        } else {
          setEventsList(DEMO_EVENTS);
        }
      })
      .catch(() => {
        if (isMounted) setEventsList(DEMO_EVENTS);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBroadcastSpot = async () => {
    const finalVenue = venueName.trim() || selectedPreset.name;
    setLoading(true);

    try {
      await api.updateSocialStatus({
        energy: "LESSGO",
        freeNow: true,
        activity: `${selectedPreset.emoji} at ${finalVenue}`,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
      router.push({
        pathname: "/spot-radar",
        params: {
          venue: finalVenue,
          vibe: selectedPreset.name,
          emoji: selectedPreset.emoji,
          duration: String(duration),
        },
      });
    }
  };

  const handleShareToWhatsApp = async () => {
    const finalVenue = venueName.trim() || selectedPreset.name;
    setLoading(true);
    try {
      const res = await api.createPublicInvite({
        activityName: selectedPreset.name,
        activityEmoji: selectedPreset.emoji,
        timeLabel: `At ${finalVenue} for next ${duration} mins!`,
      });

      const shareMsg = `Hey! Sitting at ${finalVenue} (${selectedPreset.emoji}). Join my table: ${
        res?.inviteUrl || "https://vibematch.app"
      }`;
      await Share.share({ message: shareMsg });
    } catch {
      const shareMsg = `Sitting at ${finalVenue} (${selectedPreset.emoji}) right now! Join me: https://vibematch.app`;
      await Share.share({ message: shareMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" backgroundColor="#F8F9FD" />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#18181B" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.statusBadge}>
            <View style={styles.purpleDot} />
            <Text style={styles.statusText}>SPOT & LIVE MOVES</Text>
          </View>
          <Text style={styles.headerTitle}>Spot Hub ⚡</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/create-plan")}>
          <Ionicons name="add-circle-outline" size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1: Active Created Events Feed */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="flame-sharp" size={16} color="#7C3AED" />
            <Text style={styles.sectionTitle}>ACTIVE CREATED EVENTS ({eventsList.length})</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/hangout")}>
            <Text style={styles.seeAllText}>View All ›</Text>
          </TouchableOpacity>
        </View>

        {eventsList.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsScroll}>
            {eventsList.map((evt, idx) => (
              <Animated.View
                key={evt.id || idx}
                entering={FadeInDown.delay(idx * 60).springify()}
                style={styles.eventCardWrap}
              >
                <Pressable
                  style={styles.eventCard}
                  onPress={() => router.push(evt.id ? `/plan-details?id=${evt.id}` : "/hangout")}
                >
                  <LinearGradient colors={["#7C3AED", "#6D28D9"]} style={styles.eventGradHeader}>
                    <View style={styles.eventBadge}>
                      <Text style={styles.eventBadgeText}>{evt.time || "LIVE"}</Text>
                    </View>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {evt.title || evt.name}
                    </Text>
                  </LinearGradient>

                  <View style={styles.eventCardBody}>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={12} color="#7C3AED" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {evt.location || evt.city || "Nagpur"}
                      </Text>
                    </View>

                    <View style={styles.hostRow}>
                      <Image source={{ uri: evt.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop" }} style={styles.hostAvatar} />
                      <Text style={styles.hostName}>{evt.hostName || "Host"}</Text>
                      <View style={styles.membersBadge}>
                        <Ionicons name="people" size={10} color="#64748B" />
                        <Text style={styles.membersText}>{evt.membersCount || 2} going</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.joinEventBtn}
                      onPress={() => router.push("/hangout")}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={["#7C3AED", "#8B5CF6"]} style={styles.joinEventGrad}>
                        <Ionicons name="navigate-sharp" size={12} color="#FFF" />
                        <Text style={styles.joinEventText}>View & Join Event</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        ) : null}

        {/* SECTION 2: Broadcast Live Spot Form */}
        <View style={styles.broadcastSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="flash-sharp" size={16} color="#7C3AED" />
              <Text style={styles.sectionTitle}>BROADCAST NEW LIVE SPOT</Text>
            </View>
          </View>

          {/* 3-Column Visual Icon Grid */}
          <Text style={styles.secSubLabel}>CHOOSE YOUR SPOT / VENUE</Text>
          <View style={styles.presetsGrid}>
            {VENUE_PRESETS.map((item) => {
              const isSelected = selectedPreset.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.presetTile, isSelected && styles.presetTileSelected]}
                  onPress={() => setSelectedPreset(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.tileIconCircle, { backgroundColor: `${item.color}15` }]}>
                    <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                  </View>
                  <Text style={[styles.tileName, isSelected && styles.tileNameSelected]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.activeCheck}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Spot Input */}
          <View style={styles.inputWrap}>
            <Ionicons name="location-sharp" size={16} color="#7C3AED" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.input}
              placeholder="Or custom spot (e.g. Cafe Mocha, FC Road)..."
              placeholderTextColor="#94A3B8"
              value={venueName}
              onChangeText={setVenueName}
            />
          </View>

          {/* Duration Selector */}
          <Text style={styles.secSubLabel}>SPOT DURATION</Text>
          <View style={styles.timeRow}>
            {TIME_PRESETS.map((t) => {
              const isSelected = duration === t.val;
              return (
                <TouchableOpacity
                  key={t.val}
                  style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                  onPress={() => setDuration(t.val)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.broadcastBtn}
            onPress={handleBroadcastSpot}
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#7C3AED", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.broadcastBtnGrad}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name={"radar" as any} size={18} color="#FFF" />
                  <Text style={styles.broadcastBtnText}>SCAN NEARBY USERS & BROADCAST ⚡</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareToWhatsApp}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={16} color="#7C3AED" />
            <Text style={styles.shareBtnText}>Share Table Link to WhatsApp / Story</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TabBar dark={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F9FD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  purpleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
  },
  statusText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: 0.8,
  },
  seeAllText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },

  // Events Scroll
  eventsScroll: {
    marginBottom: 20,
  },
  eventCardWrap: {
    width: 220,
    marginRight: 12,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 3,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  eventGradHeader: {
    padding: 12,
  },
  eventBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  eventBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
  },
  eventTitle: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
  },
  eventCardBody: {
    padding: 12,
    gap: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    flex: 1,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  hostName: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    flex: 1,
  },
  membersBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F8F9FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  membersText: {
    fontSize: 9.5,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  joinEventBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 2,
  },
  joinEventGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
  },
  joinEventText: {
    color: "#FFF",
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
  },

  // Broadcast Section
  broadcastSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 3,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  secSubLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  presetTile: {
    width: "31%",
    backgroundColor: "#F8F9FD",
    borderRadius: 18,
    padding: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    position: "relative",
    marginBottom: 2,
  },
  presetTileSelected: {
    backgroundColor: "#F3E8FF",
    borderColor: "#7C3AED",
  },
  tileIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  tileName: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    textAlign: "center",
  },
  tileNameSelected: {
    color: "#7C3AED",
  },
  activeCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 44,
    marginTop: 12,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#18181B",
  },
  timeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  timeChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F8F9FD",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  timeChipSelected: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  timeText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  timeTextSelected: {
    color: "#FFF",
  },
  broadcastBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
  },
  broadcastBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  broadcastBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.5,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  shareBtnText: {
    color: "#7C3AED",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
});
