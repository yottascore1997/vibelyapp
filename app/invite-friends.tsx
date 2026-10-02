import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { VibeFonts } from "../constants/vibeTheme";
import { useMatches } from "../context/MatchesContext";
import { api } from "../services/api";
import TabBar from "../components/TabBar";
import HomeHeader from "../components/HomeHeader";

const { width: SCREEN_W } = Dimensions.get("window");

interface FriendItem {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  selected: boolean;
  invited: boolean;
}

const INITIAL_FRIENDS: FriendItem[] = [
  {
    id: "f1",
    name: "Riya Sen",
    bio: "Always up for coffee & late chats ☕",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    selected: true,
    invited: false,
  },
  {
    id: "f2",
    name: "Arjun Mehta",
    bio: "Coffee > Small Talk • Tech geek ⚡",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    selected: true,
    invited: false,
  },
  {
    id: "f3",
    name: "Sneha Kapoor",
    bio: "Exploring rooftop spots & indie gigs ✨",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    selected: false,
    invited: false,
  },
  {
    id: "f4",
    name: "Rohit Das",
    bio: "Good vibes only • Roadtripper 🚗",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    selected: false,
    invited: false,
  },
  {
    id: "f5",
    name: "Karan Malhotra",
    bio: "Night owl & EDM music lover 🎧",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200",
    selected: false,
    invited: false,
  },
  {
    id: "f6",
    name: "Ananya Roy",
    bio: "Foodie & sunset chaser 🌅",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200",
    selected: false,
    invited: false,
  },
];

