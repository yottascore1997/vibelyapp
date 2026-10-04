import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  StatusBar,
  Dimensions,
  Share,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { usePlans } from "../context/PlansContext";
import { VibeFonts } from "../constants/vibeTheme";
import HomeHeader from "../components/HomeHeader";
import TabBar from "../components/TabBar";

const { width: SCREEN_W } = Dimensions.get("window");

const T = {
  bg: "#070A14",
  card: "#0B1220",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  lime: "#D4F72C",
  limeBorder: "#D4F72C",
  cyan: "#06B6D4",
  cyanDark: "#0891B2",
  text: "#FFFFFF",
  muted: "#94A3B8",
  soft: "#64748B",
  glassTag: "rgba(10, 16, 30, 0.76)",
};

interface HangoutItem {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  watermark: string;
  location: string;
  imageUrl: string;
  attendeesCount: number;
  attendeeAvatars: string[];
  tags: { emoji: string; label: string; highlight?: boolean }[];
  isReal?: boolean;
}

const DEFAULT_UPCOMING_HANGOUTS: HangoutItem[] = [
  {
    id: "hangout-1",
    title: "Rooftop Coffee Hangout",
    dateLabel: "Fri, 19 Sep",
    timeLabel: "7:30 PM",
    watermark: "See You There? ♡",
    location: "The Rooftop Café, Kolkata",
    imageUrl:
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1000&auto=format&fit=crop&q=80",
    attendeesCount: 4,
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    ],
    tags: [
      { emoji: "☕", label: "Coffee" },
      { emoji: "🔥", label: "Chill Vibes", highlight: true },
    ],
  },
  {
    id: "hangout-2",
    title: "Sunset Beer Meet",
    dateLabel: "Sun, 21 Sep",
    timeLabel: "6:00 PM",
    watermark: "Good Drinks Better Company ♡",
    location: "The Urban Tap, Kolkata",
    imageUrl:
      "https://images.unsplash.com/photo-1574096079513-d8259312b785?w=1000&auto=format&fit=crop&q=80",
    attendeesCount: 6,
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    ],
    tags: [
      { emoji: "🍺", label: "Beer" },
      { emoji: "🔥", label: "Good Vibes", highlight: true },
    ],
  },
  {
    id: "hangout-3",
    title: "Night Walk & Talks",
    dateLabel: "Thu, 24 Sep",
    timeLabel: "8:30 PM",
    watermark: "Late Walks Deep Talks ♡",
    location: "Victoria Memorial, Kolkata",
    imageUrl:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000&auto=format&fit=crop&q=80",
    attendeesCount: 3,
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    ],
    tags: [
      { emoji: "🚶", label: "Walk" },
      { emoji: "💬", label: "Deep Talks", highlight: true },
    ],
  },
];

const DEFAULT_PAST_HANGOUTS: HangoutItem[] = [
  {
    id: "hangout-past-1",
    title: "Weekend Chai & Acoustic Jam",
    dateLabel: "Sat, 06 Sep",
    timeLabel: "5:00 PM",
    watermark: "Memories Made ♡",
    location: "Cha Bar, Kolkata",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80",
    attendeesCount: 5,
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    ],
    tags: [
      { emoji: "☕", label: "Chai" },
      { emoji: "🎸", label: "Acoustic Vibes" },
    ],
  },
];

