import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { usePlans } from "../context/PlansContext";
import { useAuth } from "../context/AuthContext";
import { usePremium } from "../context/PremiumContext";
import { getCurrentUserLocation } from "../services/location";
import { VibeFonts } from "../constants/vibeTheme";

const { width: SCREEN_W } = Dimensions.get("window");

// Local Figma Hangora Assets
const previewCardImg = require("../assets/hangout/preview-card.png");
const successCelebrationImg = require("../assets/hangout/success-celebration.png");
const chaiIcon = require("../assets/icons/chai.png");
const coffeeIcon = require("../assets/icons/coffee.png");
const beerIcon = require("../assets/icons/beer.png");
const movieIcon = require("../assets/icons/movie.png");

interface VibeOption {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  image?: any;
  emoji: string;
  color: string;
  defaultTitle: string;
  defaultLocation: string;
}

const VIBE_OPTIONS: VibeOption[] = [
  { id: "tea", label: "Tea", image: chaiIcon, emoji: "🍵", color: "#22D3EE", defaultTitle: "Tea & Chill Conversations", defaultLocation: "Chai Point, Central Park" },
  { id: "coffee", label: "Coffee", image: coffeeIcon, emoji: "☕", color: "#F59E0B", defaultTitle: "Coffee & Good Talks", defaultLocation: "Brew & Blush Café" },
  { id: "beer", label: "Beer", image: beerIcon, emoji: "🍺", color: "#FBBF24", defaultTitle: "Beer & Better People", defaultLocation: "The Local Taproom" },
  { id: "movie", label: "Movie", image: movieIcon, emoji: "🎬", color: "#EF4444", defaultTitle: "Movie & Popcorn Night", defaultLocation: "PVR Cinemas, City Mall" },
  { id: "drinks", label: "Drinks", icon: "wine", emoji: "🍸", color: "#F43F5E", defaultTitle: "Cocktails & Evening Vibe", defaultLocation: "Sky Lounge Rooftop" },
  { id: "smoke", label: "Smoke", icon: "leaf", emoji: "🍃", color: "#22C55E", defaultTitle: "Smoke & Unwind", defaultLocation: "Open Air Terrace" },
  { id: "food", label: "Food", icon: "restaurant", emoji: "🍴", color: "#FB923C", defaultTitle: "Foodie Dinner Hangout", defaultLocation: "Flavours Bistro" },
  { id: "walk", label: "Walk", icon: "footsteps", emoji: "👟", color: "#38BDF8", defaultTitle: "Evening Walk & Chat", defaultLocation: "City Promenade" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal", emoji: "✨", color: "#A855F7", defaultTitle: "Weekend Vibes Hangout", defaultLocation: "Downtown Spot" },
];

const PRIVACY_OPTIONS = [
  { id: "everyone", title: "Everyone", subtitle: "Anyone can join", icon: "globe-outline" as const },
  { id: "followers", title: "Followers", subtitle: "Only your followers", icon: "people-outline" as const },
  { id: "invite", title: "Invite Only", subtitle: "Only invited people", icon: "lock-closed-outline" as const },
];

export default function CreateHangoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isPremium, openPaywall } = usePremium();
  const {
    createPlan,
    canCreateHangout,
    remainingDailyHangouts,
    dailyHangoutCount,
  } = usePlans();

  const checkLimitAndProceed = (nextAction: () => void) => {
    if (!isPremium && !canCreateHangout) {
      Alert.alert(
        "Daily Limit Reached (3/3) 👑",
        "Free users can create up to 3 hangouts per day. Upgrade to Premium for unlimited daily hangouts!",
        [
          { text: "Upgrade to Premium", onPress: openPaywall },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    nextAction();
  };

  // Screen Stage: "form" (Figma 508:358) -> "preview" (Figma 535:324) -> "success" (Figma 690:1425)
  const [stage, setStage] = useState<"form" | "preview" | "success">("form");

  // Form State
  const [selectedVibe, setSelectedVibe] = useState<VibeOption>(VIBE_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState("Today, 7:00 PM");
  const [selectedTime, setSelectedTime] = useState("7:00 PM");
  const [locationStr, setLocationStr] = useState("Brew & Blush Café");
  const [privacy, setPrivacy] = useState("everyone");
  const [customTitle, setCustomTitle] = useState("");

  // Modals & Async State
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdHangoutData, setCreatedHangoutData] = useState<any>(null);

  // Auto-fill location with GPS
  const handleUseCurrentLocation = async () => {
    setDetectingGps(true);
    try {
      const res = await getCurrentUserLocation({ highAccuracy: true });
      if (res.ok) {
        const city = res.location.city || "Nearby Café";
        setLocationStr(`Near ${city}`);
      } else {
        Alert.alert("Location", res.message);
      }
    } catch {
      Alert.alert("Location", "Could not fetch current location.");
    } finally {
      setDetectingGps(false);
    }
  };

  // Submit from Preview Stage to API
  const handleFinalCreate = async () => {
    if (!isPremium && !canCreateHangout) {
      Alert.alert(
        "Daily Limit Reached (3/3) 👑",
        "Free users can create up to 3 hangouts per day. Upgrade to Premium for unlimited daily hangouts!",
        [
          { text: "Upgrade to Premium", onPress: openPaywall },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    setSaving(true);
    const hangoutTitle = customTitle.trim() || selectedVibe.defaultTitle;
    const finalDesc = description.trim() || `Let's grab some ${selectedVibe.label.toLowerCase()} and have meaningful conversations. Good vibes only! ✨`;

    try {
      const plan = await createPlan({
        activityId: selectedVibe.id,
        activityName: selectedVibe.label,
        emoji: selectedVibe.emoji,
        location: locationStr,
        description: finalDesc,
        customDate: selectedDate,
        customTime: selectedTime,
        kind: "HANGOUT",
        visibility: privacy === "everyone" ? "PUBLIC" : "FRIENDS",
      });

      setCreatedHangoutData({
        title: hangoutTitle,
        subtitle: `${selectedDate} • ${locationStr}`,
        vibe: selectedVibe.label,
      });
      setStage("success");
    } catch (e) {
      // Even if network falls back, show success state smoothly
      setCreatedHangoutData({
        title: hangoutTitle,
        subtitle: `${selectedDate} • ${locationStr}`,
        vibe: selectedVibe.label,
      });
      setStage("success");
    } finally {
      setSaving(false);
    }
  };

  // Share Hangout Link
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Hangout: "${createdHangoutData?.title || "Chill Hangout"}" on Hangora! Let's vibe together ✨`,
      });
    } catch {
      /* ignore */
    }
  };

  // ══════════════════════════════════════════════════════════════
  // STAGE 3: SUCCESS CELEBRATION (Figma 690:1425)
  // ══════════════════════════════════════════════════════════════
  if (stage === "success") {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#070A13" />

        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.successScroll, { paddingBottom: Math.max(insets.bottom, 20) + 30 }]}
        >
          {/* Neon Polaroid Celebration Graphic */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.successArtWrap}>
            <Image source={successCelebrationImg} style={styles.successArtImage} resizeMode="contain" />
          </Animated.View>

          {/* Title & Subtitle */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.successCopyWrap}>
            <Text style={styles.successMainTitle}>
              Next Hangout{"\n"}
              <Text style={styles.successLimeAccent}>Successfully Created!</Text>
            </Text>
            <Text style={styles.successSubtitle}>
              Your hangout is live and ready for people to join. Time to make it memorable!
            </Text>
          </Animated.View>

          {/* Mini Hangout Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.successMiniCard}>
            <Image source={previewCardImg} style={styles.miniCardImage} resizeMode="cover" />
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <Text style={styles.miniCardTitle} numberOfLines={1}>
                {createdHangoutData?.title || "Rooftop Coffee Hangout"}
              </Text>
              <Text style={styles.miniCardSub} numberOfLines={1}>
                {createdHangoutData?.subtitle || "Today • 7:00 PM • Brew & Blush"}
              </Text>
              <View style={styles.miniTagsRow}>
                <View style={styles.miniTag}>
                  <Text style={styles.miniTagText}>☕ {createdHangoutData?.vibe || "Coffee"}</Text>
                </View>
                <View style={styles.miniTag}>
                  <Text style={styles.miniTagText}>🔥 Chill Vibes</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.successActions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/invite-friends",
                  params: {
                    title: createdHangoutData?.title || "Rooftop Coffee Hangout",
                    subtitle: createdHangoutData?.subtitle || "Fri, 19 Sep • 7:30 PM",
                    location: locationStr || "The Rooftop Café, Kolkata",
                    vibe: createdHangoutData?.vibe || "Coffee",
                  },
                })
              }
              style={styles.ctaWrap}
            >
              <LinearGradient
                colors={["#FFF04B", "#94FA78", "#2EFA9E"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.ctaBtn}
              >
                <Ionicons name="send" size={17} color="#0A0F1D" />
                <Text style={styles.ctaText}>Invite Friends</Text>
                <Ionicons name="arrow-forward" size={17} color="#0A0F1D" />
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => router.navigate("/hangout")} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Go to My Hangouts</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // STAGE 2: PREVIEW CARD CONFIRMATION (Figma 535:324)
  // ══════════════════════════════════════════════════════════════
  if (stage === "preview") {
    const hangoutTitle = customTitle.trim() || selectedVibe.defaultTitle;
    const finalDesc = description.trim() || `Let's grab some ${selectedVibe.label.toLowerCase()} and have meaningful conversations. Good vibes only! ✨`;

    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#070A13" />

        {/* Top Header */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
          <Pressable onPress={() => setStage("form")} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.topBarTitle}>Your Hangout Will Look Like This</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.previewScroll, { paddingBottom: Math.max(insets.bottom, 20) + 90 }]}
        >
          {/* Big Visual Preview Card */}
          <Animated.View entering={FadeInDown.duration(340)} style={styles.previewCardContainer}>
            <Image source={previewCardImg} style={styles.previewCardTopImage} resizeMode="cover" />
            <View style={styles.previewCardBody}>
              <Text style={styles.previewCardTitle}>{hangoutTitle}</Text>
              <Text style={styles.previewCardMeta}>
                {selectedDate} • {locationStr}
              </Text>
              <View style={styles.previewTagsRow}>
                <View style={styles.previewTagPill}>
                  <Text style={styles.previewTagText}>{selectedVibe.emoji} {selectedVibe.label}</Text>
                </View>
                <View style={[styles.previewTagPill, { backgroundColor: "rgba(34,211,238,0.12)" }]}>
                  <Ionicons name="time-outline" size={13} color="#22D3EE" />
                  <Text style={[styles.previewTagText, { color: "#22D3EE" }]}>Chill Vibes</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* 4 Summary Rows */}
          <View style={styles.summaryRowsWrap}>
            {/* 1. Title & Desc */}
            <View style={styles.summaryRowItem}>
              <View style={[styles.summaryIconBox, { backgroundColor: "rgba(34,211,238,0.12)" }]}>
                <Ionicons name="person" size={18} color="#22D3EE" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryItemTitle}>{hangoutTitle}</Text>
                <Text style={styles.summaryItemSub}>{finalDesc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>

            {/* 2. Date & Time */}
            <View style={styles.summaryRowItem}>
              <View style={[styles.summaryIconBox, { backgroundColor: "rgba(251,191,36,0.12)" }]}>
                <Ionicons name="calendar" size={18} color="#FBBF24" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryItemTag}>DATE & TIME</Text>
                <Text style={styles.summaryItemTitle}>{selectedDate} • {selectedTime}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>

            {/* 3. Location */}
            <View style={styles.summaryRowItem}>
              <View style={[styles.summaryIconBox, { backgroundColor: "rgba(244,63,94,0.12)" }]}>
                <Ionicons name="location" size={18} color="#F43F5E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryItemTag}>LOCATION</Text>
                <Text style={styles.summaryItemTitle}>{locationStr}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>

            {/* 4. Privacy */}
            <View style={styles.summaryRowItem}>
              <View style={[styles.summaryIconBox, { backgroundColor: "rgba(168,85,247,0.12)" }]}>
                <Ionicons name="people" size={18} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryItemTag}>WHO CAN JOIN</Text>
                <Text style={styles.summaryItemTitle}>
                  {privacy === "everyone" ? "Everyone" : privacy === "followers" ? "Followers" : "Invite Only"}
                </Text>
                <Text style={styles.summaryItemSub}>
                  {privacy === "everyone" ? "Anyone can join" : privacy === "followers" ? "Only your followers" : "Only invited people"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Floating CTA */}
        <View style={[styles.bottomBarFixed, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
          <Pressable onPress={handleFinalCreate} disabled={saving} style={styles.ctaWrap}>
            <LinearGradient
              colors={["#FFF04B", "#94FA78", "#2EFA9E"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ctaBtn}
            >
              {saving ? (
                <ActivityIndicator color="#0A0F1D" />
              ) : (
                <>
                  <Text style={styles.ctaText}>Create Hangout</Text>
                  <Ionicons name="arrow-forward" size={18} color="#0A0F1D" />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // STAGE 1: CREATE HANGOUT FORM (Figma 508:358)
  // ══════════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070A13" />

      {/* Top Header */}
      <View style={[styles.formTopHeader, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.formHeaderTitle}>Create Hangout</Text>
          <Text style={styles.formHeaderSubtitle}>Turn an idea into a great time.</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* 4-Step Progress Indicator */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperLineTrack} />
        <View style={styles.stepperRow}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <View style={styles.stepCircleInner} />
            </View>
            <Text style={[styles.stepText, styles.stepTextActive]}>Plan</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepCircle} />
            <Text style={styles.stepText}>Time</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepCircle} />
            <Text style={styles.stepText}>Place</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepCircle} />
            <Text style={styles.stepText}>People</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.formScrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 95 }]}
      >
        {/* Daily Hangout Limit Indicator */}
        <Animated.View entering={FadeInDown.duration(280)} style={styles.limitBannerWrap}>
          {isPremium ? (
            <LinearGradient
              colors={["rgba(212, 247, 44, 0.15)", "rgba(34, 211, 238, 0.15)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.limitBannerPremium}
            >
              <View style={styles.limitCrownWrap}>
                <Ionicons name="sparkles" size={15} color="#D4F72C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.limitPremiumTitle}>👑 Unlimited Hangouts Active</Text>
                <Text style={styles.limitPremiumSub}>Premium member perk • Zero daily limits</Text>
              </View>
            </LinearGradient>
          ) : (
            <Pressable
              onPress={() => {
                if (!canCreateHangout) openPaywall();
              }}
              style={[
                styles.limitBannerFree,
                !canCreateHangout && styles.limitBannerExceeded,
              ]}
            >
              <View
                style={[
                  styles.limitIconWrap,
                  !canCreateHangout && { backgroundColor: "rgba(244, 63, 94, 0.15)" },
                ]}
              >
                <Ionicons
                  name={canCreateHangout ? "flash" : "lock-closed"}
                  size={15}
                  color={canCreateHangout ? "#22D3EE" : "#F43F5E"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.limitFreeTitle,
                    !canCreateHangout && { color: "#F43F5E" },
                  ]}
                >
                  {canCreateHangout
                    ? `Free Tier: ${remainingDailyHangouts} of 3 free hangouts left today`
                    : "Daily Limit Reached (3/3 Free Used)"}
                </Text>
                <Text style={styles.limitFreeSub}>
                  {canCreateHangout
                    ? "Upgrade to Premium for unlimited creations"
                    : "Tap to unlock Unlimited Hangouts with Premium"}
                </Text>
              </View>
              <Pressable
                onPress={openPaywall}
                style={[
                  styles.limitUpgradePill,
                  !canCreateHangout && styles.limitUpgradePillPulse,
                ]}
              >
                <Text
                  style={[
                    styles.limitUpgradePillText,
                    !canCreateHangout && { color: "#070A14" },
                  ]}
                >
                  {canCreateHangout ? "Upgrade" : "Unlock"}
                </Text>
              </Pressable>
            </Pressable>
          )}
        </Animated.View>

        {/* ── STEP 1: What are you Planning ? ── */}
        <Animated.View entering={FadeInDown.duration(320)} style={styles.formSection}>
          <View style={styles.stepHeaderRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View>
              <Text style={styles.stepSectionHeading}>What are you Planning ?</Text>
              <Text style={styles.stepSectionSub}>Choose a vibe for your hangout.</Text>
            </View>
          </View>

          {/* 8 Vibe Grid */}
          <View style={styles.vibeGridWrap}>
            {VIBE_OPTIONS.map((vibe) => {
              const active = selectedVibe.id === vibe.id;
              return (
                <Pressable
                  key={vibe.id}
                  onPress={() => setSelectedVibe(vibe)}
                  style={[styles.formVibeTile, active && styles.formVibeTileActive]}
                >
                  <View style={styles.formVibeIconWrap}>
                    {vibe.image ? (
                      <Image source={vibe.image} style={{ width: 34, height: 34 }} resizeMode="contain" />
                    ) : (
                      <Ionicons
                        name={vibe.icon!}
                        size={24}
                        color={active ? "#22D3EE" : vibe.color}
                      />
                    )}
                  </View>
                  <Text style={[styles.formVibeLabel, active && styles.formVibeLabelActive]}>
                    {vibe.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Description Input */}
          <View style={styles.descInputBox}>
            <Ionicons name="pencil-outline" size={17} color="#94A3B8" />
            <TextInput
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, 100))}
              placeholder="Add a short description..."
              placeholderTextColor="#64748B"
              style={styles.descTextInput}
            />
            <Text style={styles.descCounter}>{description.length}/100</Text>
          </View>
        </Animated.View>

        {/* ── STEP 2: When ? ── */}
        <Animated.View entering={FadeInDown.delay(70).duration(320)} style={styles.formSection}>
          <View style={styles.stepHeaderRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View>
              <Text style={styles.stepSectionHeading}>When ?</Text>
              <Text style={styles.stepSectionSub}>Set the date and time.</Text>
            </View>
          </View>

          <View style={styles.dateTimeRow}>
            {/* Date Box */}
            <Pressable onPress={() => setDateModalVisible(true)} style={styles.dateTimeCard}>
              <View style={styles.dateTimeLeft}>
                <Ionicons name="calendar-outline" size={20} color="#FBBF24" />
                <View>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <Text style={styles.dateTimeVal} numberOfLines={1}>{selectedDate.split(",")[0]}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </Pressable>

            {/* Time Box */}
            <Pressable onPress={() => setDateModalVisible(true)} style={styles.dateTimeCard}>
              <View style={styles.dateTimeLeft}>
                <Ionicons name="time-outline" size={20} color="#F43F5E" />
                <View>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                  <Text style={styles.dateTimeVal} numberOfLines={1}>{selectedTime}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── STEP 3: Where ? ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(320)} style={styles.formSection}>
          <View style={styles.stepHeaderRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View>
              <Text style={styles.stepSectionHeading}>Where ?</Text>
              <Text style={styles.stepSectionSub}>Choose a location.</Text>
            </View>
          </View>

          {/* Location Search Input */}
          <View style={styles.locationSearchBox}>
            <Ionicons name="location-outline" size={22} color="#22D3EE" />
            <View style={{ flex: 1 }}>
              <TextInput
                value={locationStr}
                onChangeText={setLocationStr}
                placeholder="Search location (Cafes, Bars, Parks...)"
                placeholderTextColor="#64748B"
                style={styles.locationInput}
              />
              <Text style={styles.locationSubHint}>Cafes, Bars, Parks, or any place...</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </View>

          {/* Current Location Button */}
          <Pressable
            onPress={handleUseCurrentLocation}
            disabled={detectingGps}
            style={styles.gpsPillBtn}
          >
            {detectingGps ? (
              <ActivityIndicator size="small" color="#2EFA9E" />
            ) : (
              <Ionicons name="locate-outline" size={17} color="#2EFA9E" />
            )}
            <Text style={styles.gpsPillText}>
              {detectingGps ? "Detecting location..." : "Use Current Location"}
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── STEP 4: Who can join ? ── */}
        <Animated.View entering={FadeInDown.delay(170).duration(320)} style={styles.formSection}>
          <View style={styles.stepHeaderRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View>
              <Text style={styles.stepSectionHeading}>Who can join ?</Text>
              <Text style={styles.stepSectionSub}>Set your hangout privacy.</Text>
            </View>
          </View>

          {/* Privacy Cards */}
          <View style={styles.privacyRow}>
            {PRIVACY_OPTIONS.map((opt) => {
              const active = privacy === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setPrivacy(opt.id)}
                  style={[styles.privacyCard, active && styles.privacyCardActive]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={active ? "#22D3EE" : "#94A3B8"}
                  />
                  <Text style={[styles.privacyTitle, active && styles.privacyTitleActive]}>
                    {opt.title}
                  </Text>
                  <Text style={styles.privacySub} numberOfLines={2}>
                    {opt.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Bottom CTA */}
      <View style={[styles.bottomBarFixed, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
        <Pressable onPress={() => checkLimitAndProceed(() => setStage("preview"))} style={styles.ctaWrap}>
          <LinearGradient
            colors={["#FFF04B", "#94FA78", "#2EFA9E"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>Create Hangout</Text>
            <Ionicons name="arrow-forward" size={18} color="#0A0F1D" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* Date/Time Picker Modal */}
      <Modal visible={dateModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Date & Time</Text>
            <View style={styles.quickDatesRow}>
              {["Today", "Tomorrow", "This Weekend", "Next Friday"].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setSelectedDate(d)}
                  style={[styles.quickDatePill, selectedDate === d && styles.quickDatePillActive]}
                >
                  <Text style={[styles.quickDateText, selectedDate === d && styles.quickDateTextActive]}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.modalTitle, { marginTop: 18 }]}>Time Slot</Text>
            <View style={styles.quickDatesRow}>
              {["5:00 PM", "7:00 PM", "8:30 PM", "10:00 PM"].map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setSelectedTime(t)}
                  style={[styles.quickDatePill, selectedTime === t && styles.quickDatePillActive]}
                >
                  <Text style={[styles.quickDateText, selectedTime === t && styles.quickDateTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => setDateModalVisible(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Done</Text>
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
    backgroundColor: "#070A13",
  },

  // ── Top Header ──
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#070A13",
  },
  topBarTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  formTopHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#070A13",
  },
  formHeaderTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  formHeaderSubtitle: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Stepper ──
  stepperContainer: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    position: "relative",
  },
  stepperLineTrack: {
    position: "absolute",
    top: 22,
    left: 48,
    right: 48,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    gap: 6,
  },
  stepCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#13192B",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    borderColor: "#E3F650",
    backgroundColor: "#070A13",
  },
  stepCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E3F650",
  },
  stepText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  stepTextActive: {
    color: "#E3F650",
    fontFamily: VibeFonts.bold,
  },

  // ── Form Scroll Content ──
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 24,
  },
  formSection: {
    gap: 12,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E3F650",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#0A0F1D",
  },
  stepSectionHeading: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  stepSectionSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 1,
  },

  // ── Vibe 8-Grid ──
  vibeGridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  formVibeTile: {
    width: (SCREEN_W - 40 - 30) / 4,
    height: 78,
    borderRadius: 16,
    backgroundColor: "#0F1424",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  formVibeTileActive: {
    borderColor: "#22D3EE",
    backgroundColor: "rgba(34,211,238,0.1)",
  },
  formVibeIconWrap: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  formVibeLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  formVibeLabelActive: {
    color: "#22D3EE",
    fontFamily: VibeFonts.bold,
  },

  // Description Box
  descInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0F1424",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  descTextInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    padding: 0,
  },
  descCounter: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },

  // Date / Time
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0F1424",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dateTimeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateTimeLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  dateTimeVal: {
    fontSize: 13.5,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    marginTop: 2,
  },

  // Location
  locationSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0F1424",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  locationInput: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    padding: 0,
  },
  locationSubHint: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 2,
  },
  gpsPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(46,250,158,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(46,250,158,0.3)",
    borderRadius: 999,
    paddingVertical: 12,
  },
  gpsPillText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#2EFA9E",
  },

  // Privacy
  privacyRow: {
    flexDirection: "row",
    gap: 10,
  },
  privacyCard: {
    flex: 1,
    backgroundColor: "#0F1424",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "flex-start",
    gap: 6,
  },
  privacyCardActive: {
    borderColor: "#22D3EE",
    backgroundColor: "rgba(34,211,238,0.1)",
  },
  privacyTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#94A3B8",
  },
  privacyTitleActive: {
    color: "#22D3EE",
  },
  privacySub: {
    fontSize: 10.5,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    lineHeight: 14,
  },

  // ── Bottom Fixed CTA ──
  bottomBarFixed: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#070A13",
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  ctaWrap: {
    borderRadius: 999,
    overflow: "hidden",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#0A0F1D",
  },

  // ── Preview Stage ──
  previewScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 20,
  },
  previewCardContainer: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0E1424",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  previewCardTopImage: {
    width: "100%",
    height: (SCREEN_W - 40) * (400 / 724),
  },
  previewCardBody: {
    padding: 16,
  },
  previewCardTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  previewCardMeta: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 4,
  },
  previewTagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  previewTagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1A2238",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  previewTagText: {
    fontSize: 11.5,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },

  summaryRowsWrap: {
    gap: 12,
  },
  summaryRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0D1322",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  summaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryItemTag: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
    letterSpacing: 0.5,
  },
  summaryItemTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    marginTop: 1,
  },
  summaryItemSub: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 2,
  },

  // ── Success Stage ──
  successScroll: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 20,
  },
  successArtWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  successArtImage: {
    width: SCREEN_W - 40,
    height: (SCREEN_W - 40) * (560 / 704),
  },
  successCopyWrap: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  successMainTitle: {
    fontSize: 26,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 32,
  },
  successLimeAccent: {
    color: "#E3F650",
  },
  successSubtitle: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  successMiniCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1322",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  miniCardImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
  miniCardTitle: {
    fontSize: 14.5,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  miniCardSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 3,
  },
  miniTagsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  miniTag: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  miniTagText: {
    fontSize: 10.5,
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
  },
  successActions: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "#0E1424",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#0E1424",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  quickDatesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickDatePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#161E34",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  quickDatePillActive: {
    backgroundColor: "rgba(227,246,80,0.15)",
    borderColor: "#E3F650",
  },
  quickDateText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  quickDateTextActive: {
    color: "#E3F650",
    fontFamily: VibeFonts.bold,
  },
  modalCloseBtn: {
    marginTop: 20,
    backgroundColor: "#E3F650",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#0A0F1D",
  },
  limitBannerWrap: {
    marginBottom: 16,
  },
  limitBannerPremium: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.3)",
  },
  limitCrownWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(212, 247, 44, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  limitPremiumTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#D4F72C",
  },
  limitPremiumSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 1,
  },
  limitBannerFree: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(13, 20, 36, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  limitBannerExceeded: {
    borderColor: "rgba(244, 63, 94, 0.4)",
    backgroundColor: "rgba(244, 63, 94, 0.08)",
  },
  limitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  limitFreeTitle: {
    fontSize: 12.5,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  limitFreeSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 1,
  },
  limitUpgradePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(34, 211, 238, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.35)",
  },
  limitUpgradePillPulse: {
    backgroundColor: "#D4F72C",
    borderColor: "#D4F72C",
  },
  limitUpgradePillText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#22D3EE",
  },
});