export default function InviteFriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    code?: string;
    tab?: "qr" | "friends";
    subtitle?: string;
  }>();

  const crewName = params.name || "Weekend Gang";
  const crewCode = params.code || "abc123";
  const crewLink = `https://hangora.app/crew/${crewCode}`;

  const { matches } = useMatches();
  const [activeTab, setActiveTab] = useState<"qr" | "friends">(
    params.tab === "qr" ? "qr" : "friends"
  );
  const [friends, setFriends] = useState<FriendItem[]>(INITIAL_FRIENDS);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (matches && matches.length > 0) {
      const dynamicList: FriendItem[] = matches.map((m, idx) => ({
        id: m.id,
        name: m.name,
        bio: m.bio || "Matched with you on Hangora ⚡",
        avatar: m.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        selected: idx === 0,
        invited: false,
      }));
      if (mounted) setFriends(dynamicList);
    } else {
      api.getNearbyPeople({ maxKm: 50, limit: 12 })
        .then((people) => {
          if (mounted && people && people.length > 0) {
            const dynamicList: FriendItem[] = people.map((p, idx) => ({
              id: p.id,
              name: p.name,
              bio: p.bio || "Looking to hangout nearby ✨",
              avatar: p.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
              selected: idx === 0,
              invited: false,
            }));
            setFriends(dynamicList);
          }
        })
        .catch(() => {});
    }
    return () => { mounted = false; };
  }, [matches]);

  const toggleSelectFriend = (id: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = friends.every((f) => f.selected);
    setFriends((prev) => prev.map((f) => ({ ...f, selected: !allSelected })));
  };

  const handleSendSelectedInvites = () => {
    const selectedFriends = friends.filter((f) => f.selected);
    if (selectedFriends.length === 0) {
      Alert.alert("Select Friends", "Please select at least one friend to invite.");
      return;
    }
    selectedFriends.forEach((f) => {
      if (f.id && !f.id.startsWith("f")) {
        api.sendVibe({ receiverId: f.id, vibeType: "hangout_invite" }).catch(() => {});
      }
    });
    const names = selectedFriends.map((f) => f.name).join(", ");
    setFriends((prev) =>
      prev.map((f) => (f.selected ? { ...f, invited: true, selected: false } : f))
    );
    Alert.alert(
      "Invites Sent! 🎉",
      `Invites to join "${crewName}" have been sent to ${names}.`
    );
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Join my crew "${crewName}" on Vibely! Let's vibe and plan amazing hangouts: ${crewLink}`,
        url: crewLink,
      });
    } catch {
      // dismissed
    }
  };

  const handleCopyLink = () => {
    Alert.alert(
      "Link Copied! 📋",
      `Invite link for "${crewName}" copied to clipboard. Share it with your friends!`
    );
  };

  const handleDownloadQR = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      Alert.alert(
        "QR Code Saved! 📸",
        `QR Code for "${crewName}" has been saved to your photo gallery.`
      );
    }, 700);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    crewLink
  )}&color=ffffff&bgcolor=000000&margin=10`;

  const selectedCount = friends.filter((f) => f.selected).length;
  const allSelected = friends.length > 0 && friends.every((f) => f.selected);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070A14" />

      {/* ── TOP HEADER (Home page header) ── */}
      <HomeHeader showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 95 },
        ]}
      >
        {/* ── HANGOUT CONTEXT BANNER ── */}
        {params.name ? (
          <View style={styles.hangoutContextBanner}>
            <View style={styles.hangoutContextIconWrap}>
              <Text style={styles.hangoutContextEmoji}>☕</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hangoutContextTitle}>{crewName}</Text>
              {params.subtitle ? (
                <Text style={styles.hangoutContextSubtitle} numberOfLines={2}>
                  {params.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── TOP PILL TABS: QR Code & Friends ── */}
        <View style={styles.tabSelector}>
          <Pressable
            style={styles.tabBtn}
            onPress={() => setActiveTab("qr")}
          >
            {activeTab === "qr" ? (
              <LinearGradient
                colors={["#D4F72C", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabBtnActive}
              >
                <Text style={styles.tabBtnActiveText}>QR Code</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabBtnIdle}>
                <Text style={styles.tabBtnIdleText}>QR Code</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.tabBtn}
            onPress={() => setActiveTab("friends")}
          >
            {activeTab === "friends" ? (
              <LinearGradient
                colors={["#D4F72C", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabBtnActive}
              >
                <Text style={styles.tabBtnActiveText}>
                  Friends {selectedCount > 0 ? `(${selectedCount})` : ""}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabBtnIdle}>
                <Text style={styles.tabBtnIdleText}>
                  Friends {selectedCount > 0 ? `(${selectedCount})` : ""}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── CONTENT SWITCHER ── */}
        {activeTab === "qr" ? (
          /* ── TAB 1: QR CODE CARD CONTAINER ── */
          <Animated.View entering={FadeIn.duration(280)} style={styles.qrCard}>
            {/* Neon Corner Brackets */}
            <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
            <View style={[styles.cornerBracket, styles.bracketTopRight]} />
            <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
            <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

            {/* Left Decorative Squiggle Doodle (Pink) */}
            <View style={styles.doodleLeftWrap} pointerEvents="none">
              <Text style={styles.doodlePink}>{"{\n }"}</Text>
            </View>

            {/* Right Decorative Arrow Doodle (Cyan) */}
            <View style={styles.doodleRightWrap} pointerEvents="none">
              <View style={styles.doodleCyanSparkRow}>
                <View style={styles.doodleSparkDot} />
                <View style={[styles.doodleSparkDot, { marginTop: 4 }]} />
              </View>
              <Ionicons
                name="arrow-undo-outline"
                size={24}
                color="#22D3EE"
                style={styles.doodleArrow}
              />
            </View>

            {/* Central QR Code Image Frame */}
            <View style={styles.qrFrame}>
              <Image
                source={{ uri: qrImageUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />

              {/* Glowing Center Flame Badge */}
              <View style={styles.centerFlameWrap}>
                <LinearGradient
                  colors={["#EC4899", "#FACC15", "#22D3EE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.centerFlameRing}
                >
                  <View style={styles.centerFlameInner}>
                    <Text style={styles.centerFlameEmoji}>🔥</Text>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Prompt Text */}
            <Text style={styles.qrScanPrompt}>Scan this QR code to join</Text>
            <Text style={styles.crewNameTitle} numberOfLines={1}>
              {crewName}
            </Text>

            {/* Download QR Button */}
            <Pressable
              style={({ pressed }) => [
                styles.downloadBtnWrap,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                downloading && { opacity: 0.7 },
              ]}
              onPress={handleDownloadQR}
              disabled={downloading}
            >
              <View style={styles.downloadBtnContent}>
                <Ionicons name="download-outline" size={17} color="#D4F72C" />
                <Text style={styles.downloadBtnText}>
                  {downloading ? "Saving..." : "Download QR"}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        ) : (
          /* ── TAB 2: FRIENDS LIST CONTAINER (With Selection & Send Invite) ── */
          <Animated.View entering={FadeIn.duration(280)} style={styles.friendsCard}>
            <View style={styles.friendsHeaderRow}>
              <Text style={styles.friendsHeaderTitle}>Suggested Friends</Text>
              <Pressable onPress={toggleSelectAll} hitSlop={10}>
                <Text style={styles.selectAllText}>
                  {allSelected ? "Deselect All" : "Select all"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.friendsList}>
              {friends.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.friendRow,
                    item.selected && styles.friendRowSelected,
                    pressed && styles.friendRowPressed,
                  ]}
                  onPress={() => toggleSelectFriend(item.id)}
                  hitSlop={6}
                >
                  <View style={styles.friendAvatarWrap} pointerEvents="none">
                    <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
                    <View style={styles.friendOnlineDot} />
                  </View>

                  <View style={styles.friendInfo} pointerEvents="none">
                    <View style={styles.friendNameRow}>
                      <Text style={styles.friendName}>{item.name}</Text>
                      {item.invited && (
                        <View style={styles.sentBadge}>
                          <Text style={styles.sentBadgeText}>Sent ✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.friendBio} numberOfLines={1}>
                      {item.bio}
                    </Text>
                  </View>

                  {/* Square Checkbox on Right */}
                  <View
                    pointerEvents="none"
                    style={[
                      styles.checkboxSquare,
                      item.selected && styles.checkboxSquareSelected,
                    ]}
                  >
                    {item.selected ? (
                      <Ionicons name="checkmark-sharp" size={18} color="#070A14" />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Send Invite Button inside Friends list */}
            <Pressable
              style={({ pressed }) => [
                styles.sendInvitesActionBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
                selectedCount === 0 && { opacity: 0.5 },
              ]}
              onPress={handleSendSelectedInvites}
              disabled={selectedCount === 0}
            >
              <LinearGradient
                colors={["#D4F72C", "#10B981"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendInvitesGrad}
              >
                <Text style={styles.sendInvitesText}>
                  {selectedCount > 0
                    ? `Send Invites (${selectedCount})`
                    : "Select Friends to Invite"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#070A14" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* ── OR SHARE THIS LINK SECTION (Always visible) ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(360)} style={styles.linkSection}>
          <Text style={styles.linkSectionTitle}>Or share this link</Text>

          <View style={styles.linkBox}>
            <Ionicons name="link-outline" size={18} color="#94A3B8" />
            <Text style={styles.linkText} numberOfLines={1}>
              {crewLink}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.copyBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleCopyLink}
              hitSlop={8}
            >
              <Ionicons name="copy-outline" size={16} color="#22D3EE" />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── BIG CTA BUTTON: SHARE LINK ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(380)} style={styles.ctaWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.shareCtaBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
            onPress={handleShareLink}
          >
            <LinearGradient
              colors={["#D4F72C", "#22D3EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareCtaGrad}
            >
              <Ionicons name="share-outline" size={20} color="#070A14" />
              <Text style={styles.shareCtaText}>Share Link</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* ── FLOATING BOTTOM NAV (TabBar) ── */}
      <TabBar dark />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070A14",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "#070A14",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPlaceholder: {
    width: 42,
    height: 42,
  },
  headerTitleCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleInvite: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.3,
  },
  titleFriends: {
    color: "#D4F72C",
    fontSize: 21,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingTop: 8,
  },

  // ── Hangout Context Banner ──
  hangoutContextBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    borderWidth: 1.2,
    borderColor: "rgba(34, 211, 238, 0.35)",
  },
  hangoutContextIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(34, 211, 238, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  hangoutContextEmoji: {
    fontSize: 22,
  },
  hangoutContextTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  hangoutContextSubtitle: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#22D3EE",
    marginTop: 2,
  },

  // ── Mode Tab Selector ──
  tabSelector: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    overflow: "hidden",
  },
  tabBtnActive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  tabBtnActiveText: {
    color: "#070A14",
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
  },
  tabBtnIdle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tabBtnIdleText: {
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },

  // ── QR Code Card ──
  qrCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.22)",
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Neon Corner Brackets
  cornerBracket: {
    position: "absolute",
    width: 32,
    height: 32,
  },
  bracketTopLeft: {
    top: 18,
    left: 48,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderColor: "#22D3EE",
    borderTopLeftRadius: 12,
  },
  bracketTopRight: {
    top: 18,
    right: 48,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderColor: "#EC4899",
    borderTopRightRadius: 12,
  },
  bracketBottomLeft: {
    bottom: 120,
    left: 48,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderColor: "#FACC15",
    borderBottomLeftRadius: 12,
  },
  bracketBottomRight: {
    bottom: 120,
    right: 48,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderColor: "#D4F72C",
    borderBottomRightRadius: 12,
  },

  // Doodles
  doodleLeftWrap: {
    position: "absolute",
    left: 18,
    top: "38%",
  },
  doodlePink: {
    color: "#EC4899",
    fontSize: 26,
    lineHeight: 20,
    fontFamily: VibeFonts.bold,
  },
  doodleRightWrap: {
    position: "absolute",
    right: 18,
    top: "36%",
    alignItems: "center",
  },
  doodleCyanSparkRow: {
    flexDirection: "row",
    gap: 3,
    marginBottom: 2,
  },
  doodleSparkDot: {
    width: 3.5,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#22D3EE",
    transform: [{ rotate: "25deg" }],
  },
  doodleArrow: {
    transform: [{ rotate: "180deg" }, { scaleX: -1 }],
  },

  // QR Image & Center Flame
  qrFrame: {
    width: 210,
    height: 210,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: 6,
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  centerFlameWrap: {
    position: "absolute",
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FACC15",
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  centerFlameRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  centerFlameInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#070A14",
    alignItems: "center",
    justifyContent: "center",
  },
  centerFlameEmoji: {
    fontSize: 24,
  },

  qrScanPrompt: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginTop: 18,
  },
  crewNameTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    marginTop: 3,
    marginBottom: 16,
    textAlign: "center",
  },

  // Download QR Button
  downloadBtnWrap: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#D4F72C",
    backgroundColor: "rgba(212, 247, 44, 0.06)",
    paddingVertical: 12,
    paddingHorizontal: 26,
    shadowColor: "#D4F72C",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  downloadBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  downloadBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },

  // ── TAB 2: Friends List Card ──
  friendsCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.22)",
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: "#22D3EE",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  friendsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  friendsHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },
  selectAllText: {
    color: "#D4F72C",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },
  friendsList: {
    gap: 10,
    marginBottom: 16,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131C33",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 12,
  },
  friendRowSelected: {
    borderColor: "#D4F72C",
    backgroundColor: "rgba(212, 247, 44, 0.09)",
  },
  friendRowPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  checkboxSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSquareSelected: {
    backgroundColor: "#D4F72C",
    borderColor: "#D4F72C",
    shadowColor: "#D4F72C",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  friendAvatarWrap: {
    position: "relative",
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#070A14",
  },
  friendOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#131C33",
  },
  friendInfo: {
    flex: 1,
    gap: 3,
  },
  friendNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  friendName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  friendBio: {
    color: "#94A3B8",
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
  },
  sentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
  },
  sentBadgeText: {
    color: "#22D3EE",
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
  },

  // Send Invites Action Button inside Friends Card
  sendInvitesActionBtn: {
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
    shadowColor: "#D4F72C",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  sendInvitesGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  sendInvitesText: {
    color: "#070A14",
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
  },

  // ── Share Link Section ──
  linkSection: {
    marginHorizontal: 16,
    marginTop: 22,
  },
  linkSectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    marginBottom: 8,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1424",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  linkText: {
    flex: 1,
    color: "#94A3B8",
    fontSize: 13,
    fontFamily: VibeFonts.medium,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Big CTA Button ──
  ctaWrap: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 20,
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#D4F72C",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  shareCtaBtn: {
    borderRadius: 999,
    overflow: "hidden",
  },
  shareCtaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
  },
  shareCtaText: {
    color: "#070A14",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
  },
});
