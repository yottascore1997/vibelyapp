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
  Alert,
  Linking,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import TabBar from "../components/TabBar";
import AppHeader from "../components/vibe/AppHeader";
import { VibeFonts } from "../constants/vibeTheme";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

// Categories required by user spec
const CATEGORIES = [
  { id: "Coffee", label: "Coffee", emoji: "☕", bg: "#FEF3C7", color: "#D97706" },
  { id: "Drinks", label: "Drinks", emoji: "🍹", bg: "#FCE7F3", color: "#DB2777" },
  { id: "Dinner", label: "Dinner", emoji: "🍽️", bg: "#FFEDD5", color: "#EA580C" },
  { id: "Walk", label: "Walk", emoji: "🚶", bg: "#D1FAE5", color: "#059669" },
  { id: "Movie", label: "Movie", emoji: "🎬", bg: "#F3E8FF", color: "#7C3AED" },
  { id: "Bowling", label: "Bowling", emoji: "🎳", bg: "#E0F2FE", color: "#0284C7" },
];

// Basic filters required by user spec
const QUICK_FILTERS = ["All", "Today", "This Weekend", "Free", "Coffee", "Drinks"];

// Cities
const CITIES = ["Nagpur", "Mumbai", "Pune", "Delhi", "Bangalore", "Goa"];

export interface VibelyEvent {
  id: string;
  title: string;
  category: string;
  categoryEmoji: string;
  coverImage: string;
  description: string;
  date: string;
  time: string;
  dateLabel: string;
  venue: string;
  city: string;
  distance: string;
  googleMapsUrl?: string;
  hostName: string;
  hostAvatar: string;
  isHostVerified?: boolean;
  maxParticipants: number;
  joinedCount: number;
  joinedUserIds: string[];
  isFree: boolean;
  ticketPrice?: number;
  isCancelled?: boolean;
  createdById: string;
}

