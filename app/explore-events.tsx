import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  Pressable,
  ImageBackground,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import TabBar from "../components/TabBar";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { Plan } from "../constants/plans";

const { width } = Dimensions.get("window");

/** Premium dark + light Events palette */
const T = {
  bg: "#EEE9F8",
  card: "#FFFBFE",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E4DFF0",
  purple: "#8B5CF6",
  purpleDeep: "#7C3AED",
  pink: "#EC4899",
  softPurple: "#EDE7FF",
  dark: "#0F0B1A",
  darkSoft: "#1A1230",
  darkCard: "#16122A",
  cta: ["#8B5CF6", "#EC4899"] as const,
  hero: ["#0F0B1A", "#1A1230", "#2A1854"] as const,
};

interface EventItem {
  id: string;
  title: string;
  category: string;
  location: string;
  timeLabel: string;
  goingCount: number;
  commentCount: number;
  creatorName: string;
  creatorAvatar: string;
  creatorTimeAgo: string;
  isVerified: boolean;
  tags: string[];
  description: string;
  imageUrl: string;
  isFree?: boolean;
}

const INITIAL_EVENTS: EventItem[] = [];

function mapPlanToEvent(p: Plan): EventItem {
  return {
    id: p.id,
    title: p.title,
    category: p.activity || "Hangout",
    location: p.location || "Nearby",
    timeLabel: p.timeLabel || p.time || "Soon",
    goingCount: p.going || 1,
    commentCount: 0,
    creatorName: p.creatorName || "Host",
    creatorAvatar:
      p.creatorAvatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
    creatorTimeAgo: p.badge || "Live",
    isVerified: true,
    tags: [p.activity || "Event", p.badge || "Open"].filter(Boolean) as string[],
    description: p.description || "Join this event near you.",
    imageUrl:
      p.imageUrl ||
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300",
    isFree: true,
  };
}

const MAIN_FILTERS = [
  { id: "All", label: "All", icon: "compass-outline" },
  { id: "Free Hang", label: "Free Hang", icon: "pricetag-outline" },
  { id: "Today", label: "Today", icon: "calendar-outline" },
  { id: "This Week", label: "This Week", icon: "calendar-outline" },
  { id: "Nearby", label: "Nearby", icon: "navigate-outline" },
];

function isEventExpired(timeLabel: string): boolean {
  try {
    const now = new Date();
    let eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeLabel.toLowerCase().includes("today")) {
      // Already today
    } else if (timeLabel.toLowerCase().includes("tomorrow")) {
      eventDate.setDate(eventDate.getDate() + 1);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(timeLabel)) {
      const match = timeLabel.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        eventDate = new Date(year, month, day);
      }
    } else {
      const match = timeLabel.match(/^(\d{1,2})\s+([A-Za-z]+)/);
      if (match) {
        const day = parseInt(match[1], 10);
        const monthStr = match[2].toLowerCase();
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const monthIndex = months.findIndex(m => monthStr.startsWith(m));
        if (monthIndex !== -1) {
          eventDate = new Date(now.getFullYear(), monthIndex, day);
        }
      }
    }

    eventDate.setHours(0, 0, 0, 0);

    const cutoffTime = eventDate.getTime() + 26 * 60 * 60 * 1000;
    return Date.now() > cutoffTime;
  } catch (error) {
    return false;
  }
}