export default function HangoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { myPlans, createPlan } = usePlans();

  const [activeTab, setActiveTab] = useState<"Upcoming" | "Past" | "Drafts">("Upcoming");
  const [createdPlans, setCreatedPlans] = useState<HangoutItem[]>([]);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDateTime, setNewDateTime] = useState("Today, 7:00 PM");
  const [newCategory, setNewCategory] = useState("Coffee");
  const [creating, setCreating] = useState(false);

  // Map real user plans from context into HangoutItems
  const realPlansMapped = useMemo<HangoutItem[]>(() => {
    if (!myPlans || myPlans.length === 0) return [];
    return myPlans.map((p, idx) => {
      const isPast = p.status === "COMPLETED" || p.status === "CANCELLED";
      return {
        id: p.id || `real-${idx}`,
        title: p.title || "Custom Hangout",
        dateLabel: p.scheduledAt
          ? new Date(p.scheduledAt).toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })
          : "Upcoming",
        timeLabel: p.scheduledAt
          ? new Date(p.scheduledAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })
          : "Flexible",
        watermark: isPast ? "Hangout Done ♡" : "See You There? ♡",
        location: p.location || "Nearby Venue",
        imageUrl:
          p.imageUrl ||
          "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1000&auto=format&fit=crop&q=80",
        attendeesCount: p.going || p.participants?.length || 1,
        attendeeAvatars: [
          (user as any)?.avatarUrl ||
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        ],
        tags: [
          { emoji: "✨", label: p.activity || "Hangout" },
          { emoji: "🔥", label: "My Plan", highlight: true },
        ],
        isReal: true,
      };
    });
  }, [myPlans, user]);

  const upcomingList = useMemo(() => {
    return [...createdPlans, ...realPlansMapped, ...DEFAULT_UPCOMING_HANGOUTS];
  }, [createdPlans, realPlansMapped]);

  const pastList = useMemo(() => {
    return DEFAULT_PAST_HANGOUTS;
  }, []);

  const handleOpenCardMenu = (item: HangoutItem) => {
    Alert.alert(item.title, `${item.dateLabel} at ${item.timeLabel}\n📍 ${item.location}`, [
      {
        text: "📤 Share Hangout",
        onPress: () => {
          Share.share({
            message: `Let's hangout! Join my "${item.title}" at ${item.location} on ${item.dateLabel} ${item.timeLabel}. Connect on Hangora!`,
          }).catch(() => {});
        },
      },
      {
        text: "👥 Invite Matches",
        onPress: () => {
          Alert.alert("Invite Matches", "Matches can be directly invited from Chat & Radar!");
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleCreateHangout = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Title required", "Please enter a hangout title.");
      return;
    }
    setCreating(true);
    try {
      const newItem: HangoutItem = {
        id: `created-${Date.now()}`,
        title: newTitle.trim(),
        dateLabel: "Upcoming",
        timeLabel: newDateTime.trim() || "7:00 PM",
        watermark: "See You There? ♡",
        location: newLocation.trim() || "Kolkata",
        imageUrl:
          newCategory === "Beer"
            ? "https://images.unsplash.com/photo-1574096079513-d8259312b785?w=1000&auto=format&fit=crop&q=80"
            : newCategory === "Walk"
            ? "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000&auto=format&fit=crop&q=80"
            : "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1000&auto=format&fit=crop&q=80",
        attendeesCount: 1,
        attendeeAvatars: [
          (user as any)?.avatarUrl ||
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        ],
        tags: [
          {
            emoji:
              newCategory === "Beer"
                ? "🍺"
                : newCategory === "Walk"
                ? "🚶"
                : newCategory === "Food"
                ? "🍔"
                : "☕",
            label: newCategory,
          },
          { emoji: "🔥", label: "My Plan", highlight: true },
        ],
        isReal: true,
      };

      if (createPlan) {
        try {
          await createPlan({
            activityId: newCategory.toLowerCase(),
            activityName: newTitle.trim(),
            emoji:
              newCategory === "Beer"
                ? "🍺"
                : newCategory === "Walk"
                ? "🚶"
                : newCategory === "Food"
                ? "🍔"
                : "☕",
            location: newLocation.trim() || "Kolkata",
            description: newTitle.trim(),
          });
        } catch {
          // fallback to local state
        }
      }

      setCreatedPlans((prev) => [newItem, ...prev]);
      setShowCreateModal(false);
      setNewTitle("");
      setNewLocation("");
      Alert.alert("Hangout Created! 🚀", "Your hangout is live and visible in your plans.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not create hangout.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <LinearGradient
        colors={["rgba(14, 28, 54, 0.45)", "#070A14"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── 1. APP TOP HEADER ── */}
      <HomeHeader showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 20) + 105,
          },
        ]}
      >
        {/* ── 2. SCREEN TITLE ROW ── */}
        <Animated.View entering={FadeIn.duration(280)} style={styles.header}>
          <View style={styles.headerLeftCol}>
            <Text style={styles.headerTitle}>
              My <Text style={styles.headerTitleHighlight}>Hangouts</Text>
            </Text>
            <Text style={styles.headerSubtitle}>All your plans, all in one place.</Text>
          </View>

          {/* Plus Add Button with Glowing Cyan Gradient */}
          <Pressable
            style={styles.plusBtn}
            onPress={() => setShowCreateModal(true)}
            hitSlop={8}
          >
            <LinearGradient
              colors={[T.cyanDark, T.cyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.plusBtnGrad}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* ── 3. FILTER TABS: Upcoming | Past | Drafts ── */}
        <Animated.View entering={FadeInDown.delay(40).duration(260)} style={styles.tabsRow}>
          {/* Upcoming Tab */}
          <Pressable
            style={[styles.tabPill, activeTab === "Upcoming" && styles.tabPillActive]}
            onPress={() => setActiveTab("Upcoming")}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === "Upcoming" && styles.tabPillTextActive,
              ]}
            >
              Upcoming
            </Text>
          </Pressable>

          {/* Past Tab */}
          <Pressable
            style={[styles.tabPill, activeTab === "Past" && styles.tabPillActive]}
            onPress={() => setActiveTab("Past")}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === "Past" && styles.tabPillTextActive,
              ]}
            >
              Past
            </Text>
          </Pressable>

          {/* Drafts Tab */}
          <Pressable
            style={[styles.tabPill, activeTab === "Drafts" && styles.tabPillActive]}
            onPress={() => setActiveTab("Drafts")}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === "Drafts" && styles.tabPillTextActive,
              ]}
            >
              Drafts
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── 4. COMPACT CARDS FEED ── */}
        {activeTab === "Upcoming" && (
          <View style={styles.feedList}>
            {upcomingList.map((item, idx) => (
              <Animated.View
                key={item.id + idx}
                entering={FadeInDown.delay(70 + idx * 35).duration(280)}
                style={styles.card}
              >
                {/* Compact Cover Image with Overlays */}
                <View style={styles.cardCoverWrap}>
                  <Image source={{ uri: item.imageUrl }} style={styles.cardCoverImg} />

                  {/* Top-Left Date & Time Glass Pill */}
                  <View style={styles.dateTimePill}>
                    <Text style={styles.dateTimeDay}>{item.dateLabel}</Text>
                    <Text style={styles.dateTimeHour}>{item.timeLabel}</Text>
                  </View>

                  {/* Top-Right Aesthetic Watermark Quote */}
                  <View style={styles.watermarkWrap}>
                    <Text style={styles.watermarkText}>{item.watermark}</Text>
                  </View>

                  {/* Bottom-Left Overlapping Avatar Stack */}
                  <View style={styles.avatarStackWrap}>
                    {item.attendeeAvatars.slice(0, 3).map((av, avIdx) => (
                      <Image
                        key={av + avIdx}
                        source={{ uri: av }}
                        style={[
                          styles.avatarCircle,
                          avIdx > 0 && { marginLeft: -7 },
                        ]}
                      />
                    ))}
                    {item.attendeesCount > 0 && (
                      <View style={styles.avatarCountPill}>
                        <Text style={styles.avatarCountText}>
                          +{item.attendeesCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Compact Card Body Details */}
                <View style={styles.cardBody}>
                  {/* Title & Three Dots Menu */}
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Pressable
                      style={styles.moreBtn}
                      onPress={() => handleOpenCardMenu(item)}
                      hitSlop={10}
                    >
                      <Ionicons name="ellipsis-horizontal" size={17} color="#64748B" />
                    </Pressable>
                  </View>

                  {/* Location subtitle */}
                  <Text style={styles.cardLocation} numberOfLines={1}>
                    {item.location}
                  </Text>

                  {/* Tag Chips Row */}
                  <View style={styles.tagsRow}>
                    {item.tags.map((tag, tIdx) => (
                      <View
                        key={tag.label + tIdx}
                        style={[
                          styles.tagChip,
                          tag.highlight && styles.tagChipHighlight,
                        ]}
                      >
                        <Text style={styles.tagChipEmoji}>{tag.emoji}</Text>
                        <Text
                          style={[
                            styles.tagChipLabel,
                            tag.highlight && styles.tagChipLabelHighlight,
                          ]}
                        >
                          {tag.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {/* ── PAST TAB ── */}
        {activeTab === "Past" && (
          <View style={styles.feedList}>
            {pastList.map((item, idx) => (
              <Animated.View
                key={item.id + idx}
                entering={FadeInDown.delay(50).duration(260)}
                style={styles.card}
              >
                <View style={styles.cardCoverWrap}>
                  <Image source={{ uri: item.imageUrl }} style={styles.cardCoverImg} />
                  <View style={styles.dateTimePill}>
                    <Text style={styles.dateTimeDay}>{item.dateLabel}</Text>
                    <Text style={styles.dateTimeHour}>{item.timeLabel}</Text>
                  </View>
                  <View style={styles.watermarkWrap}>
                    <Text style={styles.watermarkText}>{item.watermark}</Text>
                  </View>
                  <View style={styles.avatarStackWrap}>
                    {item.attendeeAvatars.slice(0, 3).map((av, avIdx) => (
                      <Image
                        key={av + avIdx}
                        source={{ uri: av }}
                        style={[styles.avatarCircle, avIdx > 0 && { marginLeft: -7 }]}
                      />
                    ))}
                    <View style={styles.avatarCountPill}>
                      <Text style={styles.avatarCountText}>+{item.attendeesCount}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Pressable onPress={() => handleOpenCardMenu(item)}>
                      <Ionicons name="ellipsis-horizontal" size={17} color="#64748B" />
                    </Pressable>
                  </View>
                  <Text style={styles.cardLocation} numberOfLines={1}>
                    {item.location}
                  </Text>
                  <View style={styles.tagsRow}>
                    {item.tags.map((tag, tIdx) => (
                      <View key={tag.label + tIdx} style={styles.tagChip}>
                        <Text style={styles.tagChipEmoji}>{tag.emoji}</Text>
                        <Text style={styles.tagChipLabel}>{tag.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {/* ── DRAFTS TAB ── */}
        {activeTab === "Drafts" && (
          <View style={styles.emptyDraftsWrap}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={28} color={T.lime} />
            </View>
            <Text style={styles.emptyDraftTitle}>No drafts saved yet</Text>
            <Text style={styles.emptyDraftSub}>
              Start drafting a coffee meetup, drinks night, or evening walk.
            </Text>
            <Pressable
              style={styles.createDraftBtn}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createDraftBtnText}>+ Create a Plan</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ── 5. APP BOTTOM NAV TAB BAR ── */}
      <TabBar dark />

      {/* ── CREATE HANGOUT MODAL ── */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowCreateModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Create a Hangout</Text>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text style={styles.modalFieldLabel}>Hangout Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Rooftop Chai Meet"
              placeholderTextColor={T.soft}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.modalFieldLabel}>Location / Venue</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Park Street / Blue Tokai"
              placeholderTextColor={T.soft}
              value={newLocation}
              onChangeText={setNewLocation}
            />

            <Text style={styles.modalFieldLabel}>Date & Time</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Tomorrow, 6:30 PM"
              placeholderTextColor={T.soft}
              value={newDateTime}
              onChangeText={setNewDateTime}
            />

            <Text style={styles.modalFieldLabel}>Vibe Category</Text>
            <View style={styles.categoryChipsRow}>
              {["Coffee", "Beer", "Walk", "Food", "Chill"].map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.modalCatChip,
                    newCategory === cat && styles.modalCatChipActive,
                  ]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text
                    style={[
                      styles.modalCatChipText,
                      newCategory === cat && styles.modalCatChipTextActive,
                    ]}
                  >
                    {cat === "Coffee"
                      ? "☕ Coffee"
                      : cat === "Beer"
                      ? "🍺 Beer"
                      : cat === "Walk"
                      ? "🚶 Walk"
                      : cat === "Food"
                      ? "🍔 Food"
                      : "🔥 Chill"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.submitPlanBtn}
              onPress={handleCreateHangout}
              disabled={creating}
            >
              <LinearGradient
                colors={["#D4F72C", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitPlanGrad}
              >
                {creating ? (
                  <ActivityIndicator color="#070A14" />
                ) : (
                  <Text style={styles.submitPlanText}>Post Hangout</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 4,
  },
  headerLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  headerTitleHighlight: {
    color: T.lime,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    marginTop: 2,
  },
  plusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    shadowColor: T.cyan,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },
  plusBtnGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Filter Tabs ── */
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  tabPillActive: {
    borderWidth: 1.5,
    borderColor: T.limeBorder,
    backgroundColor: "rgba(212, 247, 44, 0.05)",
  },
  tabPillText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.soft,
  },
  tabPillTextActive: {
    color: T.lime,
    fontFamily: VibeFonts.bold,
  },

  /* ── Feed List ── */
  feedList: {
    gap: 12,
  },
  card: {
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.cardBorder,
    overflow: "hidden",
  },
  cardCoverWrap: {
    width: "100%",
    height: 135,
    backgroundColor: "#131C33",
    position: "relative",
  },
  cardCoverImg: {
    width: "100%",
    height: "100%",
  },

  /* Date & Time Frosted Pill */
  dateTimePill: {
    position: "absolute",
    top: 9,
    left: 9,
    backgroundColor: T.glassTag,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateTimeDay: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "#E2E8F0",
    lineHeight: 12,
  },
  dateTimeHour: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  /* Aesthetic Watermark Quote */
  watermarkWrap: {
    position: "absolute",
    top: 9,
    right: 11,
  },
  watermarkText: {
    fontSize: 11,
    fontStyle: "italic",
    fontFamily: VibeFonts.medium,
    color: "rgba(255, 255, 255, 0.88)",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    textAlign: "right",
  },

  /* Overlapping Avatars */
  avatarStackWrap: {
    position: "absolute",
    bottom: 9,
    left: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: "#0B1220",
    backgroundColor: "#1E293B",
  },
  avatarCountPill: {
    backgroundColor: "rgba(7, 10, 20, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 3,
  },
  avatarCountText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },

  /* Card Body */
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 11,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  moreBtn: {
    paddingLeft: 8,
  },
  cardLocation: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  tagChipHighlight: {
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    borderColor: "rgba(34, 211, 238, 0.25)",
  },
  tagChipEmoji: {
    fontSize: 11,
  },
  tagChipLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#CBD5E1",
  },
  tagChipLabelHighlight: {
    color: "#22D3EE",
  },

  /* Empty State */
  emptyDraftsWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(212, 247, 44, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyDraftTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    marginBottom: 5,
  },
  emptyDraftSub: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  createDraftBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: T.lime,
    backgroundColor: "rgba(212, 247, 44, 0.08)",
  },
  createDraftBtnText: {
    color: T.lime,
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },

  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: "#0D1424",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalFieldLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
    marginBottom: 6,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: "#121C33",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.medium,
  },
  categoryChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  modalCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#121C33",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  modalCatChipActive: {
    borderColor: T.lime,
    backgroundColor: "rgba(212, 247, 44, 0.12)",
  },
  modalCatChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  modalCatChipTextActive: {
    color: T.lime,
    fontFamily: VibeFonts.bold,
  },
  submitPlanBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
  },
  submitPlanGrad: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitPlanText: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },
});