const PRESET_EVENTS: VibelyEvent[] = [
  {
    id: "evt-1",
    title: "Sunset Specialty Coffee & Chill ☕",
    category: "Coffee",
    categoryEmoji: "☕",
    coverImage: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800",
    description: "Calling all coffee lovers! Let's meet at Cafe Connect for pour-overs, artisan brews, and good conversations.",
    date: "2026-07-27",
    time: "18:30",
    dateLabel: "Today, 6:30 PM",
    venue: "Cafe Connect, Dharampeth",
    city: "Nagpur",
    distance: "1.2 km away",
    googleMapsUrl: "https://maps.google.com/?q=Cafe+Connect+Nagpur",
    hostName: "Roshani Mayur",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
    isHostVerified: true,
    maxParticipants: 8,
    joinedCount: 5,
    joinedUserIds: ["u2", "u3", "u4", "u5", "u6"],
    isFree: true,
    createdById: "u-other-1",
  },
  {
    id: "evt-2",
    title: "Rooftop Cocktails & Weekend Vibe 🍹",
    category: "Drinks",
    categoryEmoji: "🍹",
    coverImage: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800",
    description: "Enjoy sunset views, craft drinks, and house music with great people.",
    date: "2026-07-28",
    time: "20:00",
    dateLabel: "Tomorrow, 8:00 PM",
    venue: "Empress City Lounge, Sadar",
    city: "Nagpur",
    distance: "2.5 km away",
    googleMapsUrl: "https://maps.google.com/?q=Empress+City+Nagpur",
    hostName: "Karan Sharma",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120",
    isHostVerified: true,
    maxParticipants: 12,
    joinedCount: 9,
    joinedUserIds: ["u-current", "u2", "u7"],
    isFree: false,
    ticketPrice: 250,
    createdById: "u-other-2",
  },
  {
    id: "evt-3",
    title: "Late Night Gourmet Dinner Party 🍽️",
    category: "Dinner",
    categoryEmoji: "🍽️",
    coverImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    description: "Wood-fired pizzas, authentic pasta, and great vibes. Everyone pays for what they order!",
    date: "2026-07-29",
    time: "21:15",
    dateLabel: "Wed, 9:15 PM",
    venue: "Olive Bistro, Civil Lines",
    city: "Nagpur",
    distance: "3.1 km away",
    googleMapsUrl: "https://maps.google.com/?q=Olive+Bistro+Nagpur",
    hostName: "Ananya Roy",
    hostAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120",
    isHostVerified: true,
    maxParticipants: 6,
    joinedCount: 4,
    joinedUserIds: ["u3", "u8"],
    isFree: true,
    createdById: "u-other-3",
  },
  {
    id: "evt-4",
    title: "Futala Lake Evening Stroll 🚶",
    category: "Walk",
    categoryEmoji: "🚶",
    coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    description: "Relaxed evening walk around Futala promenade followed by street food snacks.",
    date: "2026-07-27",
    time: "19:00",
    dateLabel: "Today, 7:00 PM",
    venue: "Futala Promenade, West Nagpur",
    city: "Nagpur",
    distance: "4.0 km away",
    googleMapsUrl: "https://maps.google.com/?q=Futala+Lake+Nagpur",
    hostName: "Aman Gupta",
    hostAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120",
    isHostVerified: false,
    maxParticipants: 15,
    joinedCount: 11,
    joinedUserIds: [],
    isFree: true,
    createdById: "u-other-4",
  },
  {
    id: "evt-5",
    title: "IMAX Night: New Blockbuster 🎬",
    category: "Movie",
    categoryEmoji: "🎬",
    coverImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    description: "Catching the latest movie in IMAX 3D together! Group popcorn included.",
    date: "2026-08-01",
    time: "19:30",
    dateLabel: "This Saturday, 7:30 PM",
    venue: "Cinepolis, VR Mall, Medical Square",
    city: "Nagpur",
    distance: "1.8 km away",
    googleMapsUrl: "https://maps.google.com/?q=VR+Mall+Nagpur",
    hostName: "Neha Verma",
    hostAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120",
    isHostVerified: true,
    maxParticipants: 10,
    joinedCount: 7,
    joinedUserIds: [],
    isFree: false,
    ticketPrice: 350,
    createdById: "u-other-5",
  },
  {
    id: "evt-6",
    title: "Weekend Bowling & Arcade Battle 🎳",
    category: "Bowling",
    categoryEmoji: "🎳",
    coverImage: "https://images.unsplash.com/photo-1538510001314-774ce26aee20?w=800",
    description: "Friendly bowling tournament and arcade games. Winner gets free drinks!",
    date: "2026-08-02",
    time: "17:00",
    dateLabel: "This Sunday, 5:00 PM",
    venue: "FunZone Alley, Trillium Mall",
    city: "Nagpur",
    distance: "3.5 km away",
    googleMapsUrl: "https://maps.google.com/?q=Trillium+Mall+Nagpur",
    hostName: "Vikram Singh",
    hostAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120",
    isHostVerified: true,
    maxParticipants: 8,
    joinedCount: 6,
    joinedUserIds: [],
    isFree: false,
    ticketPrice: 400,
    createdById: "u-other-6",
  },
];