export default function ExploreEventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubTab, setSelectedSubTab] = useState<"Popular" | "Recent" | "Following">("Popular");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const refreshEvents = useCallback(async () => {
    try {
      const [mine, nearby] = await Promise.all([
        api.getMyPlans(undefined, "EVENT").catch(() => [] as Plan[]),
        api.getNearbyPlans(undefined, "EVENT").catch(() => [] as Plan[]),
      ]);
      const merged = [...(mine || []), ...(nearby || [])].filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
      );
      setEvents(merged.map(mapPlanToEvent));
    } catch {
      setEvents([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshEvents();
    }, [refreshEvents])
  );


  // Form States for creating new event
  const [currentStep, setCurrentStep] = useState(1);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [startDate, setStartDate] = useState("Select date");
  const [newTime, setNewTime] = useState("Select time");
  const [newLocation, setNewLocation] = useState("");
  const [genderSelection, setGenderSelection] = useState("All");
  const [newDesc, setNewDesc] = useState("");

  // Step 2 Form States
  const [eventType, setEventType] = useState<"Paid" | "Free">("Paid");
  const [costPerTicket, setCostPerTicket] = useState("123");
  const [currency, setCurrency] = useState("INR");

  const mockCovers = [
    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80", // Nagpur Dome
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600", // Rooftop
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600", // Cafe Connect
  ];

  const handleCycleCover = () => {
    if (!coverPhoto) {
      setCoverPhoto(mockCovers[0]);
    } else {
      const idx = mockCovers.indexOf(coverPhoto);
      if (idx === -1 || idx === mockCovers.length - 1) {
        setCoverPhoto(mockCovers[0]);
      } else {
        setCoverPhoto(mockCovers[idx + 1]);
      }
    }
  };

  const handleCycleDate = () => {
    const dates = ["13/07/2026", "14/07/2026", "15/07/2026", "16/07/2026"];
    const idx = dates.indexOf(startDate);
    if (idx === -1 || idx === dates.length - 1) {
      setStartDate(dates[0]);
    } else {
      setStartDate(dates[idx + 1]);
    }
  };

  const handleCycleTime = () => {
    const times = ["15:20", "18:00", "20:00", "22:30"];
    const idx = times.indexOf(newTime);
    if (idx === -1 || idx === times.length - 1) {
      setNewTime(times[0]);
    } else {
      setNewTime(times[idx + 1]);
    }
  };

  const handleCycleGender = () => {
    const genders = ["All", "Male Only", "Female Only"];
    const idx = genders.indexOf(genderSelection);
    if (idx === -1 || idx === genders.length - 1) {
      setGenderSelection(genders[0]);
    } else {
      setGenderSelection(genders[idx + 1]);
    }
  };

  const handleCycleCurrency = () => {
    const currencies = ["INR", "USD", "EUR"];
    const idx = currencies.indexOf(currency);
    if (idx === -1 || idx === currencies.length - 1) {
      setCurrency(currencies[0]);
    } else {
      setCurrency(currencies[idx + 1]);
    }
  };

  const isStep1Valid = newTitle.trim().length > 0 &&
                       startDate !== "Select date" &&
                       newTime !== "Select time" &&
                       newLocation.trim().length > 0 &&
                       newDesc.trim().length > 0;

  const handleCreateEvent = async () => {
    if (!newTitle.trim() || !newLocation.trim() || !newDesc.trim()) {
      Alert.alert("Missing details", "Please fill in all details!");
      return;
    }
    if (!user) {
      Alert.alert("Login required", "Please log in to create an event.");
      return;
    }

    try {
      const [dd, mm, yyyy] = startDate.includes("/")
        ? startDate.split("/")
        : ["", "", ""];
      const scheduled = new Date();
      if (dd && mm && yyyy) {
        scheduled.setFullYear(Number(yyyy), Number(mm) - 1, Number(dd));
      } else {
        scheduled.setDate(scheduled.getDate() + 1);
      }
      const [hh, min] = newTime.includes(":") ? newTime.split(":") : ["18", "0"];
      scheduled.setHours(Number(hh) || 18, Number(min) || 0, 0, 0);

      await api.createPlan({
        title: newTitle.trim(),
        description: newDesc.trim(),
        location: newLocation.trim(),
        scheduledAt: scheduled.toISOString(),
        maxParticipants: 20,
        activity: "Event",
        imageUrl:
          coverPhoto ||
          "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80",
        kind: "EVENT",
      });

      await refreshEvents();
      setShowCreateModal(false);
      setCurrentStep(1);
      setCoverPhoto(null);
      setNewTitle("");
      setStartDate("Select date");
      setNewTime("Select time");
      setNewLocation("");
      setGenderSelection("All");
      setNewDesc("");
      setEventType("Paid");
      setCostPerTicket("123");
      setCurrency("INR");
      Alert.alert("Event live", "Your event is published for people nearby.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not create event");
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      setShowCreateModal(false);
    }
  };

  const handleEventPress = (item: EventItem) => {
    router.push({
      pathname: "/event-details",
      params: {
        id: item.id,
        title: item.title,
        category: item.category,
        location: item.location,
        timeLabel: item.timeLabel,
        creatorName: item.creatorName,
        creatorAvatar: item.creatorAvatar,
        creatorTimeAgo: item.creatorTimeAgo,
        tags: item.tags.join(","),
        description: item.description,
        imageUrl: item.imageUrl,
        goingCount: String(item.goingCount),
        commentCount: String(item.commentCount),
        isVerified: item.isVerified ? "true" : "false",
        isFree: item.isFree ? "true" : "false",
      }
    });
  };

  // Filter events based on search query and activeFilter chip selection
  const filteredEvents = events.filter((e) => {
    // Hide event automatically after its day passes (expires at 2:00 AM the next day)
    if (isEventExpired(e.timeLabel)) {
      return false;
    }

    // 1. Search filter query
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Active Tab chip filter selection
    if (activeFilter === "All") return true;
    if (activeFilter === "Free Hang") return e.isFree === true;
    if (activeFilter === "Today") return e.timeLabel.toLowerCase().includes("today");
    if (activeFilter === "This Week") {
      const time = e.timeLabel.toLowerCase();
      return time.includes("today") || time.includes("tomorrow");
    }
    if (activeFilter === "Nearby") return e.location.toLowerCase().includes("nagpur");

    return true;
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <View style={styles.headerWrap}>
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80" }}
        style={styles.headerBackdrop}
        imageStyle={styles.headerBackdropImage}
      >
        <LinearGradient
          colors={["rgba(15,11,26,0.5)", "rgba(15,11,26,0.88)", T.dark]}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={styles.safeHeader} edges={["top"]}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backArrowBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.brandPill}>
              <Ionicons name="sparkles" size={11} color="#E9D5FF" />
              <Text style={styles.brandPillText}>EVENTS</Text>
            </View>

            <View style={styles.topRightActions}>
              <TouchableOpacity style={styles.bellBtn} onPress={() => router.push("/events-map")}>
                <Ionicons name="map" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.bellBtn}>
                <Ionicons name="notifications" size={18} color="#fff" />
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>3</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowCreateModal(true)}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.greetingBlock}>
            <Text style={styles.greetingText}>Hey Mayur</Text>
            <Text style={styles.greetingSub}>Tonight&apos;s vibes are loading…</Text>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.gradientHeadingText}>Events in My City</Text>
            <View style={styles.titleMetaRow}>
              <Text style={styles.subtextCaption}>Discover · Connect · Hangout</Text>
              <View style={styles.liveCountPill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveCountText}>{filteredEvents.length} live</Text>
              </View>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.locationSearchPill}>
              <Ionicons name="location" size={12} color="#C4B5FD" />
              <Text style={styles.locationText}>Nagpur</Text>
              <Ionicons name="chevron-down" size={10} color="rgba(255,255,255,0.45)" />
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={14} color="rgba(255,255,255,0.4)" />
              <TextInput
                placeholder="Search events…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterGearBtn} onPress={() => setShowCreateModal(true)}>
              <LinearGradient colors={[...T.cta]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
      <View style={styles.heroCurve} />
      </View>

      <View style={styles.bodySheet}>

          {/* Horizontal scroll tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll} contentContainerStyle={styles.tagsContent}>
            {MAIN_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.tagChip, activeFilter === f.id && styles.tagChipActive]}
                onPress={() => setActiveFilter(f.id)}
              >
                {activeFilter === f.id ? (
                  <LinearGradient colors={[...T.cta]} style={styles.tagChipGrad}>
                    <Ionicons name={f.icon as any} size={12} color="#fff" />
                    <Text style={styles.tagChipTextActive}>{f.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tagChipInner}>
                    <Ionicons name={f.icon as any} size={12} color={f.id === "Free Hang" ? "#16A34A" : T.muted} />
                    <Text style={[styles.tagChipText, f.id === "Free Hang" && { color: "#16A34A" }]}>{f.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

        {/* SUB-TABS (Popular, Recent, Following) */}
        <View style={styles.subTabsRow}>
          {(["Popular", "Recent", "Following"] as const).map((tab) => {
            const isActive = selectedSubTab === tab;
            const iconMap = { Popular: "flame", Recent: "time", Following: "people" };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.subTabItem, isActive && styles.subTabItemActive]}
                onPress={() => setSelectedSubTab(tab)}
              >
                <View style={styles.subTabLabelRow}>
                  {isActive && <Ionicons name={iconMap[tab] as any} size={13} color={T.pink} style={{ marginRight: 4 }} />}
                  <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                    {tab}
                  </Text>
                </View>
                {isActive && <View style={styles.subTabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* EVENTS LIST SCROLLVIEW */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {/* Featured strip */}
          <LinearGradient
            colors={["#1A1230", "#2A1854", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featuredStrip}
          >
            <View style={styles.featuredStripLeft}>
              <Text style={styles.featuredEyebrow}>TONIGHT</Text>
              <Text style={styles.featuredTitle}>Hot hangouts near you</Text>
            </View>
            <Pressable onPress={() => router.push("/events-map")} style={styles.featuredMapBtn}>
              <Ionicons name="map" size={14} color={T.purpleDeep} />
              <Text style={styles.featuredMapText}>Map</Text>
            </Pressable>
          </LinearGradient>

          {filteredEvents.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 80).springify().damping(15)}>
            <TouchableOpacity
              onPress={() => handleEventPress(item)}
              activeOpacity={0.93}
            >
              <View style={styles.eventCard}>
                {/* Full-bleed hero media */}
                <View style={styles.cardHero}>
                  <Image source={{ uri: item.imageUrl }} style={styles.cardHeroImg} />
                  <LinearGradient
                    colors={["rgba(15,11,26,0.15)", "rgba(15,11,26,0.35)", "rgba(15,11,26,0.92)"]}
                    style={styles.cardHeroFade}
                  />

                  <View style={styles.cardHeroTop}>
                    <View style={styles.freeHangBadge}>
                      <Ionicons name="leaf" size={9} color="#fff" />
                      <Text style={styles.freeHangText}>FREE</Text>
                    </View>
                    <View style={styles.categoryHeroBadge}>
                      <Text style={styles.categoryHeroText}>{item.category}</Text>
                    </View>
                  </View>

                  <View style={styles.cardHeroBottom}>
                    <Text style={styles.cardHeroTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.cardHeroMeta}>
                      <Ionicons name="location" size={12} color="#E9D5FF" />
                      <Text style={styles.cardHeroLoc} numberOfLines={1}>{item.location}</Text>
                    </View>
                  </View>
                </View>

                {/* Light details panel */}
                <View style={styles.cardBody}>
                  <View style={styles.creatorRow}>
                    <Image source={{ uri: item.creatorAvatar }} style={styles.creatorAvatar} />
                    <View style={styles.creatorMeta}>
                      <View style={styles.creatorNameRow}>
                        <Text style={styles.creatorName}>{item.creatorName}</Text>
                        {item.isVerified ? (
                          <Ionicons name="checkmark-circle" size={13} color={T.purple} style={{ marginLeft: 4 }} />
                        ) : null}
                      </View>
                      <Text style={styles.creatorTimeAgo}>Host · {item.creatorTimeAgo}</Text>
                    </View>
                    <View style={styles.goingStack}>
                      <Text style={styles.goingStackNum}>{item.goingCount}</Text>
                      <Text style={styles.goingStackLabel}>going</Text>
                    </View>
                  </View>

                  <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>

                  <View style={styles.tagsCapsulesRow}>
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <View key={idx} style={styles.tagCapsule}>
                        <Text style={styles.tagCapsuleText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.footerCapsule}>
                      <Ionicons name="calendar-outline" size={13} color={T.purple} />
                      <Text style={styles.footerCapsuleText}>{item.timeLabel}</Text>
                    </View>
                    <View style={styles.footerCapsule}>
                      <Ionicons name="chatbubble-outline" size={12} color={T.muted} />
                      <Text style={styles.footerCapsuleText}>{item.commentCount} chats</Text>
                    </View>
                    <TouchableOpacity style={styles.interestBtn}>
                      <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.interestGrad}>
                        <Text style={styles.interestBtnText}>I&apos;m In</Text>
                        <Ionicons name="arrow-forward" size={12} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            </Animated.View>
          ))}

          {/* Boost Your Event Promo Banner Footer */}
          <LinearGradient
            colors={[...T.hero]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.boostBanner}
          >
            <View style={styles.boostGrad}>
              <View style={styles.boostLeft}>
                <View style={styles.crownCircle}>
                  <Ionicons name="diamond" size={16} color="#E9D5FF" />
                </View>
                <View style={styles.boostTextCol}>
                  <Text style={styles.boostTitle}>Boost Your Event</Text>
                  <Text style={styles.boostSubtitle}>Get more joins with a premium push.</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.boostBtn}>
                <LinearGradient colors={["#FFFFFF", "#F3E8FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.boostBtnGrad}>
                  <Text style={[styles.boostBtnText, { color: T.darkSoft }]}>Boost</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <Pressable style={styles.mapCta} onPress={() => router.push("/events-map")}>
            <View style={styles.mapCtaInner}>
              <View style={styles.mapCtaIcon}>
                <Ionicons name="map" size={18} color={T.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mapCtaTitle}>Open Live Map</Text>
                <Text style={styles.mapCtaSub}>See events & people around the city</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={T.purple} />
            </View>
          </Pressable>
        </ScrollView>
      </View>

      {/* Organizer Create Event Modal Form */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={handleBack}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.dismissOverlay} onPress={handleBack} />
          
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalSheet, { backgroundColor: "#000000" }]}>
            {/* Top Navigation Row: Back Arrow + Progress Bar + Step Indicator */}
            <View style={styles.progressBarContainer}>
              <TouchableOpacity onPress={handleBack} style={styles.modalBackBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: currentStep === 1 ? "50%" : "100%" }]} />
              </View>
              
              <Text style={styles.progressText}>{currentStep} of 2</Text>
            </View>

            {/* Step Title Heading */}
            <View style={styles.modalTitleBlock}>
              <Text style={styles.modalStepTitle}>
                {currentStep === 1 ? "Event Details" : "Payment and Ticket Details"}
              </Text>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {currentStep === 1 ? (
                /* STEP 1: EVENT DETAILS */
                <>
                  {/* Cover Photo Picker Box */}
                  <Pressable onPress={handleCycleCover}>
                    {coverPhoto ? (
                      <ImageBackground source={{ uri: coverPhoto }} style={styles.coverPhotoBox} imageStyle={{ borderRadius: 16 }}>
                        <LinearGradient colors={["rgba(8,8,12,0.25)", "rgba(8,8,12,0.85)"]} style={StyleSheet.absoluteFillObject} />
                        
                        <View style={styles.coverLandmarkLabelWrap}>
                          <Text style={styles.coverLandmarkText}>Hey Mayur! 👋</Text>
                          <Text style={styles.coverLandmarkHeading}>Events in My City</Text>
                          <Text style={styles.coverLandmarkSub}>Discover • Connect • Vibe</Text>
                        </View>

                        <View style={styles.editCoverBadge}>
                          <Ionicons name="camera" size={12} color="#fff" />
                          <Text style={{ color: "#fff", fontSize: 9, fontFamily: VibeFonts.bold }}>Edit</Text>
                        </View>
                      </ImageBackground>
                    ) : (
                      <View style={styles.coverPhotoBox}>
                        <Ionicons name="add" size={24} color="#2DD4BF" style={{ marginBottom: 6 }} />
                        <Text style={styles.coverPhotoText}>Add cover photo</Text>
                      </View>
                    )}
                  </Pressable>

                  {/* Event Name Input */}
                  <View style={{ marginBottom: Spacing.md }}>
                    <Text style={styles.inputGroupLabel}>Event Name</Text>
                    <TextInput
                      style={styles.modalInputTextOnly}
                      value={newTitle}
                      onChangeText={setNewTitle}
                      placeholder="Create event name"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  </View>

                  {/* Start Date & Time Picker Row */}
                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputGroupLabel}>Start Date</Text>
                      <Pressable onPress={handleCycleDate} style={styles.inputContainer}>
                        <View style={styles.iconCircle}>
                          <Ionicons name="calendar-outline" size={18} color="#fff" />
                        </View>
                        <Text style={startDate === "Select date" ? styles.inputTextPlaceholder : styles.inputText}>
                          {startDate}
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.formCol}>
                      <Text style={styles.inputGroupLabel}>Time</Text>
                      <Pressable onPress={handleCycleTime} style={styles.inputContainer}>
                        <View style={styles.iconCircle}>
                          <Ionicons name="time-outline" size={18} color="#fff" />
                        </View>
                        <Text style={newTime === "Select time" ? styles.inputTextPlaceholder : styles.inputText}>
                          {newTime}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Address Input */}
                  <View style={{ marginBottom: Spacing.md }}>
                    <Text style={styles.inputGroupLabel}>Address</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="location-outline" size={18} color="#fff" />
                      </View>
                      <TextInput
                        style={styles.inputField}
                        value={newLocation}
                        onChangeText={setNewLocation}
                        placeholder="Search address"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                      />
                    </View>
                  </View>

                  {/* Gender Selection */}
                  <View style={{ marginBottom: Spacing.md }}>
                    <Text style={styles.inputGroupLabel}>Gender Selection</Text>
                    <Pressable onPress={handleCycleGender} style={styles.inputContainer}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="person-outline" size={16} color="#fff" />
                      </View>
                      <Text style={styles.inputText}>{genderSelection}</Text>
                      <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: "auto" }} />
                    </Pressable>
                  </View>

                  {/* Description Info Field */}
                  <View style={{ marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={styles.inputGroupLabel}>Description</Text>
                      <Ionicons name="information-circle-outline" size={12} color="rgba(255,255,255,0.4)" />
                    </View>
                    <TextInput
                      style={styles.modalInputDescription}
                      value={newDesc}
                      onChangeText={setNewDesc}
                      placeholder="Add event description"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      multiline
                    />
                  </View>

                  {/* Add More Photos Row */}
                  <Pressable style={styles.addMoreBtn} onPress={handleCycleCover}>
                    <Ionicons name="add" size={18} color="#2DD4BF" />
                    <Text style={styles.addMoreText}>Add More Photos / Videos</Text>
                  </Pressable>

                  {/* Step 1 Next Action button */}
                  {isStep1Valid ? (
                    <TouchableOpacity onPress={() => setCurrentStep(2)} style={styles.submitBtn}>
                      <LinearGradient colors={["#0D9488", "#14B8A6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGrad}>
                        <Text style={styles.submitBtnText}>Next</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.nextBtnDisabled}>
                      <Text style={styles.nextBtnTextDisabled}>Next</Text>
                    </View>
                  )}
                </>
              ) : (
                /* STEP 2: PAYMENT AND TICKET DETAILS */
                <>
                  <Text style={styles.inputGroupLabel}>Event Type</Text>
                  <View style={styles.eventTypeRow}>
                    <TouchableOpacity 
                      onPress={() => setEventType("Paid")}
                      style={[styles.eventTypeCard, eventType === "Paid" ? styles.eventTypeCardActive : styles.eventTypeCardInactive]}
                    >
                      <View style={styles.eventTypeCardHeader}>
                        <Text style={styles.eventTypeLabel}>Paid Event</Text>
                        <Ionicons 
                          name={eventType === "Paid" ? "checkmark-circle" : "ellipse-outline"} 
                          size={18} 
                          color={eventType === "Paid" ? "#2DD4BF" : "rgba(255,255,255,0.3)"} 
                        />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => setEventType("Free")}
                      style={[styles.eventTypeCard, eventType === "Free" ? styles.eventTypeCardActive : styles.eventTypeCardInactive]}
                    >
                      <View style={styles.eventTypeCardHeader}>
                        <Text style={styles.eventTypeLabel}>Free Event</Text>
                        <Ionicons 
                          name={eventType === "Free" ? "checkmark-circle" : "ellipse-outline"} 
                          size={18} 
                          color={eventType === "Free" ? "#2DD4BF" : "rgba(255,255,255,0.3)"} 
                        />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Cost Per Ticket Input (only if Paid) */}
                  {eventType === "Paid" && (
                    <View style={{ marginBottom: Spacing.md }}>
                      <Text style={styles.inputGroupLabel}>Cost Per Ticket</Text>
                      <View style={styles.inputContainer}>
                        <View style={styles.iconCircle}>
                          <Ionicons name="wallet-outline" size={18} color="#fff" />
                        </View>
                        <TextInput
                          style={styles.inputField}
                          value={costPerTicket}
                          onChangeText={setCostPerTicket}
                          placeholder="Enter cost per ticket"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  )}

                  {/* Currency Selector Row */}
                  <View style={{ marginBottom: Spacing.xl }}>
                    <Text style={styles.inputGroupLabel}>Select Currency</Text>
                    <Pressable onPress={handleCycleCurrency} style={styles.inputContainer}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="logo-usd" size={16} color="#fff" />
                      </View>
                      <Text style={styles.inputText}>
                        {currency === "INR" ? "🇮🇳 INR" : currency === "USD" ? "🇺🇸 USD" : "🇪🇺 EUR"}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: "auto" }} />
                    </Pressable>
                  </View>

                  {/* Submit Action Button */}
                  <TouchableOpacity onPress={handleCreateEvent} style={styles.submitBtn}>
                    <LinearGradient colors={["#0D9488", "#14B8A6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGrad}>
                      <Text style={styles.submitBtnText}>Post</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Main TabBar */}
      <TabBar dark={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },
  orb: { position: "absolute", borderRadius: 999 },
  orb1: { width: 220, height: 220, top: 180, right: -70, backgroundColor: "rgba(139,92,246,0.12)" },
  orb2: { width: 200, height: 200, bottom: 80, left: -80, backgroundColor: "rgba(236,72,153,0.08)" },

  headerWrap: { backgroundColor: T.dark, zIndex: 2 },
  headerBackdrop: { width: "100%", overflow: "hidden" },
  headerBackdropImage: { opacity: 0.45, resizeMode: "cover" },
  heroCurve: {
    height: 22,
    backgroundColor: T.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  bodySheet: { flex: 1, backgroundColor: T.bg, marginTop: -4 },
  safeHeader: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.xs },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(233,213,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  brandPillText: { color: "#E9D5FF", fontSize: 10, fontFamily: VibeFonts.bold, letterSpacing: 1 },
  backArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  greetingBlock: { marginTop: Spacing.md },
  greetingText: { color: "#fff", fontSize: 15, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  greetingSub: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: VibeFonts.medium, marginTop: 2 },
  topRightActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { marginTop: Spacing.sm, gap: 6 },
  gradientHeadingText: { fontSize: 28, fontFamily: VibeFonts.extraBold, color: "#fff", letterSpacing: -0.8 },
  titleMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subtextCaption: { fontSize: 12, fontFamily: VibeFonts.semiBold, color: "rgba(233,213,255,0.7)", letterSpacing: -0.1 },
  liveCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.18)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.35)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
  liveCountText: { color: "#BBF7D0", fontSize: 10, fontFamily: VibeFonts.bold },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: T.pink,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: { color: "#fff", fontSize: 8, fontFamily: VibeFonts.bold },

  searchContainer: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xs },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: Spacing.md },
  locationSearchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  locationText: { color: "#fff", fontSize: 11, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 12, fontFamily: VibeFonts.medium, padding: 0 },
  filterGearBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  tagsScroll: { marginTop: Spacing.sm, maxHeight: 52 },
  tagsContent: { gap: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: 4, alignItems: "center" },
  tagChip: { borderRadius: Radius.full, overflow: "hidden" },
  tagChipGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagChipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  tagChipText: { color: T.muted, fontSize: 11, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  tagChipTextActive: { color: "#fff", fontSize: 11, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  tagChipActive: { borderWidth: 0 },

  subTabsRow: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  subTabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  subTabItemActive: {},
  subTabLabelRow: { flexDirection: "row", alignItems: "center" },
  subTabText: { color: T.faint, fontSize: 12, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  subTabTextActive: { color: T.ink },
  subTabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2.5,
    width: 56,
    backgroundColor: T.pink,
    borderRadius: 2,
  },

  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 110 },

  featuredStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.35)",
  },
  featuredStripLeft: { flex: 1, paddingRight: 10 },
  featuredEyebrow: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#E9D5FF",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  featuredTitle: { fontSize: 15, fontFamily: VibeFonts.extraBold, color: "#fff", letterSpacing: -0.3 },
  featuredMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  featuredMapText: { fontSize: 12, fontFamily: VibeFonts.bold, color: T.purpleDeep },

  eventCard: {
    marginBottom: Spacing.lg,
    backgroundColor: T.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    shadowColor: "#1A1230",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cardHero: { height: 168, position: "relative" },
  cardHeroImg: { width: "100%", height: "100%", resizeMode: "cover" },
  cardHeroFade: { ...StyleSheet.absoluteFillObject },
  cardHeroTop: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  freeHangBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(22,163,74,0.95)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  freeHangText: { color: "#fff", fontSize: 9, fontFamily: VibeFonts.bold, letterSpacing: 0.5 },
  categoryHeroBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryHeroText: { color: "#fff", fontSize: 10, fontFamily: VibeFonts.bold },
  cardHeroBottom: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
  },
  cardHeroTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  cardHeroMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardHeroLoc: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: VibeFonts.medium, flex: 1 },

  cardBody: { padding: 14, gap: 8 },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  creatorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#DDD6FE",
  },
  creatorMeta: { flex: 1 },
  creatorNameRow: { flexDirection: "row", alignItems: "center" },
  creatorName: { color: T.ink, fontSize: 13, fontFamily: VibeFonts.bold },
  creatorTimeAgo: { color: T.faint, fontSize: 10, fontFamily: VibeFonts.medium, marginTop: 1 },
  goingStack: {
    alignItems: "center",
    backgroundColor: T.softPurple,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  goingStackNum: { fontSize: 13, fontFamily: VibeFonts.extraBold, color: T.purpleDeep },
  goingStackLabel: { fontSize: 8, fontFamily: VibeFonts.bold, color: T.muted, textTransform: "uppercase" },
  eventDesc: { color: T.muted, fontSize: 12, fontFamily: VibeFonts.medium, lineHeight: 17 },
  tagsCapsulesRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tagCapsule: {
    backgroundColor: T.softPurple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  tagCapsuleText: { color: T.purpleDeep, fontSize: 10, fontFamily: VibeFonts.bold },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  footerCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F7F4FC",
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
  },
  footerFree: { backgroundColor: "#ECFDF5", borderColor: "#BBF7D0" },
  footerCapsuleText: { color: T.muted, fontSize: 10, fontFamily: VibeFonts.bold },
  interestBtn: { marginLeft: "auto", borderRadius: Radius.full, overflow: "hidden" },
  interestGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  interestBtnText: { color: "#fff", fontSize: 11, fontFamily: VibeFonts.bold },

  // Legacy unused keys kept harmless for other refs
  cardMainRow: { flexDirection: "row", gap: Spacing.md },
  cardLeftThumb: { width: 108, height: 138, borderRadius: 18, overflow: "hidden" },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbFade: { ...StyleSheet.absoluteFillObject },
  countersRow: { position: "absolute", bottom: 8, left: 6, right: 6, flexDirection: "row" },
  counterItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  counterText: { color: "#fff", fontSize: 8, fontFamily: VibeFonts.bold },
  cardRightDetails: { flex: 1, gap: 4 },
  creatorActions: { flexDirection: "row", gap: 4 },
  cardActionIcon: { padding: 2 },
  categoryMini: {
    backgroundColor: T.softPurple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryMiniText: { fontSize: 9, fontFamily: VibeFonts.bold, color: T.purpleDeep },
  eventTitle: { fontSize: 14, fontFamily: VibeFonts.extraBold, color: T.ink },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationVal: { color: T.muted, fontSize: 10, fontFamily: VibeFonts.medium, flex: 1 },

  boostBanner: {
    overflow: "hidden",
    marginTop: Spacing.sm,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.35)",
  },
  boostGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    width: "100%",
  },
  boostLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md, flex: 1 },
  crownCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(233,213,255,0.3)",
  },
  boostTextCol: { flex: 1, gap: 1 },
  boostTitle: { color: "#fff", fontSize: 13, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  boostSubtitle: { color: "#D8B4FE", fontSize: 10, fontFamily: VibeFonts.medium },
  boostBtn: { borderRadius: Radius.full, overflow: "hidden" },
  boostBtnGrad: { paddingHorizontal: 14, paddingVertical: 8 },
  boostBtnText: { fontSize: 10, fontFamily: VibeFonts.bold },

  mapCta: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  mapCtaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
  },
  mapCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCtaTitle: { fontSize: 14, fontFamily: VibeFonts.bold, color: T.ink },
  mapCtaSub: { fontSize: 11, fontFamily: VibeFonts.medium, color: T.muted, marginTop: 1 },

  // Modal Sheet Form
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,11,26,0.55)", justifyContent: "flex-end" },
  dismissOverlay: { ...StyleSheet.absoluteFillObject },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(138, 86, 255, 0.12)",
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(31, 26, 58, 0.08)",
  },
  modalTitle: { fontSize: 16, fontFamily: VibeFonts.bold, color: "#1F1A3A", letterSpacing: -0.3 },
  modalFormScroll: { marginVertical: Spacing.md },
  inputLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "rgba(31, 26, 58, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  modalInput: {
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
    borderRadius: Radius.md,
    padding: 10,
    color: "#1F1A3A",
    fontFamily: VibeFonts.medium,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  categorySelectRow: { flexDirection: "row", gap: 6, marginVertical: Spacing.xs },
  categorySelectBtn: {
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
  },
  categorySelectBtnActive: {
    backgroundColor: "#8A56FF",
    borderColor: "rgba(138, 86, 255, 0.15)",
  },
  categorySelectText: { color: "rgba(31, 26, 58, 0.6)", fontSize: 11, fontFamily: VibeFonts.bold },
  categorySelectTextActive: { color: "#fff" },
  submitBtn: { marginTop: Spacing.md, borderRadius: Radius.full, overflow: "hidden" },
  submitGrad: { paddingVertical: 14, alignItems: "center" },
  submitBtnText: { color: "#fff", fontFamily: VibeFonts.bold, fontSize: 14 },
 
  // MULTI-STEP CREATION FORM STYLES
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: Spacing.md,
  },
  modalBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(31, 26, 58, 0.08)",
    borderRadius: 2,
    marginHorizontal: 16,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "#2DD4BF",
    borderRadius: 2,
  },
  progressText: {
    color: "rgba(31, 26, 58, 0.6)",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  modalTitleBlock: {
    marginVertical: Spacing.sm,
  },
  modalStepTitle: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: "#1F1A3A",
    letterSpacing: -0.5,
  },
  coverPhotoBox: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#8A56FF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(138, 86, 255, 0.04)",
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  coverPhotoText: {
    color: "rgba(31, 26, 58, 0.6)",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  coverLandmarkLabelWrap: {
    position: "absolute",
    left: 20,
    bottom: 20,
    gap: 2,
  },
  coverLandmarkText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  coverLandmarkHeading: {
    color: "#fff",
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.3,
  },
  coverLandmarkSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: VibeFonts.bold,
  },
  editCoverBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  modalInputTextOnly: {
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
    borderRadius: Radius.md,
    padding: 12,
    color: "#1F1A3A",
    fontFamily: VibeFonts.medium,
    fontSize: 14,
  },
  formRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  formCol: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(31, 26, 58, 0.08)",
    paddingVertical: Spacing.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(138, 86, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputField: {
    flex: 1,
    color: "#1F1A3A",
    fontFamily: VibeFonts.medium,
    fontSize: 14,
    padding: 0,
  },
  inputText: {
    flex: 1,
    color: "#1F1A3A",
    fontFamily: VibeFonts.medium,
    fontSize: 14,
  },
  inputTextPlaceholder: {
    flex: 1,
    color: "rgba(31, 26, 58, 0.4)",
    fontFamily: VibeFonts.medium,
    fontSize: 14,
  },
  inputGroupLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "rgba(31, 26, 58, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalInputDescription: {
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
    borderRadius: Radius.md,
    padding: 12,
    color: "#1F1A3A",
    fontFamily: VibeFonts.medium,
    fontSize: 14,
    height: 70,
    textAlignVertical: "top",
  },
  addMoreBtn: {
    borderWidth: 1,
    borderColor: "rgba(138, 86, 255, 0.25)",
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.md,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(138, 86, 255, 0.04)",
  },
  addMoreText: {
    color: "#8A56FF",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  nextBtnDisabled: {
    backgroundColor: "rgba(31, 26, 58, 0.08)",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  nextBtnTextDisabled: {
    color: "rgba(31, 26, 58, 0.4)",
    fontFamily: VibeFonts.bold,
    fontSize: 14,
  },
  eventTypeRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  eventTypeCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  eventTypeCardActive: {
    borderColor: "#8A56FF",
    backgroundColor: "rgba(138, 86, 255, 0.08)",
  },
  eventTypeCardInactive: {
    borderColor: "rgba(31, 26, 58, 0.08)",
  },
  eventTypeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  eventTypeLabel: {
    color: "#1F1A3A",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
});
