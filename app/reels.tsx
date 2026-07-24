import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import InviteCard from "../components/vibe/InviteCard";
import TabBar from "../components/TabBar";
import { useMatches } from "../context/MatchesContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";
import { API_URL } from "../constants/theme";

const friendsHangout3d = require("../assets/friends_hangout_3d.png");
const { width: SCREEN_W } = Dimensions.get("window");

/** Hangout light premium palette */
const T = {
  bg: "#EEE9F8",
  card: "#FFFBFE",
  cardElevated: "#FFFFFF",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E4DFF0",
  purple: "#8B5CF6",
  purpleDeep: "#7C3AED",
  purpleBright: "#A78BFA",
  softPurple: "#EDE7FF",
  pink: "#EC4899",
  pinkSoft: "#FCE7F3",
  green: "#22C55E",
  greenDark: "#16A34A",
  greenSoft: "#DCFCE7",
  amber: "#F59E0B",
  cta: ["#8B5CF6", "#EC4899"] as const,
  upgrade: ["#F59E0B", "#EC4899"] as const,
};

interface DirectInvite {
  id: string;
  senderName: string;
  senderAvatar: string;
  recipientName: string;
  recipientAvatar: string;
  activityEmoji: string;
  activityName: string;
  timeLabel: string;
  status: "pending" | "accepted" | "rejected";
  type: "received" | "sent";
}

type IonName = keyof typeof Ionicons.glyphMap;

const activitiesList = [
  { id: "coffee", name: "Coffee", emoji: "☕", icon: "cafe" as IonName, soft: "#FEF3C7", accent: "#D97706" },
  { id: "food", name: "Food", emoji: "🍕", icon: "pizza" as IonName, soft: "#FFEDD5", accent: "#EA580C" },
  { id: "beer", name: "Beer", emoji: "🍺", icon: "beer" as IonName, soft: "#FEF9C3", accent: "#CA8A04" },
  { id: "sutta", name: "Sutta", emoji: "🚬", icon: "flame" as IonName, soft: "#F3F4F6", accent: "#6B7280" },
  { id: "vape", name: "Vape", emoji: "💨", icon: "cloud" as IonName, soft: "#DBEAFE", accent: "#2563EB" },
  { id: "street", name: "Street", emoji: "🌮", icon: "restaurant" as IonName, soft: "#D1FAE5", accent: "#059669" },
  { id: "drinks", name: "Drinks", emoji: "🍸", icon: "wine" as IonName, soft: "#FCE7F3", accent: "#DB2777" },
  { id: "movie", name: "Movie", emoji: "🎬", icon: "film" as IonName, soft: "#EDE9FE", accent: "#7C3AED" },
];

const timeOptions = [
  { id: "now", label: "Now", subtext: "Let's go!", icon: "flash" as IonName },
  { id: "30min", label: "+30 Min", subtext: "Soon", icon: "timer" as IonName },
  { id: "1hr", label: "+1 Hr", subtext: "Later", icon: "hourglass" as IonName },
  { id: "6pm", label: "Evening", subtext: "Today", icon: "moon" as IonName },
];

function getTimeLabel(id: string) {
  if (id === "now") return "right now";
  if (id === "30min") return "in 30 minutes";
  if (id === "1hr") return "in 1 hour";
  return "at 6 PM today";
}

