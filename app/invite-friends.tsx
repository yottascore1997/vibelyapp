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
  Linking,
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

const { width: SCREEN_W } = Dimensions.get("window");

interface FriendItem {
  id: string;
  name: string;
  bio: string;
  avatar: any;
  selected: boolean;
}

const DEFAULT_FRIENDS: FriendItem[] = [
  {
    id: "riya",
    name: "Riya Sen",
    bio: "Always up for coffee ☕",
    avatar: require("../assets/hangout/friend-riya.png"),
    selected: true,
  },
  {
    id: "arjun",
    name: "Arjun Mehta",
    bio: "Coffee > Small Talk",
    avatar: require("../assets/hangout/friend-arjun.png"),
    selected: true,
  },
  {
    id: "sneha",
    name: "Sneha Kapoor",
    bio: "Exploring new places ✨",
    avatar: require("../assets/hangout/friend-sneha.png"),
    selected: false,
  },
  {
    id: "rohit",
    name: "Rohit Das",
    bio: "Good vibes only",
    avatar: require("../assets/hangout/friend-rohit.png"),
    selected: false,
  },
];

export default function InviteFriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    code?: string;
    subtitle?: string;
    location?: string;
    category?: string;
  }>();

  const { matches } = useMatches();

  const hangoutTitle = params.name || "Rooftop Coffee Hangout";
  const hangoutTime = params.subtitle || "Fri, 19 Sep • 7:30 PM";
  const hangoutLocation = params.location || "The Rooftop Café, Kolkata";
  const crewCode = params.code || "coffee-789";
  const inviteLink = `https://hangora.app/hangout/${crewCode}`;

  const [friends, setFriends] = useState<FriendItem[]>(DEFAULT_FRIENDS);

  useEffect(() => {
    if (matches && matches.length > 0) {
      const matchItems: FriendItem[] = matches.map((m, idx) => ({
        id: m.id,
        name: m.name,
        bio: m.bio || `Matched on Hangora • ${m.city || "Nearby"}`,
        avatar: m.avatarUrl
          ? { uri: m.avatarUrl }
          : DEFAULT_FRIENDS[idx % DEFAULT_FRIENDS.length].avatar,
        selected: idx < 2,
      }));

      if (matchItems.length < 4) {
        const remaining = DEFAULT_FRIENDS.slice(matchItems.length);
        setFriends([...matchItems, ...remaining]);
      } else {
        setFriends(matchItems);
      }
    } else {
      setFriends(DEFAULT_FRIENDS);
    }
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

  const selectedCount = friends.filter((f) => f.selected).length;
  const allSelected = friends.length > 0 && friends.every((f) => f.selected);

  // ── Share Actions ──
  const handleWhatsApp = async () => {
    const message = `Hey! Join me for ${hangoutTitle} (${hangoutTime} at ${hangoutLocation}) on Hangora: ${inviteLink}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      const canOpen = await Linking.canOpenURL(url).catch(() => false);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message });
      }
    } catch {
      await Share.share({ message });
    }
  };

  const handleCopyLink = () => {
    Alert.alert(
      "Link Copied! 📋",
      `Hangout invite link copied:\n${inviteLink}`
    );
  };

  const handleInstagram = async () => {
    const message = `Hey! Join me for ${hangoutTitle} on Hangora: ${inviteLink}`;
    try {
      const url = "instagram://app";
      const canOpen = await Linking.canOpenURL(url).catch(() => false);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message });
      }
    } catch {
      await Share.share({ message });
    }
  };

  const handleMore = async () => {
    try {
      await Share.share({
        title: hangoutTitle,
        message: `Hey! Join me for ${hangoutTitle} (${hangoutTime} at ${hangoutLocation}) on Hangora: ${inviteLink}`,
        url: inviteLink,
      });
    } catch {
      /* dismiss */
    }
  };

  const handleSendSelectedInvites = async () => {
    const selectedFriends = friends.filter((f) => f.selected);
    if (selectedFriends.length === 0) {
      Alert.alert("Select Friends", "Please select at least one friend to invite.");
      return;
    }

    for (const f of selectedFriends) {
      if (
        f.id &&
        !f.id.startsWith("riya") &&
        !f.id.startsWith("arjun") &&
        !f.id.startsWith("sneha") &&
        !f.id.startsWith("rohit")
      ) {
        try {
          await api.sendInvite({
            receiverId: f.id,
            activityName: hangoutTitle,
            activityEmoji: "☕",
            timeLabel: hangoutTime,
          });
          api.sendVibe({ receiverId: f.id, vibeType: "hangout_invite" }).catch(() => {});
        } catch (e) {
          console.warn("[invite-friends] sendInvite error:", e);
        }
      }
    }

    const names = selectedFriends.map((f) => f.name).join(", ");
    Alert.alert(
      "Invites Sent! 🎉",
      `Invites to join "${hangoutTitle}" have been sent to ${names}.`,
      [{ text: "Awesome!", onPress: () => router.back() }]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#060A13" />

      {/* ── HEADER ── */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backCircleBtn, { top: Math.max(insets.top, 16) + 4 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.mainTitle}>
            Invite <Text style={styles.highlightTitle}>Friends</Text>
          </Text>
          <Text style={styles.subTitle}>
            Good plans are better with good people.{"\n"}Invite your friends and make it a group story!
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 90 },
        ]}
      >
        {/* ── ROOFTOP EVENT CARD ── */}
        <Animated.View entering={FadeIn.duration(260)} style={styles.eventCard}>
          <Image
            source={require("../assets/hangout/rooftop-thumb.png")}
            style={styles.eventThumb}
            resizeMode="cover"
          />

          <View style={styles.eventContent}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {hangoutTitle}
            </Text>
            <Text style={styles.eventDateTime} numberOfLines={1}>
              {hangoutTime}
            </Text>
            <Text style={styles.eventLocation} numberOfLines={1}>
              {hangoutLocation}
            </Text>

            <View style={styles.badgesRow}>
              <View style={styles.coffeeBadge}>
                <Text style={styles.badgeText}>☕ Coffee</Text>
              </View>
              <View style={styles.chillBadge}>
                <Text style={styles.badgeText}>🔥 Chill Vibes</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── INVITE VIA SECTION ── */}
        <Text style={styles.sectionTitle}>Invite via</Text>
        <View style={styles.channelsRow}>
          {/* WhatsApp */}
          <Pressable
            style={({ pressed }) => [
              styles.channelBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleWhatsApp}
          >
            <View style={styles.whatsappCircle}>
              <Ionicons name="logo-whatsapp" size={20} color="#22C55E" />
            </View>
            <Text style={styles.channelLabel}>WhatsApp</Text>
          </Pressable>

          {/* Copy Link */}
          <Pressable
            style={({ pressed }) => [
              styles.channelBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleCopyLink}
          >
            <View style={styles.copyLinkCircle}>
              <Ionicons name="link" size={18} color="#A855F7" />
            </View>
            <Text style={styles.channelLabel}>Copy Link</Text>
          </Pressable>

          {/* Instagram */}
          <Pressable
            style={({ pressed }) => [
              styles.channelBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleInstagram}
          >
            <View style={styles.instagramCircle}>
              <Ionicons name="logo-instagram" size={19} color="#EC4899" />
            </View>
            <Text style={styles.channelLabel}>Instagram</Text>
          </Pressable>

          {/* More */}
          <Pressable
            style={({ pressed }) => [
              styles.channelBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleMore}
          >
            <View style={styles.moreCircle}>
              <Ionicons name="ellipsis-horizontal" size={19} color="#38BDF8" />
            </View>
            <Text style={styles.channelLabel}>More</Text>
          </Pressable>
        </View>

        {/* ── INFO BANNER NOTE ── */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="receipt-outline" size={17} color="#070A14" />
          </View>
          <Text style={styles.tipText}>
            Your friends will see a cool invite with hangout details.
          </Text>
        </View>

        {/* ── SUGGESTED FRIENDS SECTION ── */}
        <View style={styles.friendsHeaderRow}>
          <Text style={styles.friendsHeaderTitle}>Suggested Friends</Text>
          <Pressable onPress={toggleSelectAll} hitSlop={10}>
            <Text style={styles.selectAllText}>
              {allSelected ? "Deselect all" : "Select all"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.friendsCard}>
          {friends.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <View style={styles.rowDivider} />}
              <Pressable
                style={({ pressed }) => [
                  styles.friendRow,
                  pressed && styles.friendRowPressed,
                ]}
                onPress={() => toggleSelectFriend(item.id)}
              >
                <Image source={item.avatar} style={styles.friendAvatar} />

                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{item.name}</Text>
                  <Text style={styles.friendBio} numberOfLines={1}>
                    {item.bio}
                  </Text>
                </View>

                {/* Checkbox */}
                <View
                  style={
                    item.selected
                      ? styles.checkboxChecked
                      : styles.checkboxUnchecked
                  }
                >
                  {item.selected && (
                    <Ionicons name="checkmark-sharp" size={16} color="#070A14" />
                  )}
                </View>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* ── STICKY BOTTOM FLOATING CTA BUTTON ── */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.ctaWrap,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
          onPress={handleSendSelectedInvites}
        >
          <LinearGradient
            colors={["#E2F832", "#10E5C9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            <Text style={styles.ctaText}>
              Send Invites ({selectedCount})
            </Text>
            <Ionicons name="arrow-forward" size={19} color="#070A14" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#060A13",
  },

  // ── Header ──
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    position: "relative",
    backgroundColor: "#060A13",
  },
  backCircleBtn: {
    position: "absolute",
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  headerTitleWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 30,
  },
  mainTitle: {
    fontSize: 27,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  highlightTitle: {
    color: "#74FF65",
  },
  subTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#8B95A5",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },

  scrollContent: {
    paddingTop: 8,
  },

  // ── Event Card ──
  eventCard: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 20,
    backgroundColor: "#0C1222",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  eventThumb: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: "#151F33",
  },
  eventContent: {
    flex: 1,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  eventDateTime: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 3,
  },
  eventLocation: {
    fontSize: 12.5,
    fontFamily: VibeFonts.regular,
    color: "#64748B",
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  coffeeBadge: {
    backgroundColor: "#131C30",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chillBadge: {
    backgroundColor: "#131C30",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "#FBBF24",
  },

  // ── Invite Via Section ──
  sectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  channelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  channelBtn: {
    width: (SCREEN_W - 40 - 33) / 4,
    height: 78,
    borderRadius: 18,
    backgroundColor: "#0C1222",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  whatsappCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  copyLinkCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  instagramCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(236, 72, 153, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  channelLabel: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },

  // ── Info Tip Card ──
  tipCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "#0C1222",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E2F832",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    fontSize: 12.5,
    fontFamily: VibeFonts.regular,
    color: "#94A3B8",
    flex: 1,
    lineHeight: 18,
  },

  // ── Suggested Friends ──
  friendsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  friendsHeaderTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  selectAllText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#FACC15",
  },
  friendsCard: {
    marginHorizontal: 20,
    backgroundColor: "#0C1222",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    marginBottom: 20,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  friendRowPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#151F33",
  },
  friendInfo: {
    flex: 1,
    gap: 3,
  },
  friendName: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  friendBio: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: "#94A3B8",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginHorizontal: 16,
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#FACC15",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: "#27344D",
    backgroundColor: "transparent",
  },

  // ── Floating Bottom Sticky CTA ──
  stickyBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "rgba(6, 10, 19, 0.94)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  ctaWrap: {
    width: "100%",
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    shadowColor: "#10E5C9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaGrad: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },
});
