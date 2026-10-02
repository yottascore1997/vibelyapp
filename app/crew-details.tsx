import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  StatusBar,
  Share,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { VibeFonts } from "../constants/vibeTheme";
import { useAuth } from "../context/AuthContext";
import TabBar from "../components/TabBar";
import HomeHeader from "../components/HomeHeader";

const { width: SCREEN_W } = Dimensions.get("window");

// Local Figma Hangora Assets (matching Home page)
const hangoraLogo = require("../assets/home/hangora-logo.png");
const userAvatar = require("../assets/home/user-avatar.png");

const cursiveFont = Platform.select({
  ios: "Snell Roundhand",
  android: "cursive",
  default: "cursive",
});

interface Member {
  id: string;
  name: string;
  avatar: string;
  glowColor: string;
}

const DEFAULT_MEMBERS: Member[] = [
  {
    id: "you",
    name: "You",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    glowColor: "#22D3EE", // Cyan
  },
  {
    id: "riya",
    name: "Riya",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    glowColor: "#EC4899", // Pink
  },
  {
    id: "aman",
    name: "Aman",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    glowColor: "#F59E0B", // Gold
  },
  {
    id: "neha",
    name: "Neha",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
    glowColor: "#A855F7", // Purple
  },
  {
    id: "karan",
    name: "Karan",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    glowColor: "#10B981", // Emerald
  },
];

interface Hangout {
  id: string;
  title: string;
  location: string;
  datetime: string;
  image: string;
  goingCount: number;
  attendees: string[];
}

const HANGOUTS: Hangout[] = [
  {
    id: "hangout-1",
    title: "Lonavala Trip",
    location: "Lonavala",
    datetime: "Sat, 14 Sep · 8:00 AM",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400",
    goingCount: 6,
    attendees: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120",
    ],
  },
  {
    id: "hangout-2",
    title: "Movie Night",
    location: "PVR, Phoenix Mall",
    datetime: "Fri, 20 Sep · 7:30 PM",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400",
    goingCount: 5,
    attendees: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
    ],
  },
];

