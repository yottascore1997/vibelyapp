import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import GlassCard from "../components/vibe/GlassCard";
import TabBar from "../components/TabBar";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";

const { width } = Dimensions.get("window");

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

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "1",
    title: "Rooftop Sunset Hangout 🌅",
    category: "Chill",
    location: "Empress City Rooftop, Nagpur",
    timeLabel: "Today, 6:00 PM",
    goingCount: 12,
    commentCount: 8,
    creatorName: "Rohan",
    creatorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    creatorTimeAgo: "2h ago",
    isVerified: true,
    tags: ["Music", "Chill", "Meet New People"],
    description: "Chill vibes, good music, amazing people & a perfect sunset! 🌅",
    imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=300",
    isFree: true,
  },
  {
    id: "2",
    title: "Night Football Match ⚽",
    category: "Sports",
    location: "Dharampeth Ground, Nagpur",
    timeLabel: "Today, 8:30 PM",
    goingCount: 18,
    commentCount: 4,
    creatorName: "Karan",
    creatorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
    creatorTimeAgo: "3h ago",
    isVerified: true,
    tags: ["Sports", "Fitness", "Teamplay"],
    description: "Let's play, have fun & stay fit together! All are welcome. 💪",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=300",
    isFree: true,
  },
  {
    id: "3",
    title: "Coffee & Connect ☕",
    category: "Food",
    location: "Cafe Tryst, Civil Lines, Nagpur",
    timeLabel: "Tomorrow, 11:00 AM",
    goingCount: 9,
    commentCount: 3,
    creatorName: "Priya",
    creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    creatorTimeAgo: "5h ago",
    isVerified: true,
    tags: ["Coffee", "Chat", "Network"],
    description: "Good coffee, good conversations & great people! Let's connect. ✨",
    imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300",
    isFree: true,
  },
  {
    id: "4",
    title: "Open Mic Night 🎤",
    category: "Music",
    location: "The Creative Cafe, Nagpur",
    timeLabel: "18 May, 7:00 PM",
    goingCount: 14,
    commentCount: 5,
    creatorName: "Rohit",
    creatorAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100",
    creatorTimeAgo: "6h ago",
    isVerified: true,
    tags: ["Music", "OpenMic", "Social"],
    description: "Sing, share, write, shine. A gorgeous space to vibe together! ✨",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300",
    isFree: true,
  },
];

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
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubTab, setSelectedSubTab] = useState<"Popular" | "Recent" | "Following">("Popular");
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleCreateEvent = () => {
    if (!newTitle.trim() || !newLocation.trim() || !newDesc.trim()) {
      alert("Please fill in all details!");
      return;
    }

    const newEvent: EventItem = {
      id: `${Date.now()}`,
      title: newTitle,
      category: "Chill",
      location: newLocation,
      timeLabel: `${startDate}, ${newTime}`,
      goingCount: 1,
      commentCount: 0,
      creatorName: "Mayur",
      creatorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      creatorTimeAgo: "Just now",
      isVerified: true,
      tags: [genderSelection, eventType === "Paid" ? `Paid: ${currency} ${costPerTicket}` : "Free Hang"],
      description: newDesc,
      imageUrl: coverPhoto || "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80",
      isFree: eventType === "Free",
    };

    setEvents([newEvent, ...events]);
    
    // Reset modal state
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
      <StatusBar style="dark" />
 
      {/* Background glowing orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
 
      {/* City Landmarks Header Backdrop */}
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80" }} // Faded Nagpur structure dome backdrop
        style={styles.headerBackdrop}
        imageStyle={styles.headerBackdropImage}
      >
        <LinearGradient
          colors={["rgba(247,245,252,0.15)", "rgba(247,245,252,0.45)", "#F7F5FC"]}
          style={StyleSheet.absoluteFillObject}
        />
 
        <SafeAreaView style={styles.safeHeader} edges={["top"]}>
          {/* Top Bar with actions */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backArrowBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#1F1A3A" />
            </TouchableOpacity>
 
            <View style={styles.topRightActions}>
              <TouchableOpacity style={styles.bellBtn}>
                <Ionicons name="notifications" size={18} color="#1F1A3A" />
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>3</Text>
                </View>
              </TouchableOpacity>
 
              <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowCreateModal(true)}>
                <Ionicons name="options-outline" size={16} color="#1F1A3A" />
              </TouchableOpacity>
            </View>
          </View>
 
          {/* Hey Mayur Greeting */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingText}>Hey Mayur! 👋</Text>
          </View>
 
          {/* Heading Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.gradientHeadingText}>Events in My City</Text>
            <Text style={styles.subtextCaption}>Discover • Connect • Vibe</Text>
          </View>
 
          {/* Search bar row */}
          <View style={styles.searchRow}>
            {/* Location selector side-by-side with Search box */}
            <View style={styles.locationSearchPill}>
              <Ionicons name="location" size={12} color="#C084FC" />
              <Text style={styles.locationText}>Nagpur</Text>
              <Ionicons name="chevron-down" size={10} color="rgba(31, 26, 58, 0.4)" />
            </View>
 
            <View style={styles.searchBox}>
              <Ionicons name="search" size={14} color="rgba(31, 26, 58, 0.4)" />
              <TextInput
                placeholder="Search events, people..."
                placeholderTextColor="rgba(31, 26, 58, 0.4)"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterGearBtn} onPress={() => setShowCreateModal(true)}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Main scrolling section container */}
      <View style={{ flex: 1 }}>

          {/* Horizontal scroll tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll} contentContainerStyle={styles.tagsContent}>
            {MAIN_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.tagChip, activeFilter === f.id && styles.tagChipActive]}
                onPress={() => setActiveFilter(f.id)}
              >
                {activeFilter === f.id ? (
                  <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.tagChipGrad}>
                    <Ionicons name={f.icon as any} size={12} color="#fff" />
                    <Text style={styles.tagChipTextActive}>{f.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tagChipInner}>
                    <Ionicons name={f.icon as any} size={12} color={f.id === "Free Hang" ? "#22C55E" : "rgba(31, 26, 58, 0.4)"} />
                    <Text style={[styles.tagChipText, f.id === "Free Hang" && { color: "#22C55E" }]}>{f.label}</Text>
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
                  {isActive && <Ionicons name={iconMap[tab] as any} size={13} color="#FF4B81" style={{ marginRight: 4 }} />}
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
          {filteredEvents.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleEventPress(item)}
              activeOpacity={0.92}
            >
              <GlassCard style={styles.eventCard} lightMode={true}>
              <View style={styles.cardMainRow}>
                
                {/* Left Thumbnail visual with badges overlay */}
                <View style={styles.cardLeftThumb}>
                  <Image source={{ uri: item.imageUrl }} style={styles.thumbImg} />
                  
                  {/* Top-Left green FREE HANG badge */}
                  <View style={styles.freeHangBadge}>
                    <Text style={styles.freeHangText}>FREE HANG</Text>
                  </View>

                  {/* Bottom counters overlay */}
                  <View style={styles.countersRow}>
                    <View style={styles.counterItem}>
                      <Ionicons name="people" size={10} color="#fff" />
                      <Text style={styles.counterText}>{item.goingCount} Going</Text>
                    </View>
                    <View style={styles.counterItem}>
                      <Ionicons name="chatbubble" size={10} color="#fff" />
                      <Text style={styles.counterText}>{item.commentCount}</Text>
                    </View>
                  </View>
                </View>

                {/* Right Details content */}
                <View style={styles.cardRightDetails}>
                  {/* Creator row */}
                  <View style={styles.creatorRow}>
                    <Image source={{ uri: item.creatorAvatar }} style={styles.creatorAvatar} />
                    <View style={styles.creatorMeta}>
                      <View style={styles.creatorNameRow}>
                        <Text style={styles.creatorName}>{item.creatorName}</Text>
                        {item.isVerified && (
                          <Ionicons name="checkmark-circle" size={12} color="#8A56FF" style={{ marginLeft: 3 }} />
                        )}
                      </View>
                      <Text style={styles.creatorTimeAgo}>{item.creatorTimeAgo} • 🌐</Text>
                    </View>

                    <View style={styles.creatorActions}>
                      <TouchableOpacity style={styles.cardActionIcon}>
                        <Ionicons name="bookmark-outline" size={16} color="rgba(31, 26, 58, 0.4)" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cardActionIcon}>
                        <Ionicons name="ellipsis-vertical" size={16} color="rgba(31, 26, 58, 0.4)" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Title & Emojis */}
                  <Text style={styles.eventTitle}>{item.title}</Text>

                  {/* Location with Pin */}
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color="#C084FC" />
                    <Text style={styles.locationVal} numberOfLines={1}>{item.location}</Text>
                  </View>

                  {/* Tags row */}
                  <View style={styles.tagsCapsulesRow}>
                    {item.tags.map((tag, idx) => (
                      <View key={idx} style={styles.tagCapsule}>
                        <Text style={styles.tagCapsuleText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Tagline Description */}
                  <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
                </View>
              </View>

              {/* Card Footer row */}
              <View style={styles.cardFooter}>
                <View style={styles.footerCapsule}>
                  <Ionicons name="calendar-outline" size={12} color="#C084FC" />
                  <Text style={styles.footerCapsuleText}>{item.timeLabel}</Text>
                </View>

                <View style={styles.footerCapsule}>
                  <Ionicons name="pricetag-outline" size={12} color="#22C55E" />
                  <Text style={[styles.footerCapsuleText, { color: "#22C55E" }]}>Free Event</Text>
                </View>

                <TouchableOpacity style={styles.interestBtn}>
                  <LinearGradient colors={["#8A56FF", "#FF4B81"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.interestGrad}>
                    <Text style={styles.interestBtnText}>I'm Interested</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              </GlassCard>
            </TouchableOpacity>
          ))}

          {/* Boost Your Event Promo Banner Footer */}
          <LinearGradient
            colors={["#130D2E", "#2A1854", "#0C0620"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.boostBanner, { borderWidth: 1.5, borderColor: "rgba(138, 86, 255, 0.4)", shadowColor: "#8A56FF", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 }]}
          >
            <View style={styles.boostGrad}>
              <View style={styles.boostLeft}>
                <View style={styles.crownCircle}>
                  <Ionicons name="gift-outline" size={16} color="#FFD700" />
                </View>
                <View style={styles.boostTextCol}>
                  <Text style={styles.boostTitle}>Boost Your Event</Text>
                  <Text style={styles.boostSubtitle}>Get more people to see & join your event.</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.boostBtn}>
                <LinearGradient colors={["#FFFFFF", "#F3E8FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.boostBtnGrad}>
                  <Text style={[styles.boostBtnText, { color: "#2A1854" }]}>Boost Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
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
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F5FC" },
  safe: { flex: 1 },
  orb: { position: "absolute", borderRadius: 999 },
  orb1: { width: 220, height: 220, top: -60, right: -70, backgroundColor: "rgba(138,86,255,0.12)" },
  orb2: { width: 200, height: 200, bottom: 80, left: -80, backgroundColor: "rgba(255,75,129,0.08)" },
 
  // City Backdrop Header Area
  headerBackdrop: { width: "100%", overflow: "hidden" },
  headerBackdropImage: { opacity: 0.25, resizeMode: "cover" }, // Lower opacity so it blends perfectly in light mode!
  safeHeader: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.xs },
  backArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  greetingBlock: { marginTop: Spacing.md },
  greetingText: { color: "#1F1A3A", fontSize: 16, fontFamily: VibeFonts.bold, letterSpacing: -0.3 },
  topRightActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { marginTop: Spacing.md, gap: 2 },
  gradientHeadingText: { fontSize: 32, fontFamily: VibeFonts.extraBold, color: "#1F1A3A", letterSpacing: -0.8 },
  subtextCaption: { fontSize: 12, fontFamily: VibeFonts.bold, color: "rgba(31, 26, 58, 0.6)", letterSpacing: -0.2 },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF4B81",
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: { color: "#fff", fontSize: 8, fontFamily: VibeFonts.bold },

  // Search & Filter Box
  searchContainer: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xs },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: Spacing.md },
  locationSearchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  locationText: { color: "#1F1A3A", fontSize: 11, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  searchInput: { flex: 1, color: "#1F1A3A", fontSize: 12, fontFamily: VibeFonts.medium, padding: 0 },
  filterGearBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#8A56FF",
    borderWidth: 1,
    borderColor: "rgba(138, 86, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
 
  // Horizontal Tags scroll
  tagsScroll: { marginTop: Spacing.sm, maxHeight: 52 },
  tagsContent: { gap: Spacing.xs, paddingRight: Spacing.xl, paddingVertical: 4, alignItems: "center" },
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
    backgroundColor: "rgba(31, 26, 58, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(31, 26, 58, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagChipText: { color: "rgba(31, 26, 58, 0.6)", fontSize: 11, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  tagChipTextActive: { color: "#fff", fontSize: 11, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  tagChipActive: { borderWidth: 1, borderColor: "rgba(138, 86, 255, 0.15)" },
 
  // Sub Tabs (Popular, Recent, Following)
  subTabsRow: {
    flexDirection: "row",
    marginTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(31, 26, 58, 0.08)",
  },
  subTabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  subTabItemActive: {},
  subTabLabelRow: { flexDirection: "row", alignItems: "center" },
  subTabText: { color: "rgba(31, 26, 58, 0.45)", fontSize: 12, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  subTabTextActive: { color: "#1F1A3A" },
  subTabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    width: 60,
    backgroundColor: "#FF4B81",
    borderRadius: 1,
  },
 
  // Events Feed List Scroll
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 100 },
  eventCard: { padding: Spacing.md, marginBottom: Spacing.md },
  cardMainRow: { flexDirection: "row", gap: Spacing.md },
  
  // Left side image details
  cardLeftThumb: { width: 110, height: 140, borderRadius: Radius.lg, overflow: "hidden", position: "relative" },
  thumbImg: { width: "100%", height: "100%", resizeMode: "cover" },
  freeHangBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(34,197,94,0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  freeHangText: { color: "#fff", fontSize: 7, fontFamily: VibeFonts.bold },
  countersRow: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  counterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(5,5,8,0.75)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  counterText: { color: "#fff", fontSize: 7, fontFamily: VibeFonts.bold },
 
  // Right details elements
  cardRightDetails: { flex: 1, gap: 3 },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  creatorAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "rgba(31,26,58,0.15)" },
  creatorMeta: { flex: 1 },
  creatorNameRow: { flexDirection: "row", alignItems: "center" },
  creatorName: { color: "#1F1A3A", fontSize: 11, fontFamily: VibeFonts.bold },
  creatorTimeAgo: { color: "rgba(31, 26, 58, 0.6)", fontSize: 8, fontFamily: VibeFonts.medium },
  creatorActions: { flexDirection: "row", gap: 4 },
  cardActionIcon: { padding: 2 },
  eventTitle: { fontSize: 14, fontFamily: VibeFonts.extraBold, color: "#1F1A3A", marginTop: 2, letterSpacing: -0.3 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationVal: { color: "rgba(31, 26, 58, 0.6)", fontSize: 10, fontFamily: VibeFonts.medium, flex: 1 },
  tagsCapsulesRow: { flexDirection: "row", gap: 4, flexWrap: "wrap", marginVertical: 2 },
  tagCapsule: {
    backgroundColor: "rgba(138,86,255,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(138,86,255,0.25)",
  },
  tagCapsuleText: { color: "#C084FC", fontSize: 8, fontFamily: VibeFonts.bold },
  eventDesc: { color: "rgba(31, 26, 58, 0.7)", fontSize: 10, fontFamily: VibeFonts.medium, lineHeight: 14 },
 
  // Card Bottom Row
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(31, 26, 58, 0.08)",
  },
  footerCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(31, 26, 58, 0.03)",
    borderWidth: 0.5,
    borderColor: "rgba(31, 26, 58, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  footerCapsuleText: { color: "rgba(31, 26, 58, 0.6)", fontSize: 9, fontFamily: VibeFonts.bold },
  interestBtn: { borderRadius: Radius.full, overflow: "hidden" },
  interestGrad: { paddingHorizontal: 14, paddingVertical: 8 },
  interestBtnText: { color: "#fff", fontSize: 9, fontFamily: VibeFonts.bold },

  // Boost Your Event banner
  boostBanner: { overflow: "hidden", marginTop: Spacing.md, borderRadius: Radius.lg },
  boostGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    width: "100%",
  },
  boostLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md, flex: 1 },
  crownCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,215,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
  },
  boostTextCol: { flex: 1, gap: 1 },
  boostTitle: { color: "#fff", fontSize: 12, fontFamily: VibeFonts.bold, letterSpacing: -0.2 },
  boostSubtitle: { color: "#D8B4FE", fontSize: 9, fontFamily: VibeFonts.medium },
  boostBtn: { borderRadius: Radius.full, overflow: "hidden" },
  boostBtnGrad: { paddingHorizontal: 12, paddingVertical: 7 },
  boostBtnText: { fontSize: 9, fontFamily: VibeFonts.bold },

  // Modal Sheet Form
  modalOverlay: { flex: 1, backgroundColor: "rgba(31, 26, 58, 0.4)", justifyContent: "flex-end" },
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