/** Friend plans list — separate from Hangout public plans */
function FriendsPlansList({
  invites,
  onAccept,
  onReject,
  onNewInvite,
  onOpenHangout,
}: {
  invites: DirectInvite[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onNewInvite: () => void;
  onOpenHangout: () => void;
}) {
  const pending = invites.filter((i) => i.type === "received" && i.status === "pending");
  const mine = invites.filter(
    (i) => i.type === "sent" || (i.type === "received" && i.status !== "pending")
  );

  return (
    <View>
      <Animated.View entering={FadeInDown.duration(360)} style={styles.plansHero}>
        <LinearGradient
          colors={["#FFFFFF", "#F8F4FF", "#FFF0F8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.plansHeroInner}
        >
          <View style={styles.heroPill}>
            <Ionicons name="calendar" size={11} color={T.purple} />
            <Text style={styles.heroPillText}>FRIEND PLANS</Text>
          </View>
          <Text style={styles.plansHeroTitle}>My Plans</Text>
          <Text style={styles.plansHeroSub}>
            Yahan sirf friends ke invites hain. Hangout ke public plans alag jagah hain.
          </Text>
          <View style={styles.plansHeroActions}>
            <Pressable onPress={onNewInvite} style={styles.plansHeroCta}>
              <LinearGradient colors={[...T.cta]} style={styles.plansHeroCtaGrad}>
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={styles.plansHeroCtaText}>New Invite</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={onOpenHangout} style={styles.plansHeroSecondary}>
              <Ionicons name="map-outline" size={14} color={T.purple} />
              <Text style={styles.plansHeroSecondaryText}>Public Hangout</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>

      {pending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionIcon}>
              <Ionicons name="mail-unread" size={14} color={T.purple} />
            </View>
            <Text style={styles.sectionTitle}>Needs your reply</Text>
          </View>
          {pending.map((inv) => (
            <View key={inv.id} style={styles.inviteItemCard}>
              <View style={styles.inviteItemLeft}>
                <Image source={{ uri: inv.senderAvatar }} style={styles.inviteItemAvatar} />
                <View style={styles.inviteItemInfo}>
                  <Text style={styles.inviteItemText}>
                    <Text style={styles.boldFriend}>{inv.senderName}</Text> · {inv.activityName}{" "}
                    {inv.activityEmoji}
                  </Text>
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={11} color={T.muted} />
                    <Text style={styles.inviteItemTime}>{inv.timeLabel}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.inviteActions}>
                <Pressable
                  onPress={() => onReject(inv.id)}
                  style={[styles.invActionBtn, styles.invRejectBtn]}
                >
                  <Ionicons name="close" size={14} color="#EF4444" />
                </Pressable>
                <Pressable onPress={() => onAccept(inv.id)}>
                  <LinearGradient colors={[T.green, T.greenDark]} style={styles.invAcceptGradient}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <View style={styles.sectionIcon}>
            <Ionicons name="people" size={14} color={T.pink} />
          </View>
          <Text style={styles.sectionTitle}>Your friend plans</Text>
        </View>

        {mine.length === 0 && pending.length === 0 ? (
          <View style={styles.emptyMatches}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={22} color={T.purple} />
            </View>
            <Text style={styles.emptyMatchesText}>
              Abhi koi friend plan nahi. Invite tab se match ko invite bhejo — yahan dikhega.
            </Text>
            <Pressable style={styles.emptyCta} onPress={onNewInvite}>
              <Text style={styles.emptyCtaText}>Create invite</Text>
              <Ionicons name="arrow-forward" size={14} color={T.purple} />
            </Pressable>
          </View>
        ) : (
          mine.map((inv) => (
            <View key={inv.id} style={styles.planCard}>
              <View style={styles.planCardTop}>
                <Image
                  source={{
                    uri: inv.type === "sent" ? inv.recipientAvatar : inv.senderAvatar,
                  }}
                  style={styles.planCardAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.planCardTitle}>
                    {inv.activityEmoji} {inv.activityName}
                  </Text>
                  <Text style={styles.planCardSub}>
                    {inv.type === "sent"
                      ? `Sent to ${inv.recipientName}`
                      : `From ${inv.senderName}`}{" "}
                    · {inv.timeLabel}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    inv.status === "pending"
                      ? styles.statusPending
                      : inv.status === "accepted"
                        ? styles.statusAccepted
                        : styles.statusRejected,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          inv.status === "pending"
                            ? "#D97706"
                            : inv.status === "accepted"
                              ? T.greenDark
                              : "#EF4444",
                      },
                    ]}
                  >
                    {inv.status === "pending"
                      ? "Pending"
                      : inv.status === "accepted"
                        ? "Accepted"
                        : "Declined"}
                  </Text>
                </View>
              </View>
              <View style={styles.planCardTag}>
                <Ionicons name="people" size={11} color={T.purple} />
                <Text style={styles.planCardTagText}>Friend plan · not Hangout</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

export default function ReelsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { matches, likesCount } = useMatches();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [activity, setActivity] = useState("coffee");
  const [time, setTime] = useState("now");
  const [phase, setPhase] = useState<"plan" | "ready" | "sent">("plan");
  /** invite = create friend invite · plans = friend invites list (NOT hangout public plans) */
  const [activeTab, setActiveTab] = useState<"invite" | "plans">("invite");

  const [invites, setInvites] = useState<DirectInvite[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState<string>("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [facepile, setFacepile] = useState<{ id: string; avatarUrl: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const users: any = await api.getOnlineUsers();
        const list = Array.isArray(users) ? users : users?.users || [];
        setFacepile(
          list.slice(0, 4).map((u: any) => ({
            id: u.id || u.userId,
            avatarUrl: u.avatarUrl?.startsWith("/")
              ? `${API_URL.replace("/api", "")}${u.avatarUrl}`
              : u.avatarUrl ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
          }))
        );
      } catch {
        setFacepile([]);
      }
    })();
  }, []);

  useEffect(() => {
    async function loadMyProfile() {
      if (!token) return;
      try {
        const res = (await api.getProfile(token)) as any;
        if (res?.profile?.avatarUrl) {
          const url = res.profile.avatarUrl;
          if (url.startsWith("/")) {
            const { API_URL } = require("../constants/theme");
            setMyAvatarUrl(`${API_URL.replace("/api", "")}${url}`);
          } else {
            setMyAvatarUrl(url);
          }
        }
      } catch (err) {
        console.error("Load my profile error in reels screen:", err);
      }
    }
    loadMyProfile();
  }, [token]);

  const inviteList = matches;

  const loadInvites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getInvites(user.id);
      if (res) {
        const resolveAvatar = (url?: string | null) => {
          if (url) {
            if (url.startsWith("/")) {
              const { API_URL } = require("../constants/theme");
              return `${API_URL.replace("/api", "")}${url}`;
            }
            return url;
          }
          return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop";
        };

        setInvites(
          (res as any[]).map((inv) => ({
            ...inv,
            senderAvatar: resolveAvatar(inv.senderAvatar),
            recipientAvatar: resolveAvatar(inv.recipientAvatar),
          }))
        );
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

  useEffect(() => {
    if (matches.length > 0) setSelectedMatch(matches[0]);
    else setSelectedMatch(null);
  }, [matches]);

  const handleSend = () => setPhase("ready");

  const activeActivityObj =
    activitiesList.find((act) => act.id === activity) || activitiesList[0];

  const handleConfirm = async () => {
    if (!user || !selectedMatch || sendingInvite) return;
    setSendingInvite(true);
    const timeLabel = getTimeLabel(time);
    try {
      const res = await api.sendInvite({
        receiverId: selectedMatch.id,
        activityName: activeActivityObj.name,
        activityEmoji: activeActivityObj.emoji,
        timeLabel,
      });
      if (res) {
        await loadInvites();
        setPhase("sent");
        setActiveTab("plans");
      } else {
        Alert.alert(
          "Invite failed",
          "Could not send invite. This friend may not be a real account yet — match with someone from Discover first."
        );
      }
    } catch (err) {
      console.error("Send invite failed:", err);
      Alert.alert("Invite failed", "Something went wrong. Please try again.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleClose = () => setPhase("plan");

  const handleAcceptInvite = async (id: string) => {
    try {
      const res = await api.respondToInvite(id, "accepted");
      if (res) await loadInvites();
    } catch (err) {
      console.error("Accept invite failed:", err);
    }
  };

  const handleRejectInvite = async (id: string) => {
    try {
      const res = await api.respondToInvite(id, "rejected");
      if (res) await loadInvites();
    } catch (err) {
      console.error("Reject invite failed:", err);
    }
  };

  const pendingInvites = invites.filter((inv) => inv.type === "received" && inv.status === "pending");
  const activeInvites = invites.filter(
    (inv) => inv.type === "sent" || (inv.type === "received" && inv.status === "accepted")
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <LinearGradient
        colors={["rgba(167,139,250,0.28)", "transparent"]}
        style={[styles.ambient, { top: -20, left: -40 }]}
      />
      <LinearGradient
        colors={["rgba(244,114,182,0.16)", "transparent"]}
        style={[styles.ambient, { top: 280, right: -50 }]}
      />
      <View style={styles.coolOrb} />

      {notification && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          exiting={FadeOut.duration(300)}
          style={styles.notifBanner}
        >
          <View style={styles.notifContent}>
            <View style={styles.notifIconWrap}>
              <Ionicons name="notifications" size={16} color={T.green} />
            </View>
            <Text style={styles.notifText}>{notification}</Text>
          </View>
          <Pressable onPress={() => setNotification(null)} style={styles.notifClose}>
            <Ionicons name="close" size={16} color={T.muted} />
          </Pressable>
        </Animated.View>
      )}

      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={T.ink} />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={styles.brandRow}>
              <Ionicons name="people" size={12} color={T.purple} />
              <Text style={styles.headerEyebrow}>FRIENDS</Text>
            </View>
            <Text style={styles.headerTitle}>Hangout</Text>
          </View>

          <View style={styles.facepile}>
            {(facepile.length ? facepile : []).slice(0, 3).map((u, i) => (
              <Image
                key={u.id || String(i)}
                source={{ uri: u.avatarUrl }}
                style={[styles.face, { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]}
              />
            ))}
            {facepile.length > 3 ? (
              <View style={styles.faceMore}>
                <Text style={styles.faceMoreText}>+{Math.max(0, facepile.length - 3)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Segment tabs — Invite create vs Friend Plans (separate from Hangout) */}
        <View style={styles.segWrap}>
          <Pressable
            style={[styles.segItem, activeTab === "invite" && styles.segItemActive]}
            onPress={() => {
              setActiveTab("invite");
              setPhase("plan");
            }}
          >
            <Ionicons
              name="paper-plane"
              size={14}
              color={activeTab === "invite" ? "#fff" : T.muted}
            />
            <Text style={[styles.segText, activeTab === "invite" && styles.segTextActive]}>
              Invite
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segItem, activeTab === "plans" && styles.segItemActive]}
            onPress={() => setActiveTab("plans")}
          >
            <Ionicons
              name="calendar"
              size={14}
              color={activeTab === "plans" ? "#fff" : T.muted}
            />
            <Text style={[styles.segText, activeTab === "plans" && styles.segTextActive]}>
              My Plans
            </Text>
            {invites.length > 0 ? (
              <View style={styles.segBadge}>
                <Text style={styles.segBadgeText}>{invites.length}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === "plans" ? (
            <FriendsPlansList
              invites={invites}
              onAccept={handleAcceptInvite}
              onReject={handleRejectInvite}
              onNewInvite={() => {
                setActiveTab("invite");
                setPhase("plan");
              }}
              onOpenHangout={() => router.push("/hangout")}
            />
          ) : phase === "plan" ? (
            <>
              {/* Hero */}
              <Animated.View entering={FadeInDown.duration(420)} style={styles.heroWrap}>
                <LinearGradient
                  colors={["#FFFFFF", "#F8F4FF", "#FFF0F8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.hero}
                >
                  <View style={styles.heroBlob} />
                  <View style={styles.heroCopy}>
                    <View style={styles.heroPill}>
                      <Ionicons name="people" size={11} color={T.purple} />
                      <Text style={styles.heroPillText}>FRIEND PLAN</Text>
                    </View>
                    <Text style={styles.heroTitle}>Invite a friend{"\n"}to hang</Text>
                    <Text style={styles.heroSub}>
                      Yeh plans My Plans mein jayenge — Hangout public plans alag hain.
                    </Text>
                  </View>
                  <Image source={friendsHangout3d} style={styles.heroImage} resizeMode="contain" />
                </LinearGradient>
              </Animated.View>

              {/* Stats banner */}
              <Animated.View entering={FadeInDown.delay(60).duration(360)} style={styles.bannerWrap}>
                <View style={styles.banner}>
                  <View style={styles.bannerLeft}>
                    <View style={styles.livePulse} />
                    <Ionicons name="radio" size={13} color={T.greenDark} />
                    <Text style={styles.bannerLeftText}>Friends active near you</Text>
                  </View>
                  <Pressable
                    style={styles.bannerRight}
                    onPress={() => router.push("/(tabs)/chats")}
                  >
                    <Ionicons name="heart" size={13} color={T.pink} />
                    <Text style={styles.bannerRightText}>
                      {likesCount > 0 ? `${likesCount} likes` : "New likes"}
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
                  <View style={styles.sectionHead}>
                    <View style={styles.sectionIcon}>
                      <Ionicons name="mail-unread" size={14} color={T.purple} />
                    </View>
                    <Text style={styles.sectionTitle}>Pending invites</Text>
                  </View>
                  {pendingInvites.map((inv) => (
                    <View key={inv.id} style={styles.inviteItemCard}>
                      <View style={styles.inviteItemLeft}>
                        <Image source={{ uri: inv.senderAvatar }} style={styles.inviteItemAvatar} />
                        <View style={styles.inviteItemInfo}>
                          <Text style={styles.inviteItemText}>
                            <Text style={styles.boldFriend}>{inv.senderName}</Text> wants{" "}
                            {inv.activityName} {inv.activityEmoji}
                          </Text>
                          <View style={styles.metaChip}>
                            <Ionicons name="time-outline" size={11} color={T.muted} />
                            <Text style={styles.inviteItemTime}>{inv.timeLabel}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.inviteActions}>
                        <Pressable
                          onPress={() => handleRejectInvite(inv.id)}
                          style={[styles.invActionBtn, styles.invRejectBtn]}
                        >
                          <Ionicons name="close" size={14} color="#EF4444" />
                        </Pressable>
                        <Pressable onPress={() => handleAcceptInvite(inv.id)}>
                          <LinearGradient
                            colors={[T.green, T.greenDark]}
                            style={styles.invAcceptGradient}
                          >
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          </LinearGradient>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </Animated.View>
              )}

              {/* Active Invites */}
              {activeInvites.length > 0 && (
                <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
                  <View style={styles.sectionHeadRow}>
                    <View style={styles.sectionHead}>
                      <View style={styles.sectionIcon}>
                        <Ionicons name="calendar" size={14} color={T.pink} />
                      </View>
                      <Text style={styles.sectionTitle}>Active invites</Text>
                    </View>
                    <Pressable onPress={() => router.push("/invites")}>
                      <Text style={styles.seeAllText}>View all ›</Text>
                    </Pressable>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rsvpScroll}
                  >
                    {activeInvites.map((inv) => (
                      <View key={inv.id} style={styles.rsvpCard}>
                        <View style={styles.rsvpHeader}>
                          <Image
                            source={{
                              uri: inv.type === "sent" ? inv.recipientAvatar : inv.senderAvatar,
                            }}
                            style={styles.rsvpAvatar}
                          />
                          <View style={{ flex: 1, marginRight: 6 }}>
                            <Text style={styles.rsvpTitle} numberOfLines={1}>
                              {inv.activityEmoji} {inv.activityName}
                            </Text>
                            <Text style={styles.rsvpSub} numberOfLines={1}>
                              {inv.type === "sent"
                                ? `to ${inv.recipientName}`
                                : `from ${inv.senderName}`}
                            </Text>
                          </View>
                          {inv.status === "pending" ? (
                            <View style={[styles.statusPill, styles.statusPending]}>
                              <Ionicons name="hourglass" size={10} color="#D97706" />
                              <Text style={[styles.statusText, { color: "#D97706" }]}>Pending</Text>
                            </View>
                          ) : inv.status === "accepted" ? (
                            <View style={[styles.statusPill, styles.statusAccepted]}>
                              <Ionicons name="checkmark-circle" size={10} color={T.greenDark} />
                              <Text style={[styles.statusText, { color: T.greenDark }]}>
                                Accepted
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.statusPill, styles.statusRejected]}>
                              <Text style={[styles.statusText, { color: "#EF4444" }]}>Declined</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.rsvpJoined}>
                          <Text style={styles.joinedLabel}>JOINED</Text>
                          <View style={styles.joinedRow}>
                            <View style={styles.joinedFaces}>
                              <Image
                                source={{
                                  uri: inv.type === "sent" ? inv.senderAvatar : inv.recipientAvatar,
                                }}
                                style={styles.attFace}
                              />
                              {inv.status === "accepted" && (
                                <Image
                                  source={{
                                    uri:
                                      inv.type === "sent" ? inv.recipientAvatar : inv.senderAvatar,
                                  }}
                                  style={[styles.attFace, { marginLeft: -8 }]}
                                />
                              )}
                            </View>
                            <Text style={styles.joinedNames} numberOfLines={1}>
                              {inv.status === "accepted"
                                ? `You & ${inv.type === "sent" ? inv.recipientName : inv.senderName}`
                                : "Waiting..."}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}

              {/* Quick Activities — dark panel */}
              <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
                <LinearGradient
                  colors={["#1A1428", "#120F1C", "#1B1230"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.darkPanel}
                >
                  <View style={styles.darkGlowA} />
                  <View style={styles.darkGlowB} />
                  <View style={styles.sectionHead}>
                    <LinearGradient colors={[...T.cta]} style={styles.sectionIconGrad}>
                      <Ionicons name="grid" size={12} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitleDark}>Quick activities</Text>
                      <Text style={styles.sectionSubDark}>Tap to pick your hang vibe</Text>
                    </View>
                  </View>

                  <View style={styles.grid}>
                    {activitiesList.map((act, index) => {
                      const selected = activity === act.id;
                      return (
                        <Animated.View
                          key={act.id}
                          entering={FadeInDown.delay(80 + index * 30).springify()}
                          style={styles.actWrap}
                        >
                          <Pressable
                            onPress={() => setActivity(act.id)}
                            style={[
                              styles.actBtnDark,
                              selected && {
                                borderColor: act.accent,
                                backgroundColor: `${act.accent}28`,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.actIconBubble,
                                { backgroundColor: selected ? act.accent : "rgba(255,255,255,0.08)" },
                              ]}
                            >
                              <Ionicons
                                name={act.icon}
                                size={15}
                                color={selected ? "#fff" : act.accent}
                              />
                            </View>
                            <Text
                              style={[
                                styles.actNameDark,
                                selected && { color: act.accent },
                              ]}
                            >
                              {act.name}
                            </Text>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* When — premium dark panel */}
              <Animated.View entering={FadeIn.delay(150)} style={styles.section}>
                <LinearGradient
                  colors={["#1A1428", "#120F1C", "#1B1230"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.darkPanel}
                >
                  <View style={styles.darkGlowA} />
                  <View style={styles.darkGlowB} />
                  <View style={styles.sectionHead}>
                    <LinearGradient colors={[...T.cta]} style={styles.sectionIconGrad}>
                      <Ionicons name="time" size={12} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitleDark}>When?</Text>
                      <Text style={styles.sectionSubDark}>Choose your hang window</Text>
                    </View>
                    <View style={styles.whenLivePill}>
                      <Ionicons name="flash" size={10} color="#fff" />
                      <Text style={styles.whenLiveText}>LIVE</Text>
                    </View>
                  </View>

                  <View style={styles.timeRow}>
                    {timeOptions.map((t, index) => {
                      const selected = time === t.id;
                      return (
                        <Animated.View
                          key={t.id}
                          entering={FadeInDown.delay(180 + index * 30).springify()}
                          style={styles.timeCardWrap}
                        >
                          <Pressable
                            onPress={() => setTime(t.id)}
                            style={[styles.timeCardDark, selected && styles.timeCardDarkSelected]}
                          >
                            {selected ? (
                              <LinearGradient
                                colors={[...T.cta]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.timeIconGrad}
                              >
                                <Ionicons name={t.icon} size={14} color="#fff" />
                              </LinearGradient>
                            ) : (
                              <View style={styles.timeIconWrapDark}>
                                <Ionicons name={t.icon} size={14} color="#C4B5FD" />
                              </View>
                            )}
                            <Text
                              style={[
                                styles.timeLabelDark,
                                selected && styles.timeLabelDarkSelected,
                              ]}
                            >
                              {t.label}
                            </Text>
                            <Text
                              style={[
                                styles.timeSubtextDark,
                                selected && styles.timeSubtextDarkSelected,
                              ]}
                            >
                              {t.subtext}
                            </Text>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Choose Match */}
              <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
                <View style={styles.sectionHead}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="heart" size={14} color={T.pink} />
                  </View>
                  <Text style={styles.sectionTitle}>Choose match</Text>
                </View>
                {inviteList.length === 0 ? (
                  <View style={styles.emptyMatches}>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="people" size={22} color={T.purple} />
                    </View>
                    <Text style={styles.emptyMatchesText}>
                      No matches yet. Swipe on Discover to unlock invites!
                    </Text>
                    <Pressable
                      style={styles.emptyCta}
                      onPress={() => router.push("/(tabs)/discover")}
                    >
                      <Text style={styles.emptyCtaText}>Go Discover</Text>
                      <Ionicons name="arrow-forward" size={14} color={T.purple} />
                    </Pressable>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.matchScroll}
                  >
                    {inviteList.map((item, index) => {
                      const selected = selectedMatch?.id === item.id;
                      return (
                        <Animated.View
                          key={item.id}
                          entering={FadeIn.delay(220 + index * 40)}
                          style={styles.matchItem}
                        >
                          <Pressable onPress={() => setSelectedMatch(item)}>
                            <View style={[styles.matchRing, selected && styles.matchRingSelected]}>
                              <Image source={{ uri: item.avatarUrl }} style={styles.matchAvatar} />
                              <View style={styles.onlineDot} />
                            </View>
                            <Text
                              style={[styles.matchName, selected && styles.matchNameSelected]}
                              numberOfLines={1}
                            >
                              {item.name.split(" ")[0]}
                            </Text>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </ScrollView>
                )}
              </Animated.View>

              {/* Send Invite Card */}
              {selectedMatch ? (
                <Animated.View entering={FadeIn.delay(250)} style={styles.actionWrap}>
                  <View style={styles.actionCard}>
                    <View style={styles.actionLeft}>
                      <View style={styles.avatarWrap}>
                        <Image
                          source={{ uri: selectedMatch.avatarUrl }}
                          style={styles.friendAvatar}
                        />
                        <View style={styles.activeDot} />
                      </View>
                      <View style={styles.actionTexts}>
                        <View style={styles.sendToRow}>
                          <Text style={styles.sendToLabel}>
                            Send to{" "}
                            <Text style={styles.boldFriend}>{selectedMatch.name}</Text>
                          </Text>
                          <Ionicons name="paper-plane" size={11} color={T.purple} />
                        </View>
                        <Text style={styles.hangForLabel}>
                          hang for{" "}
                          <Text style={styles.boldActivity}>
                            {activeActivityObj.name.toLowerCase()}?
                          </Text>
                        </Text>
                        <View style={styles.timeBadge}>
                          <Ionicons name="time" size={10} color={T.muted} />
                          <Text style={styles.timeBadgeText}>{getTimeLabel(time)}</Text>
                        </View>
                      </View>
                    </View>

                    <Pressable onPress={handleSend} style={styles.sendBtnShadow}>
                      <LinearGradient
                        colors={[...T.cta]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.sendInviteBtn}
                      >
                        <Ionicons name="paper-plane" size={14} color="#fff" />
                        <Text style={styles.sendInviteBtnText}>Send</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>

                  <Pressable onPress={() => router.push("/(tabs)/chats")} style={styles.viewChatBtn}>
                    <Ionicons name="chatbubbles" size={14} color={T.purple} />
                    <Text style={styles.viewChatText}>View Chat</Text>
                  </Pressable>
                </Animated.View>
              ) : (
                <View style={styles.lockCard}>
                  <View style={styles.lockIcon}>
                    <Ionicons name="lock-closed" size={20} color={T.purple} />
                  </View>
                  <Text style={styles.lockText}>
                    Unlock direct invites by swiping and making a mutual match first!
                  </Text>
                </View>
              )}

              {/* Quick links — friend plans vs public hangout */}
              <LinearGradient
                colors={["#1A1428", "#120F1C", "#1B1230"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickLinksPanel}
              >
                <View style={styles.darkGlowA} />
                <View style={styles.sectionHead}>
                  <LinearGradient colors={[...T.cta]} style={styles.sectionIconGrad}>
                    <Ionicons name="rocket" size={12} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitleDark}>Quick actions</Text>
                    <Text style={styles.sectionSubDark}>
                      Friend plans yahan · Hangout plans alag
                    </Text>
                  </View>
                </View>
                <View style={styles.quickLinks}>
                  <Pressable
                    style={styles.quickLinkDark}
                    onPress={() => {
                      setActiveTab("invite");
                      setPhase("plan");
                    }}
                  >
                    <LinearGradient colors={[...T.cta]} style={styles.quickLinkIcon}>
                      <Ionicons name="paper-plane" size={15} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.quickLinkTextDark}>New Invite</Text>
                    <Text style={styles.quickLinkHint}>Friend plan</Text>
                  </Pressable>
                  <Pressable
                    style={styles.quickLinkDark}
                    onPress={() => setActiveTab("plans")}
                  >
                    <LinearGradient
                      colors={["#A78BFA", "#7C3AED"]}
                      style={styles.quickLinkIcon}
                    >
                      <Ionicons name="calendar" size={15} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.quickLinkTextDark}>My Plans</Text>
                    <Text style={styles.quickLinkHint}>
                      {invites.length > 0 ? `${invites.length} active` : "Empty"}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.quickLinkDark} onPress={() => router.push("/hangout")}>
                    <LinearGradient
                      colors={["#34D399", "#059669"]}
                      style={styles.quickLinkIcon}
                    >
                      <Ionicons name="map" size={15} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.quickLinkTextDark}>Hangout</Text>
                    <Text style={styles.quickLinkHint}>Public plans</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </>
          ) : (
            <View style={styles.inviteContainer}>
              <InviteCard
                phase={phase === "sent" ? "sent" : "ready"}
                activityName={activeActivityObj.name}
                activityEmoji={activeActivityObj.emoji}
                friendName={selectedMatch ? selectedMatch.name : ""}
                friendAvatar={selectedMatch ? selectedMatch.avatarUrl : undefined}
                myAvatar={myAvatarUrl}
                timeLabel={getTimeLabel(time)}
                loading={sendingInvite}
                onClose={handleClose}
                onConfirm={handleConfirm}
              />
              {phase === "sent" ? (
                <Pressable
                  style={styles.viewPlansBtn}
                  onPress={() => {
                    setActiveTab("plans");
                    setPhase("plan");
                  }}
                >
                  <Ionicons name="calendar" size={16} color={T.purple} />
                  <Text style={styles.viewPlansBtnText}>View in My Plans</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <TabBar dark={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  ambient: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    zIndex: 0,
  },
  coolOrb: {
    position: "absolute",
    top: "45%",
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(125, 211, 252, 0.1)",
  },
  safe: { flex: 1, zIndex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: { alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerEyebrow: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.purple,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginTop: 1,
  },
  facepile: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 70,
    justifyContent: "flex-end",
  },
  face: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: T.bg,
  },
  faceMore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    borderWidth: 2,
    borderColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  faceMoreText: {
    color: T.purpleDeep,
    fontSize: 9,
    fontFamily: VibeFonts.bold,
  },

  segWrap: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 4,
    backgroundColor: T.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    gap: 4,
  },
  segItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  segItemActive: {
    backgroundColor: T.purple,
  },
  segText: {
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
  },
  segTextActive: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
  },
  segBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginLeft: 2,
  },
  segBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },

  plansHero: { marginBottom: 14 },
  plansHeroInner: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EDE7FF",
  },
  plansHeroTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    marginTop: 6,
  },
  plansHeroSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 6,
    lineHeight: 17,
  },
  plansHeroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  plansHeroCta: { borderRadius: 12, overflow: "hidden" },
  plansHeroCtaGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  plansHeroCtaText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  plansHeroSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: T.softPurple,
  },
  plansHeroSecondaryText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },
  planCard: {
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    marginBottom: 8,
  },
  planCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  planCardAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: T.purpleBright,
  },
  planCardTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  planCardSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 2,
  },
  planCardTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: T.softPurple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planCardTagText: {
    fontSize: 10,
    fontFamily: VibeFonts.semiBold,
    color: T.purpleDeep,
  },
  viewPlansBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  viewPlansBtnText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 4,
  },

  notifBanner: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.green,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    elevation: 8,
  },
  notifContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  notifIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  notifText: {
    color: T.ink,
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    flex: 1,
  },
  notifClose: { padding: 4 },

  heroWrap: { marginBottom: 12 },
  hero: {
    borderRadius: 22,
    minHeight: 132,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EDE7FF",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroBlob: {
    position: "absolute",
    right: -16,
    top: -28,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(139,92,246,0.12)",
  },
  heroCopy: { flex: 1, paddingRight: 8, zIndex: 2 },
  heroPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.softPurple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  heroPillText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: T.purpleDeep,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    lineHeight: 16,
    maxWidth: SCREEN_W * 0.5,
  },
  heroImage: {
    width: 108,
    height: 108,
    position: "absolute",
    right: -4,
    bottom: -8,
  },

  bannerWrap: { marginBottom: 14 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  bannerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.green,
  },
  bannerLeftText: {
    color: T.ink,
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
  },
  bannerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.pinkSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  bannerRightText: {
    color: T.pink,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },

  section: { marginBottom: 16 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: T.purple,
  },

  inviteItemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  inviteItemLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  inviteItemAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: T.purpleBright,
  },
  inviteItemInfo: { gap: 4, flex: 1 },
  inviteItemText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: T.ink,
  },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  inviteItemTime: {
    fontSize: 10,
    fontFamily: VibeFonts.regular,
    color: T.muted,
  },
  inviteActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  invActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  invRejectBtn: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  invAcceptGradient: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  boldFriend: { color: T.ink, fontFamily: VibeFonts.bold },
  accentFood: { color: T.purple, fontFamily: VibeFonts.bold },

  rsvpScroll: { gap: 10, paddingBottom: 4 },
  rsvpCard: {
    padding: 12,
    borderRadius: 16,
    width: 270,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rsvpHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  rsvpAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    borderColor: T.purpleBright,
  },
  rsvpTitle: { fontSize: 12, fontFamily: VibeFonts.bold, color: T.ink },
  rsvpSub: { fontSize: 10, fontFamily: VibeFonts.regular, color: T.muted },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  statusAccepted: {
    backgroundColor: T.greenSoft,
    borderColor: "#BBF7D0",
  },
  statusRejected: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  statusText: { fontSize: 9, fontFamily: VibeFonts.bold },
  rsvpJoined: { gap: 4 },
  joinedLabel: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: T.faint,
    letterSpacing: 0.4,
  },
  joinedRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  joinedFaces: { flexDirection: "row", alignItems: "center" },
  attFace: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: T.card,
  },
  joinedNames: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.ink,
    flex: 1,
  },

  darkPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    padding: 12,
    overflow: "hidden",
  },
  darkGlowA: {
    position: "absolute",
    top: -36,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(139,92,246,0.18)",
  },
  darkGlowB: {
    position: "absolute",
    bottom: -40,
    left: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(236,72,153,0.12)",
  },
  sectionIconGrad: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleDark: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#F8FAFC",
  },
  sectionSubDark: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(226,232,240,0.55)",
    marginTop: 1,
  },
  whenLivePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: T.pink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  whenLiveText: {
    fontSize: 9,
    fontFamily: VibeFonts.bold,
    color: "#fff",
    letterSpacing: 0.5,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  actWrap: { width: "23%" },
  actBtnDark: {
    width: "100%",
    height: 68,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: 4,
  },
  actIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  actNameDark: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "rgba(248,250,252,0.75)",
  },

  timeRow: { flexDirection: "row", gap: 7 },
  timeCardWrap: { flex: 1 },
  timeCardDark: {
    width: "100%",
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  timeCardDarkSelected: {
    borderColor: "rgba(167,139,250,0.55)",
    backgroundColor: "rgba(139,92,246,0.2)",
  },
  timeIconWrapDark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(167,139,250,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  timeIconGrad: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  timeLabelDark: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "rgba(248,250,252,0.7)",
    marginTop: 5,
  },
  timeLabelDarkSelected: { color: "#F8FAFC" },
  timeSubtextDark: {
    fontSize: 9,
    fontFamily: VibeFonts.regular,
    color: "rgba(226,232,240,0.4)",
    marginTop: 1,
  },
  timeSubtextDarkSelected: {
    color: "#C4B5FD",
    fontFamily: VibeFonts.semiBold,
  },

  matchScroll: { gap: 8, paddingVertical: 4 },
  matchItem: { alignItems: "center", width: 66, marginRight: 4 },
  matchRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2.5,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  matchRingSelected: {
    borderColor: T.purple,
  },
  matchAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: T.green,
    borderWidth: 2,
    borderColor: T.bg,
  },
  matchName: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 6,
    textAlign: "center",
  },
  matchNameSelected: {
    color: T.purpleDeep,
    fontFamily: VibeFonts.bold,
  },

  emptyMatches: {
    padding: Spacing.xl,
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyMatchesText: {
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    textAlign: "center",
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  emptyCtaText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },

  actionWrap: { marginBottom: 14, alignItems: "center" },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    width: "100%",
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    gap: 10,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatarWrap: { position: "relative" },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: T.purple,
  },
  activeDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: T.green,
    borderWidth: 1.5,
    borderColor: T.card,
  },
  actionTexts: { gap: 2, flex: 1 },
  sendToRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sendToLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  hangForLabel: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  boldActivity: { color: T.purple },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F0FA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  timeBadgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },
  sendBtnShadow: {
    borderRadius: 14,
    shadowColor: T.pink,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sendInviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  sendInviteBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  viewChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  viewChatText: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },

  lockCard: {
    padding: Spacing.xl,
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 14,
    gap: 8,
  },
  lockIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  lockText: {
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    textAlign: "center",
    lineHeight: 18,
  },

  quickLinksPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    padding: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  quickLinks: {
    flexDirection: "row",
    gap: 8,
  },
  quickLinkDark: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 5,
  },
  quickLinkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLinkTextDark: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#F8FAFC",
    textAlign: "center",
  },
  quickLinkHint: {
    fontSize: 9,
    fontFamily: VibeFonts.medium,
    color: "rgba(226,232,240,0.45)",
  },

  inviteContainer: {
    marginTop: 16,
    marginBottom: 40,
    paddingHorizontal: 4,
  },
});