export default function ExploreEventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id || "u-current";

  // Core States
  const [eventsList, setEventsList] = useState<VibelyEvent[]>(PRESET_EVENTS);
  const [selectedCity, setSelectedCity] = useState("Nagpur");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Sheets
  const [selectedEvent, setSelectedEvent] = useState<VibelyEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMyEventsModal, setShowMyEventsModal] = useState(false);
  const [myEventsTab, setMyEventsTab] = useState<"Upcoming" | "Joined">("Joined");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Create Event Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Coffee");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("Today");
  const [formTime, setFormTime] = useState("19:00");
  const [formVenue, setFormVenue] = useState("");
  const [formMaxParticipants, setFormMaxParticipants] = useState("8");
  const [formIsFree, setFormIsFree] = useState(true);
  const [formTicketPrice, setFormTicketPrice] = useState("150");
  const [formCoverImage, setFormCoverImage] = useState(
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800"
  );

  const handleJoinEvent = (eventId: string) => {
    setEventsList((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const alreadyJoined = e.joinedUserIds.includes(currentUserId);
          if (alreadyJoined) {
            return {
              ...e,
              joinedCount: Math.max(0, e.joinedCount - 1),
              joinedUserIds: e.joinedUserIds.filter((id) => id !== currentUserId),
            };
          } else {
            return {
              ...e,
              joinedCount: e.joinedCount + 1,
              joinedUserIds: [...e.joinedUserIds, currentUserId],
            };
          }
        }
        return e;
      })
    );

    if (selectedEvent && selectedEvent.id === eventId) {
      const alreadyJoined = selectedEvent.joinedUserIds.includes(currentUserId);
      setSelectedEvent({
        ...selectedEvent,
        joinedCount: alreadyJoined
          ? selectedEvent.joinedCount - 1
          : selectedEvent.joinedCount + 1,
        joinedUserIds: alreadyJoined
          ? selectedEvent.joinedUserIds.filter((id) => id !== currentUserId)
          : [...selectedEvent.joinedUserIds, currentUserId],
      });

      if (!alreadyJoined) {
        showToast("🎉 Event Joined Successfully!");
      } else {
        showToast("Event invite response updated");
      }
    } else {
      showToast("🎉 Event Joined Successfully!");
    }
  };

  const handleCreateEventSubmit = () => {
    if (!formTitle.trim() || !formVenue.trim() || !formDescription.trim()) {
      Alert.alert("Missing Details", "Please fill in Title, Venue, and Description.");
      return;
    }

    const catObj = CATEGORIES.find((c) => c.id === formCategory) || CATEGORIES[0];
    const newEvt: VibelyEvent = {
      id: `evt-${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      categoryEmoji: catObj.emoji,
      coverImage: formCoverImage,
      description: formDescription.trim(),
      date: "2026-07-27",
      time: formTime,
      dateLabel: `${formDate}, ${formTime}`,
      venue: formVenue.trim(),
      city: selectedCity,
      distance: "0.5 km away",
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(formVenue.trim() + " " + selectedCity)}`,
      hostName: user?.name || "You",
      hostAvatar:
        user?.avatarUrl ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
      isHostVerified: true,
      maxParticipants: parseInt(formMaxParticipants, 10) || 10,
      joinedCount: 1,
      joinedUserIds: [currentUserId],
      isFree: formIsFree,
      ticketPrice: formIsFree ? 0 : parseInt(formTicketPrice, 10) || 0,
      createdById: currentUserId,
    };

    setEventsList([newEvt, ...eventsList]);
    setShowCreateModal(false);
    showToast("✨ Event Created & Live!");

    // Reset Form
    setFormTitle("");
    setFormVenue("");
    setFormDescription("");
  };

  // Filtered Events computation
  const filteredEvents = eventsList.filter((e) => {
    // City filter
    if (e.city.toLowerCase() !== selectedCity.toLowerCase()) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchVenue = e.venue.toLowerCase().includes(q);
      const matchCat = e.category.toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchCat) return false;
    }

    // Selected Category
    if (activeCategory && e.category.toLowerCase() !== activeCategory.toLowerCase()) {
      return false;
    }

    // Quick filter
    if (activeQuickFilter === "Today") {
      if (!e.dateLabel.toLowerCase().includes("today")) return false;
    } else if (activeQuickFilter === "This Weekend") {
      if (
        !e.dateLabel.toLowerCase().includes("saturday") &&
        !e.dateLabel.toLowerCase().includes("sunday") &&
        !e.dateLabel.toLowerCase().includes("weekend")
      )
        return false;
    } else if (activeQuickFilter === "Free") {
      if (!e.isFree) return false;
    } else if (activeQuickFilter === "Coffee") {
      if (e.category !== "Coffee") return false;
    } else if (activeQuickFilter === "Drinks") {
      if (e.category !== "Drinks") return false;
    }

    return true;
  });

  // User's events for My Events Modal
  const hostedEvents = eventsList.filter((e) => e.createdById === currentUserId);
  const joinedEvents = eventsList.filter((e) => e.joinedUserIds.includes(currentUserId));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      <AppHeader variant="light" tagline="Explore Events · Real Meets" />

      {/* Notification Toast Banner */}
      {toastMessage && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.toastWrap}>
          <LinearGradient
            colors={["#7C3AED", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.toastInner}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#18181B" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Vibely Events</Text>
            {/* City Picker Dropdown Button */}
            <Pressable style={styles.cityPill} onPress={() => setShowCityPicker(true)}>
              <Ionicons name="location-sharp" size={12} color="#7C3AED" />
              <Text style={styles.cityName}>{selectedCity}</Text>
              <Ionicons name="chevron-down" size={12} color="#64748B" />
            </Pressable>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* My Events Button */}
          <Pressable
            style={styles.myEventsBtn}
            onPress={() => setShowMyEventsModal(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#7C3AED" />
            <Text style={styles.myEventsBtnText}>My Events</Text>
          </Pressable>

          {/* Host Event Button */}
          <Pressable onPress={() => setShowCreateModal(true)}>
            <LinearGradient
              colors={["#7C3AED", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hostBtnGrad}
            >
              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.hostBtnText}>Host</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarWrap}>
        <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, venue or city..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Categories Bar (Coffee, Drinks, Dinner, Walk, Movie, Bowling) */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            <TouchableOpacity
              style={[
                styles.catPill,
                !activeCategory && styles.catPillActive,
              ]}
              onPress={() => setActiveCategory(null)}
            >
              <Text style={[styles.catEmoji]}>🌟</Text>
              <Text
                style={[
                  styles.catLabel,
                  !activeCategory && styles.catLabelActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {CATEGORIES.map((cat) => {
              const selected = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catPill,
                    { backgroundColor: cat.bg },
                    selected && styles.catPillSelected,
                  ]}
                  onPress={() =>
                    setActiveCategory(selected ? null : cat.id)
                  }
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.catLabel,
                      { color: cat.color },
                      selected && styles.catLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Basic Quick Filters Bar (All, Today, This Weekend, Free, Coffee, Drinks) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFilterScroll}
        >
          {QUICK_FILTERS.map((filter) => {
            const active = activeQuickFilter === filter;
            return (
              <Pressable
                key={filter}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveQuickFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Events Feed Section */}
        <View style={styles.feedHeaderRow}>
          <Text style={styles.feedTitle}>
            Events in {selectedCity} ({filteredEvents.length})
          </Text>
        </View>

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎪</Text>
            <Text style={styles.emptyTitle}>No Events Found</Text>
            <Text style={styles.emptySub}>
              Be the first to host an event in {selectedCity}!
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyCtaText}>+ Host Event Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.eventsGrid}>
            {filteredEvents.map((evt, index) => {
              const isJoined = evt.joinedUserIds.includes(currentUserId);
              const spotsLeft = Math.max(0, evt.maxParticipants - evt.joinedCount);

              return (
                <Animated.View
                  key={evt.id}
                  entering={FadeInDown.delay(index * 60).duration(350)}
                  style={styles.eventCard}
                >
                  <Pressable onPress={() => setSelectedEvent(evt)}>
                    {/* Cover Image & Badges */}
                    <View style={styles.cardImageWrap}>
                      <Image source={{ uri: evt.coverImage }} style={styles.cardImage} />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.65)"]}
                        style={styles.imageGradient}
                      />

                      {/* Category Badge */}
                      <View style={styles.cardCatBadge}>
                        <Text style={styles.cardCatText}>
                          {evt.categoryEmoji} {evt.category}
                        </Text>
                      </View>

                      {/* Free / Paid Tag */}
                      <View
                        style={[
                          styles.priceBadge,
                          evt.isFree ? styles.priceBadgeFree : styles.priceBadgePaid,
                        ]}
                      >
                        <Text style={styles.priceBadgeText}>
                          {evt.isFree ? "FREE" : `₹${evt.ticketPrice}`}
                        </Text>
                      </View>
                    </View>

                    {/* Card Content Body */}
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {evt.title}
                      </Text>

                      {/* Date & Time */}
                      <View style={styles.infoRow}>
                        <Ionicons name="time" size={13} color="#7C3AED" />
                        <Text style={styles.infoText}>{evt.dateLabel}</Text>
                      </View>

                      {/* Location & Distance */}
                      <View style={styles.infoRow}>
                        <Ionicons name="location" size={13} color="#EC4899" />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {evt.venue} · {evt.distance}
                        </Text>
                      </View>

                      {/* Footer Row: Spots Left & Join Action */}
                      <View style={styles.cardFooter}>
                        <View style={styles.spotsWrap}>
                          <Ionicons name="people" size={13} color="#64748B" />
                          <Text style={styles.spotsText}>
                            {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.cardJoinBtn,
                            isJoined && styles.cardJoinBtnJoined,
                          ]}
                          onPress={() => handleJoinEvent(evt.id)}
                        >
                          <Text
                            style={[
                              styles.cardJoinBtnText,
                              isJoined && styles.cardJoinBtnTextJoined,
                            ]}
                          >
                            {isJoined ? "Joined ✓" : "Join"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom TabBar */}
      <TabBar dark={false} />

      {/* ----------------- MODAL 1: CITY SELECTOR MODAL ----------------- */}
      <Modal visible={showCityPicker} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowCityPicker(false)} />
          <Animated.View entering={ZoomIn.duration(200)} style={styles.cityModalCard}>
            <Text style={styles.modalTitle}>Select Your City 📍</Text>
            <View style={styles.citiesGrid}>
              {CITIES.map((city) => (
                <Pressable
                  key={city}
                  style={[
                    styles.cityBtn,
                    selectedCity === city && styles.cityBtnActive,
                  ]}
                  onPress={() => {
                    setSelectedCity(city);
                    setShowCityPicker(false);
                    showToast(`📍 City switched to ${city}`);
                  }}
                >
                  <Text
                    style={[
                      styles.cityBtnText,
                      selectedCity === city && styles.cityBtnTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ----------------- MODAL 2: EVENT DETAILS MODAL ----------------- */}
      <Modal visible={!!selectedEvent} animationType="slide" transparent>
        {selectedEvent && (
          <View style={styles.modalBackdrop}>
            <View style={styles.detailsModalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image Header */}
                <View style={styles.detailsCoverWrap}>
                  <Image source={{ uri: selectedEvent.coverImage }} style={styles.detailsCoverImage} />
                  <LinearGradient
                    colors={["rgba(0,0,0,0.5)", "transparent", "rgba(0,0,0,0.7)"]}
                    style={StyleSheet.absoluteFill}
                  />

                  <Pressable
                    style={styles.detailsCloseBtn}
                    onPress={() => setSelectedEvent(null)}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </Pressable>

                  <View style={styles.detailsCoverBadgeRow}>
                    <View style={styles.detailsCatPill}>
                      <Text style={styles.detailsCatPillText}>
                        {selectedEvent.categoryEmoji} {selectedEvent.category}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.priceBadge,
                        selectedEvent.isFree
                          ? styles.priceBadgeFree
                          : styles.priceBadgePaid,
                      ]}
                    >
                      <Text style={styles.priceBadgeText}>
                        {selectedEvent.isFree
                          ? "FREE"
                          : `₹${selectedEvent.ticketPrice}`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Body Content */}
                <View style={styles.detailsBody}>
                  <Text style={styles.detailsTitle}>{selectedEvent.title}</Text>

                  {/* Host Info */}
                  <View style={styles.hostRow}>
                    <Image
                      source={{ uri: selectedEvent.hostAvatar }}
                      style={styles.hostAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Text style={styles.hostName}>{selectedEvent.hostName}</Text>
                        {selectedEvent.isHostVerified && (
                          <Ionicons name="checkmark-circle" size={14} color="#7C3AED" />
                        )}
                      </View>
                      <Text style={styles.hostSub}>Event Host</Text>
                    </View>
                  </View>

                  <View style={styles.detailsDivider} />

                  {/* Date & Time Info Card */}
                  <View style={styles.detailsCardBox}>
                    <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
                    <View>
                      <Text style={styles.detailsCardBoxTitle}>Date & Time</Text>
                      <Text style={styles.detailsCardBoxSub}>{selectedEvent.dateLabel}</Text>
                    </View>
                  </View>

                  {/* Venue & Google Maps Link */}
                  <View style={styles.detailsCardBox}>
                    <Ionicons name="location-outline" size={20} color="#EC4899" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailsCardBoxTitle}>Venue & Location</Text>
                      <Text style={styles.detailsCardBoxSub}>{selectedEvent.venue}</Text>
                      {selectedEvent.googleMapsUrl && (
                        <Pressable
                          style={styles.mapLinkBtn}
                          onPress={() => Linking.openURL(selectedEvent.googleMapsUrl!)}
                        >
                          <Ionicons name="map" size={14} color="#7C3AED" />
                          <Text style={styles.mapLinkBtnText}>View on Google Maps ↗</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.sectionHeading}>About Event</Text>
                  <Text style={styles.detailsDesc}>{selectedEvent.description}</Text>

                  {/* Participants Row */}
                  <Text style={styles.sectionHeading}>
                    Participants ({selectedEvent.joinedCount} / {selectedEvent.maxParticipants})
                  </Text>
                  <View style={styles.participantsCard}>
                    <Ionicons name="people" size={18} color="#7C3AED" />
                    <Text style={styles.participantsText}>
                      {selectedEvent.joinedCount} people attending
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Sticky Action Bar */}
              <View style={styles.detailsStickyFooter}>
                <TouchableOpacity
                  style={[
                    styles.detailsJoinBtn,
                    selectedEvent.joinedUserIds.includes(currentUserId) &&
                      styles.detailsJoinBtnJoined,
                  ]}
                  onPress={() => handleJoinEvent(selectedEvent.id)}
                >
                  <Text style={styles.detailsJoinBtnText}>
                    {selectedEvent.joinedUserIds.includes(currentUserId)
                      ? "Joined Event ✓"
                      : "Join Event Now"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* ----------------- MODAL 3: CREATE EVENT (HOST) MODAL ----------------- */}
      <Modal visible={showCreateModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FD" }}>
          <View style={styles.createModalHeader}>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#18181B" />
            </Pressable>
            <Text style={styles.createModalTitle}>Host an Event 🎪</Text>
            <Pressable onPress={handleCreateEventSubmit}>
              <Text style={styles.createModalSaveText}>Publish</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.createFormScroll}>
            {/* Title Input */}
            <Text style={styles.formLabel}>Event Title *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Sunset Specialty Coffee & Chill ☕"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            {/* Category Selector */}
            <Text style={styles.formLabel}>Category *</Text>
            <View style={styles.formCategoryGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.formCatChip,
                    formCategory === cat.id && styles.formCatChipActive,
                  ]}
                  onPress={() => setFormCategory(cat.id)}
                >
                  <Text>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.formCatChipText,
                      formCategory === cat.id && styles.formCatChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Venue Input */}
            <Text style={styles.formLabel}>Venue / Location *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Cafe Connect, Dharampeth"
              value={formVenue}
              onChangeText={setFormVenue}
            />

            {/* Date & Time Row */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Today / Tomorrow"
                  value={formDate}
                  onChangeText={setFormDate}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="19:00"
                  value={formTime}
                  onChangeText={setFormTime}
                />
              </View>
            </View>

            {/* Max Participants Input */}
            <Text style={styles.formLabel}>Maximum Participants</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 8"
              keyboardType="number-pad"
              value={formMaxParticipants}
              onChangeText={setFormMaxParticipants}
            />

            {/* Free / Paid Toggle */}
            <Text style={styles.formLabel}>Event Type</Text>
            <View style={styles.freePaidToggleRow}>
              <Pressable
                style={[
                  styles.toggleBtn,
                  formIsFree && styles.toggleBtnActive,
                ]}
                onPress={() => setFormIsFree(true)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    formIsFree && styles.toggleBtnTextActive,
                  ]}
                >
                  Free Event
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.toggleBtn,
                  !formIsFree && styles.toggleBtnActive,
                ]}
                onPress={() => setFormIsFree(false)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    !formIsFree && styles.toggleBtnTextActive,
                  ]}
                >
                  Paid Ticket
                </Text>
              </Pressable>
            </View>

            {!formIsFree && (
              <View>
                <Text style={styles.formLabel}>Ticket Price (₹)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="150"
                  keyboardType="number-pad"
                  value={formTicketPrice}
                  onChangeText={setFormTicketPrice}
                />
              </View>
            )}

            {/* Description */}
            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.formInput, { height: 90, textAlignVertical: "top" }]}
              multiline
              placeholder="Tell people what this event is about..."
              value={formDescription}
              onChangeText={setFormDescription}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitEventBtn}
              onPress={handleCreateEventSubmit}
            >
              <Text style={styles.submitEventBtnText}>Publish Event Now</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ----------------- MODAL 4: MY EVENTS MODAL (Upcoming & Joined Tabs) ----------------- */}
      <Modal visible={showMyEventsModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FD" }}>
          <View style={styles.createModalHeader}>
            <Pressable onPress={() => setShowMyEventsModal(false)}>
              <Ionicons name="close" size={24} color="#18181B" />
            </Pressable>
            <Text style={styles.createModalTitle}>My Events 📅</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* 2 Tabs: Upcoming (Created) vs Joined */}
          <View style={styles.myEventsTabsTrack}>
            <Pressable
              style={[
                styles.myEventsTabBtn,
                myEventsTab === "Joined" && styles.myEventsTabBtnActive,
              ]}
              onPress={() => setMyEventsTab("Joined")}
            >
              <Text
                style={[
                  styles.myEventsTabText,
                  myEventsTab === "Joined" && styles.myEventsTabTextActive,
                ]}
              >
                Joined ({joinedEvents.length})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.myEventsTabBtn,
                myEventsTab === "Upcoming" && styles.myEventsTabBtnActive,
              ]}
              onPress={() => setMyEventsTab("Upcoming")}
            >
              <Text
                style={[
                  styles.myEventsTabText,
                  myEventsTab === "Upcoming" && styles.myEventsTabTextActive,
                ]}
              >
                My Hosted ({hostedEvents.length})
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {(myEventsTab === "Joined" ? joinedEvents : hostedEvents).length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyTitle}>
                  No {myEventsTab} Events
                </Text>
                <Text style={styles.emptySub}>
                  {myEventsTab === "Joined"
                    ? "Browse events in your city and tap Join!"
                    : "Create an event and host awesome people!"}
                </Text>
              </View>
            ) : (
              (myEventsTab === "Joined" ? joinedEvents : hostedEvents).map((evt) => (
                <Pressable
                  key={evt.id}
                  style={styles.myEventItemCard}
                  onPress={() => {
                    setShowMyEventsModal(false);
                    setSelectedEvent(evt);
                  }}
                >
                  <Image source={{ uri: evt.coverImage }} style={styles.myEventItemImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.myEventItemTitle} numberOfLines={1}>
                      {evt.title}
                    </Text>
                    <Text style={styles.myEventItemSub}>{evt.dateLabel}</Text>
                    <Text style={styles.myEventItemSub}>{evt.venue}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </Pressable>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },

  toastWrap: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  cityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },
  cityName: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  myEventsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  myEventsBtnText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  hostBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  hostBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },

  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#18181B",
  },

  sectionWrap: {
    marginTop: 8,
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    marginHorizontal: 16,
    marginBottom: 8,
  },

  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  catPillActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  catPillSelected: {
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  catEmoji: {
    fontSize: 14,
  },
  catLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  catLabelActive: {
    color: "#FFFFFF",
  },
  catLabelSelected: {
    fontFamily: VibeFonts.extraBold,
  },

  quickFilterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#18181B",
    borderColor: "#18181B",
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },

  feedHeaderRow: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  eventsGrid: {
    paddingHorizontal: 16,
    gap: 14,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImageWrap: {
    height: 140,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardCatBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardCatText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  priceBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceBadgeFree: {
    backgroundColor: "#10B981",
  },
  priceBadgePaid: {
    backgroundColor: "#F59E0B",
  },
  priceBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },

  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  spotsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spotsText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  cardJoinBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
  },
  cardJoinBtnJoined: {
    backgroundColor: "#DCFCE7",
  },
  cardJoinBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  cardJoinBtnTextJoined: {
    color: "#15803D",
  },

  emptyCard: {
    marginHorizontal: 16,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyEmoji: { fontSize: 36, marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontFamily: VibeFonts.bold, color: "#18181B" },
  emptySub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  emptyCta: {
    marginTop: 12,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
  },
  emptyCtaText: { color: "#FFF", fontFamily: VibeFonts.bold, fontSize: 12 },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  cityModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    textAlign: "center",
  },
  citiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  cityBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#F8F9FD",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cityBtnActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  cityBtnText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  cityBtnTextActive: {
    color: "#FFFFFF",
  },

  // Event Details Modal
  detailsModalCard: {
    height: "90%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  detailsCoverWrap: {
    height: 200,
    position: "relative",
  },
  detailsCoverImage: {
    width: "100%",
    height: "100%",
  },
  detailsCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsCoverBadgeRow: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsCatPill: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsCatPillText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },

  detailsBody: {
    padding: 16,
    gap: 12,
  },
  detailsTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    lineHeight: 26,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  hostName: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  hostSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  detailsDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  detailsCardBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#F8F9FD",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailsCardBoxTitle: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  detailsCardBoxSub: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    marginTop: 2,
  },
  mapLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  mapLinkBtnText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  detailsDesc: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#334155",
    lineHeight: 20,
  },
  participantsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#F3E8FF",
    borderRadius: 16,
  },
  participantsText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },

  detailsStickyFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  detailsJoinBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  detailsJoinBtnJoined: {
    backgroundColor: "#10B981",
  },
  detailsJoinBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
  },

  // Create Event Form Modal
  createModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  createModalTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  createModalSaveText: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  createFormScroll: {
    padding: 16,
    gap: 12,
  },
  formLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#475569",
    marginBottom: -4,
  },
  formInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#18181B",
  },
  formCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formCatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  formCatChipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  formCatChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  formCatChipTextActive: {
    color: "#FFFFFF",
  },
  freePaidToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleBtnActive: {
    backgroundColor: "#18181B",
    borderColor: "#18181B",
  },
  toggleBtnText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  toggleBtnTextActive: {
    color: "#FFFFFF",
  },
  submitEventBtn: {
    marginTop: 10,
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  submitEventBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },

  // My Events Modal
  myEventsTabsTrack: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    padding: 3,
  },
  myEventsTabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 13,
  },
  myEventsTabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  myEventsTabText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  myEventsTabTextActive: {
    color: "#7C3AED",
  },

  myEventItemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  myEventItemImage: {
    width: 54,
    height: 54,
    borderRadius: 14,
  },
  myEventItemTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
  },
  myEventItemSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 2,
  },
});