export default function CrewDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    image?: string;
    description?: string;
    glowColor?: string;
    membersCount?: string;
  }>();

  const crewName = params.name || "College Friends 🎓";
  const crewDescription =
    params.description ||
    (crewName.toLowerCase().includes("college")
      ? "Campus memories, old stories, late night chai & endless hangout plans 🎓"
      : "Your core gang for spontaneous hangouts, late night conversations & weekend plans ✨");
  const crewImage =
    params.image ||
    (crewName.toLowerCase().includes("college")
      ? "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=400&fit=crop"
      : "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop");
  const crewGlowColor = params.glowColor || "#06B6D4";
  const crewMembersCount = params.membersCount || "12";
  const [moreModalVisible, setMoreModalVisible] = useState(false);

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join my crew "${crewName}" on Vibely! Let's plan amazing hangouts together: https://vibely.app/crew/${params.id || "c1"}`,
      });
    } catch {
      // dismissed
    }
  };

  const handleNotificationPress = () => {
    Alert.alert(
      "Notifications",
      "✦ 2 people liked your vibe profile\n✦ New hangout near you: Rooftop Acoustic Live",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070A13" />

      {/* ── TOP HEADER (Home page header) ── */}
      <HomeHeader showBack />

      {/* ── MAIN SCROLLABLE CONTENT ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 95 },
        ]}
      >
        {/* ── CREW PROFILE HERO: Circle me profile + Baju me name + Niche description ── */}
        <Animated.View entering={FadeInDown.duration(320)} style={styles.crewHeroCard}>
          <View style={styles.crewHeroAvatarWrap}>
            <Image
              source={{ uri: crewImage }}
              style={styles.crewHeroAvatar}
              resizeMode="cover"
            />
          </View>

          <View style={styles.crewHeroInfo}>
            <Text style={styles.crewHeroName} numberOfLines={1}>
              {crewName}
            </Text>

            <Text style={styles.crewHeroDescription} numberOfLines={2}>
              {crewDescription}
            </Text>

            <View style={styles.crewMetaPillRow}>
              <View style={styles.crewMetaPill}>
                <View style={styles.crewLiveDot} />
                <Text style={styles.crewMetaPillText}>
                  {crewMembersCount} Members • Active Today
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* 4 Action Cards Row */}
        <Animated.View entering={FadeInDown.delay(60).duration(360)} style={styles.actionsRow}>
          {/* Chat */}
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => router.push("/(tabs)/chats")}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#22D3EE" />
            </View>
            <Text style={styles.actionLabel}>Chat</Text>
          </Pressable>

          {/* Invite */}
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() =>
              router.push({
                pathname: "/invite-friends",
                params: {
                  id: params.id || "c1",
                  name: crewName,
                  code: "abc123",
                  tab: "friends",
                },
              })
            }
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="person-add" size={24} color="#FB7185" />
            </View>
            <Text style={styles.actionLabel}>Invite</Text>
          </Pressable>

          {/* Hangout */}
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => router.push("/create-plan")}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="calendar" size={24} color="#FACC15" />
            </View>
            <Text style={styles.actionLabel}>Hangout</Text>
          </Pressable>

          {/* More */}
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
            onPress={() => setMoreModalVisible(true)}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#C084FC" />
            </View>
            <Text style={styles.actionLabel}>More</Text>
          </Pressable>
        </Animated.View>

        {/* Members Section */}
        <Animated.View entering={FadeInDown.delay(120).duration(380)} style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Members</Text>
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Crew Members",
                  `${DEFAULT_MEMBERS.map((m) => m.name).join(", ")} and 3 more members.`
                )
              }
              hitSlop={8}
            >
              <Text style={styles.seeAllText}>See all →</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.membersScroll}
          >
            {DEFAULT_MEMBERS.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View
                  style={[
                    styles.memberRing,
                    {
                      borderColor: member.glowColor,
                      shadowColor: member.glowColor,
                    },
                  ]}
                >
                  <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
              </View>
            ))}

            {/* +3 Counter Avatar */}
            <View style={styles.memberItem}>
              <View style={[styles.memberRing, styles.plusMoreRing]}>
                <Text style={styles.plusMoreText}>+3</Text>
              </View>
              <Text style={[styles.memberName, { opacity: 0 }]}>More</Text>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Upcoming Hangouts Section */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Upcoming Hangouts</Text>

          <View style={styles.hangoutsList}>
            {HANGOUTS.map((hangout) => (
              <Pressable
                key={hangout.id}
                style={({ pressed }) => [
                  styles.hangoutCard,
                  pressed && styles.hangoutCardPressed,
                ]}
                onPress={() => router.push("/create-plan")}
              >
                <Image source={{ uri: hangout.image }} style={styles.hangoutThumb} />

                <View style={styles.hangoutInfo}>
                  <Text style={styles.hangoutTitle}>{hangout.title}</Text>

                  {/* Location */}
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color="#10B981" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {hangout.location}
                    </Text>
                  </View>

                  {/* Date Time */}
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color="#10B981" />
                    <Text style={styles.metaText}>{hangout.datetime}</Text>
                  </View>

                  {/* Attendees */}
                  <View style={styles.attendeesRow}>
                    <View style={styles.attendeeStack}>
                      {hangout.attendees.map((uri, idx) => (
                        <Image
                          key={idx}
                          source={{ uri }}
                          style={[
                            styles.attendeeAvatar,
                            { marginLeft: idx === 0 ? 0 : -6, zIndex: 5 - idx },
                          ]}
                        />
                      ))}
                      <View style={styles.attendeePlusPill}>
                        <Text style={styles.attendeePlusText}>
                          +{hangout.goingCount - hangout.attendees.length}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.goingText}>{hangout.goingCount} going</Text>
                  </View>
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Bottom Signature Doodle & Wave */}
        <View style={styles.bottomSignatureSection}>
          <View style={styles.waveLineContainer}>
            <LinearGradient
              colors={["#22D3EE", "#EC4899", "#FACC15", "#D4F72C"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.waveGradientLine}
            />
          </View>

          <View style={styles.cursiveDoodleBlock}>
            <Text style={[styles.cursiveDoodleLine, { fontFamily: cursiveFont }]}>Good</Text>
            <Text style={[styles.cursiveDoodleLine, { fontFamily: cursiveFont }]}>People</Text>
            <Text style={[styles.cursiveDoodleLine, { fontFamily: cursiveFont }]}>Brighter</Text>
            <View style={styles.doodleHeartRow}>
              <Text style={[styles.cursiveDoodleLine, { fontFamily: cursiveFont }]}>
                Nights
              </Text>
              <Text style={[styles.cursiveHeart, { fontFamily: cursiveFont }]}> ♡</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── BOTTOM NAV (TabBar) ── */}
      <TabBar dark />

      {/* More Options Modal */}
      <Modal
        visible={moreModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMoreModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setMoreModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Crew Settings</Text>
              <Pressable
                onPress={() => setMoreModalVisible(false)}
                hitSlop={8}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setMoreModalVisible(false);
                router.push({
                  pathname: "/invite-friends",
                  params: {
                    id: params.id || "c1",
                    name: crewName,
                    code: "abc123",
                  },
                });
              }}
            >
              <Ionicons name="share-social-outline" size={20} color="#22D3EE" />
              <Text style={styles.modalOptionText}>Share Crew Invite Link & QR</Text>
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setMoreModalVisible(false);
                router.push("/create-plan");
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#D4F72C" />
              <Text style={styles.modalOptionText}>Create New Hangout Plan</Text>
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setMoreModalVisible(false);
                Alert.alert("Notifications", "Crew notifications are turned ON.");
              }}
            >
              <Ionicons name="notifications-outline" size={20} color="#FACC15" />
              <Text style={styles.modalOptionText}>Mute / Unmute Notifications</Text>
            </Pressable>

            <Pressable
              style={[styles.modalOption, { borderBottomWidth: 0 }]}
              onPress={() => {
                setMoreModalVisible(false);
                Alert.alert("Leave Crew", "Are you sure you want to leave this crew?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Leave",
                    style: "destructive",
                    onPress: () => router.back(),
                  },
                ]);
              }}
            >
              <Ionicons name="exit-outline" size={20} color="#EF4444" />
              <Text style={[styles.modalOptionText, { color: "#EF4444" }]}>Leave Crew</Text>
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

  // ── Header (Matching Home page header nav) ──
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#070A13",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerTextCol: {
    justifyContent: "center",
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerTitleHighlight: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#D4F72C",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadgeDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FF2A55",
    borderWidth: 1.5,
    borderColor: "#070A13",
  },
  avatarWrap: {
    position: "relative",
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#070A13",
  },

  scrollContent: {
    paddingTop: 8,
  },
  crewHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: "#0D1424",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    gap: 14,
  },
  crewHeroAvatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#131C33",
  },
  crewHeroAvatar: {
    width: "100%",
    height: "100%",
  },
  crewHeroInfo: {
    flex: 1,
    gap: 3,
  },
  crewHeroName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.3,
  },
  crewHeroDescription: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    lineHeight: 16,
    marginTop: 1,
    marginBottom: 4,
  },
  crewMetaPillRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  crewMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.28)",
  },
  crewLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D4F72C",
  },
  crewMetaPillText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "#0D1424",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionCardPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: "#131C33",
  },
  actionIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: "#E2E8F0",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  sectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  seeAllText: {
    color: "#22D3EE",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    marginBottom: 14,
  },
  membersScroll: {
    gap: 14,
    paddingRight: 8,
  },
  memberItem: {
    alignItems: "center",
    gap: 6,
  },
  memberRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#131C33",
  },
  memberName: {
    color: "#E2E8F0",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    textAlign: "center",
  },
  plusMoreRing: {
    borderColor: "#22D3EE",
    backgroundColor: "#0D1424",
  },
  plusMoreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
  },
  hangoutsList: {
    gap: 12,
  },
  hangoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1424",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
    gap: 12,
  },
  hangoutCardPressed: {
    backgroundColor: "#131C33",
  },
  hangoutThumb: {
    width: 74,
    height: 74,
    borderRadius: 14,
    backgroundColor: "#131C33",
  },
  hangoutInfo: {
    flex: 1,
    gap: 4,
  },
  hangoutTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    color: "#94A3B8",
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    flex: 1,
  },
  attendeesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  attendeeStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendeeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#0D1424",
  },
  attendeePlusPill: {
    marginLeft: -6,
    backgroundColor: "rgba(34, 211, 238, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.4)",
    paddingHorizontal: 4,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  attendeePlusText: {
    color: "#22D3EE",
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },
  goingText: {
    color: "#94A3B8",
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
  },
  bottomSignatureSection: {
    marginTop: 18,
    paddingHorizontal: 20,
    position: "relative",
    paddingBottom: 24,
  },
  waveLineContainer: {
    width: "100%",
    height: 3,
    marginBottom: 16,
    borderRadius: 2,
    overflow: "hidden",
  },
  waveGradientLine: {
    flex: 1,
    height: "100%",
  },
  cursiveDoodleBlock: {
    alignItems: "flex-end",
    paddingRight: 6,
  },
  cursiveDoodleLine: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: 0.5,
  },
  doodleHeartRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cursiveHeart: {
    color: "#FACC15",
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 10, 20, 0.8)",
    justifyContent: "flex-end",
    padding: 16,
    paddingBottom: 40,
  },
  modalCard: {
    backgroundColor: "#0D1424",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 18,
    gap: 4,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 8,
  },
  modalHeading: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
  },
  modalClose: {
    padding: 4,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  modalOptionText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontFamily: VibeFonts.semiBold,
  },
});
