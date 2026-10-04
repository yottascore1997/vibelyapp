import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Share,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { usePremium } from "../../context/PremiumContext";
import { api } from "../../services/api";
import { API_URL } from "../../constants/theme";
import { VibeFonts } from "../../constants/vibeTheme";

const { width: SCREEN_W } = Dimensions.get("window");

const T = {
  bg: "#070A14",
  card: "#0D1424",
  cardElevated: "#121C33",
  cardGlass: "rgba(18, 28, 51, 0.75)",
  border: "rgba(255, 255, 255, 0.08)",
  borderSubtle: "rgba(255, 255, 255, 0.05)",
  borderActive: "rgba(212, 247, 44, 0.35)",
  ink: "#FFFFFF",
  muted: "#94A3B8",
  soft: "#64748B",
  gold: "#D4F72C",
  goldSoft: "rgba(212, 247, 44, 0.12)",
  cyan: "#22D3EE",
  cyanSoft: "rgba(34, 211, 238, 0.12)",
  green: "#22C55E",
  greenSoft: "rgba(34, 197, 94, 0.14)",
  yellow: "#FACC15",
  yellowSoft: "rgba(250, 204, 21, 0.14)",
  red: "#F87171",
  redSoft: "rgba(248, 113, 113, 0.12)",
  purple: "#A855F7",
  purpleSoft: "rgba(168, 85, 247, 0.12)",
  ctaGrad: ["#D4F72C", "#22D3EE"] as [string, string],
  vipGrad: ["#F59E0B", "#D97706", "#B45309"] as [string, string, string],
  goldGrad: ["#8B5CF6", "#6D28D9", "#4C1D95"] as [string, string, string],
};

function LiveBeacon() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.4 + pulse.value * 0.6,
    transform: [{ scale: 1 + pulse.value * 0.3 }],
  }));

  return (
    <View style={styles.beaconWrap}>
      <Animated.View style={[styles.beaconGlow, style]} />
      <View style={styles.beaconDot} />
    </View>
  );
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { openPaywall, tier, isPremium } = usePremium();
  const { openNotifications, unreadCount } = useNotifications();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<any>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = (await api.getProfile(token)) as any;
      if (res) {
        setProfile(res.profile);
        setIsPaused(!!res.profile?.isPaused);
      }
      try {
        const photosRes = await api.getMyPhotos();
        if (photosRes?.photos?.length) {
          setGallery(photosRes.photos.map((ph: any) => ph.url));
        } else if (res?.profile?.avatarUrl) {
          setGallery([res.profile.avatarUrl]);
        }
      } catch {
        if (res?.profile?.avatarUrl) setGallery([res.profile.avatarUrl]);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const resolveAvatar = (url?: string | null) => {
    if (!url) {
      return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&fit=crop";
    }
    if (url.startsWith("/")) {
      return `${API_URL.replace("/api", "")}${url}`;
    }
    return url;
  };

  const displayName = profile?.firstName || user?.name || "You";
  const age = profile?.age ? `, ${profile.age}` : "";
  const city = profile?.city || "City not set";
  const jobLine = [profile?.jobTitle, profile?.company].filter(Boolean).join(" @ ");
  const college = profile?.college;
  const avatarUri = resolveAvatar(profile?.avatarUrl);

  const interests = useMemo(() => {
    const raw = profile?.interests;
    if (!Array.isArray(raw) || raw.length === 0) return [] as string[];
    return raw
      .map((i: any) => (typeof i === "string" ? i : i?.interest?.name || i?.name))
      .filter(Boolean)
      .slice(0, 8) as string[];
  }, [profile?.interests]);

  const lookingFor = useMemo(() => {
    const raw = profile?.lookingFor;
    if (!Array.isArray(raw) || raw.length === 0) return [] as string[];
    return raw
      .map((i: any) => (typeof i === "string" ? i : i?.name))
      .filter(Boolean)
      .slice(0, 4) as string[];
  }, [profile?.lookingFor]);

  const completeness = useMemo(() => {
    let n = 0;
    const checks = [
      !!profile?.avatarUrl,
      !!profile?.bio,
      !!profile?.city,
      !!profile?.age,
      !!jobLine,
      interests.length > 0,
      gallery.length >= 2,
    ];
    checks.forEach((ok) => {
      if (ok) n += 1;
    });
    return Math.round((n / checks.length) * 100);
  }, [profile, jobLine, interests.length, gallery.length]);

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to change your profile picture."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingAvatar(true);
        if (!token) return;
        const uploadRes = await api.uploadImage(result.assets[0].uri, token);
        if (uploadRes?.url) {
          const nextGallery = [uploadRes.url, ...gallery.filter((g) => g !== uploadRes.url)].slice(0, 6);
          setGallery(nextGallery);
          setProfile((prev: any) => ({ ...prev, avatarUrl: uploadRes.url }));
          await api.updateProfile({ avatarUrl: uploadRes.url }, token);
          await api.setMyPhotos(nextGallery);
          Alert.alert("Success! 📸", "Profile photo updated successfully!");
        } else {
          Alert.alert("Upload Error", "Photo upload failed. Please try again.");
        }
      }
    } catch (e) {
      console.warn("Avatar upload error:", e);
      Alert.alert("Error", "Could not pick image.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const confirmDeleteGalleryPhoto = (index: number) => {
    if (gallery.length <= 1) {
      Alert.alert(
        "Cannot Delete",
        "You must keep at least one profile photo for your profile to remain active."
      );
      return;
    }
    Alert.alert(
      "Delete Photo?",
      "Are you sure you want to remove this photo from your profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const next = gallery.filter((_, i) => i !== index);
            setGallery(next);
            try {
              await api.setMyPhotos(next);
              if (index === 0 && next[0]) {
                setProfile((prev: any) => ({ ...prev, avatarUrl: next[0] }));
                if (token) {
                  await api.updateProfile({ avatarUrl: next[0] }, token);
                }
              }
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Could not delete photo");
            }
          },
        },
      ]
    );
  };

  const handlePhotoPress = (index: number) => {
    if (index === 0) {
      Alert.alert(
        "Main Profile Photo",
        "This is your primary avatar seen first by people nearby.",
        [
          {
            text: "🗑️ Delete Photo",
            style: "destructive",
            onPress: () => confirmDeleteGalleryPhoto(index),
          },
          { text: "Done", style: "cancel" },
        ]
      );
    } else {
      Alert.alert("Manage Photo", "What would you like to do with this photo?", [
        {
          text: "⭐ Set as Main Photo",
          onPress: async () => {
            const chosen = gallery[index];
            const next = [chosen, ...gallery.filter((_, i) => i !== index)];
            setGallery(next);
            setProfile((prev: any) => ({ ...prev, avatarUrl: next[0] }));
            try {
              await api.setMyPhotos(next);
              if (token) {
                await api.updateProfile({ avatarUrl: next[0] }, token);
              }
              Alert.alert("Updated! ✨", "This photo is now your main profile picture.");
            } catch (e) {
              Alert.alert("Error", "Could not set main photo");
            }
          },
        },
        {
          text: "🗑️ Delete Photo",
          style: "destructive",
          onPress: () => confirmDeleteGalleryPhoto(index),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleToggleDiscovery = async (val: boolean) => {
    setIsPaused(val);
    if (!token) return;
    try {
      await api.updateProfile({ isPaused: val }, token);
      Alert.alert(
        val ? "Discovery Paused ⏸️" : "Discovery Active ⚡",
        val
          ? "Your profile is hidden from the deck. Existing matches can still message you."
          : "You are visible to people nearby on Hangora!"
      );
    } catch {
      setIsPaused(!val);
      Alert.alert("Error", "Could not update discovery settings.");
    }
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Connect with me on Hangora! Join my crew and let's vibe: https://hangora.app/user/${user?.id || ""}`,
      });
    } catch {
      // dismissed
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of Hangora?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account & Data",
      "Are you completely sure? This will permanently delete your account, matches, plans, and photos. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await api.deleteAccount(token || undefined);
              Alert.alert("Account Deleted", "Your profile and data have been removed.");
              await logout();
              router.replace("/(auth)/welcome");
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Could not delete account. Try again.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070A14" />

      {/* ── TOP EXECUTIVE PROFILE HEADER ── */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <View style={styles.headerLeftCol}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={styles.liveChip}>
              <LiveBeacon />
              <Text style={styles.liveChipText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Public presence & personal vibe</Text>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={handleShareProfile}
            hitSlop={8}
          >
            <Ionicons name="qr-code-outline" size={19} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={styles.headerIconBtn}
            onPress={openNotifications}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.push("/edit-profile")}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={19} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 110 },
        ]}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={T.gold} />
            <Text style={styles.loaderText}>Loading your executive vibe…</Text>
          </View>
        ) : (
          <>
            {/* ── 1. LUXURY HERO PROFILE CARD ── */}
            <Animated.View entering={FadeIn.duration(380)} style={styles.heroCard}>
              <LinearGradient
                colors={["rgba(34, 211, 238, 0.08)", "rgba(212, 247, 44, 0.04)", "rgba(13, 20, 36, 0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Avatar + Main Details Row */}
              <View style={styles.heroProfileRow}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={["#D4F72C", "#22D3EE", "#A855F7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarBorderRing}
                  >
                    <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                  </LinearGradient>

                  {/* 1-Tap Quick Camera/Upload Overlay */}
                  <Pressable
                    style={styles.avatarUploadBtn}
                    onPress={handlePickAvatar}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color="#070A14" />
                    ) : (
                      <Ionicons name="camera" size={14} color="#070A14" />
                    )}
                  </Pressable>
                </View>

                {/* Identity & Status */}
                <View style={styles.heroIdentityCol}>
                  <View style={styles.nameVerifiedRow}>
                    <Text style={styles.heroName} numberOfLines={1}>
                      {displayName}
                      <Text style={styles.heroAge}>{age}</Text>
                    </Text>
                    {profile?.isVerified !== false && (
                      <View style={styles.verifiedShield}>
                        <Ionicons name="shield-checkmark" size={14} color="#22D3EE" />
                      </View>
                    )}
                  </View>

                  {/* Tagline / City */}
                  <View style={styles.heroLocationRow}>
                    <Ionicons name="location-sharp" size={13} color={T.gold} />
                    <Text style={styles.heroLocationText} numberOfLines={1}>
                      {city}
                    </Text>
                    {jobLine ? (
                      <>
                        <Text style={styles.dotSep}>•</Text>
                        <Ionicons name="briefcase" size={12} color={T.cyan} />
                        <Text style={styles.heroJobText} numberOfLines={1}>
                          {jobLine}
                        </Text>
                      </>
                    ) : null}
                  </View>

                  {/* Membership Pill */}
                  <View style={styles.membershipRow}>
                    {isPremium ? (
                      <View style={styles.vipBadge}>
                        <Ionicons name="diamond" size={11} color="#070A14" />
                        <Text style={styles.vipBadgeText}>
                          {tier === "VIP" ? "VIBE VIP" : "VIBE GOLD"}
                        </Text>
                      </View>
                    ) : (
                      <Pressable style={styles.freeMemberBadge} onPress={openPaywall}>
                        <Ionicons name="sparkles" size={11} color={T.gold} />
                        <Text style={styles.freeMemberBadgeText}>UPGRADE TO GOLD</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>

              {/* Bio snippet */}
              <View style={styles.bioBox}>
                <Text style={styles.bioText} numberOfLines={3}>
                  {profile?.bio ||
                    "Add a captivating bio so people nearby understand your hangout vibe."}
                </Text>
              </View>

              {/* Dual Action Buttons: Edit Profile & Public Preview */}
              <View style={styles.heroActionsRow}>
                <Pressable
                  style={styles.primaryActionBtn}
                  onPress={() => router.push("/edit-profile")}
                >
                  <LinearGradient
                    colors={T.ctaGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryActionGrad}
                  >
                    <Ionicons name="sparkles" size={16} color="#070A14" />
                    <Text style={styles.primaryActionText}>Edit Profile</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.secondaryActionBtn}
                  onPress={() => {
                    if (user?.id) {
                      router.push(`/user/${user.id}`);
                    } else {
                      router.push("/edit-profile");
                    }
                  }}
                >
                  <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.secondaryActionText}>Preview View</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* ── PROFILE STRENGTH & COMPLETION METER ── */}
            <Animated.View
              entering={FadeInDown.delay(70).duration(340)}
              style={styles.strengthCard}
            >
              <View style={styles.strengthHeaderRow}>
                <View style={styles.strengthTitleCol}>
                  <View style={styles.strengthBadgeRow}>
                    <Text style={styles.strengthHeading}>Profile Strength</Text>
                    <View style={styles.allStarChip}>
                      <Ionicons name="star" size={11} color="#070A14" />
                      <Text style={styles.allStarText}>
                        {completeness >= 80 ? "Vibe Master" : "Vibe Rookie"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.strengthSub}>
                    {completeness >= 80
                      ? "Your profile stands out! You get 4x more hang invites."
                      : "Complete bio & add 2 photos for higher match discovery."}
                  </Text>
                </View>
                <Text style={styles.strengthPercentText}>{completeness}%</Text>
              </View>

              {/* Smooth Progress Track */}
              <View style={styles.strengthProgressBarWrap}>
                <LinearGradient
                  colors={completeness >= 80 ? ["#22C55E", "#D4F72C"] : ["#D4F72C", "#22D3EE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.strengthProgressFill, { width: `${completeness}%` }]}
                />
              </View>

              {completeness < 100 && (
                <Pressable
                  style={styles.strengthActionRow}
                  onPress={() => router.push("/edit-profile")}
                >
                  <Text style={styles.strengthActionText}>
                    ✨ Complete remaining details (+{100 - completeness}%)
                  </Text>
                  <Ionicons name="arrow-forward" size={13} color={T.gold} />
                </Pressable>
              )}
            </Animated.View>

            {/* ── 5. MY PHOTOS & MOMENTS STRIP ── */}
            <Animated.View
              entering={FadeInDown.delay(170).duration(340)}
              style={styles.sectionWrap}
            >
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>
                  My Photos <Text style={{ color: T.muted }}>({gallery.length}/6)</Text>
                </Text>
                <Pressable onPress={() => router.push("/edit-profile")}>
                  <Text style={styles.sectionLink}>Manage →</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {/* Add Photo Button Tile */}
                <Pressable style={styles.addPhotoTile} onPress={handlePickAvatar}>
                  <LinearGradient
                    colors={["rgba(34, 211, 238, 0.12)", "rgba(212, 247, 44, 0.05)"]}
                    style={styles.addPhotoGrad}
                  >
                    <Ionicons name="add" size={24} color={T.cyan} />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </LinearGradient>
                </Pressable>

                {gallery.map((photoUrl, idx) => (
                  <Pressable
                    key={photoUrl + idx}
                    style={styles.photoThumbWrap}
                    onPress={() => handlePhotoPress(idx)}
                  >
                    <Image source={{ uri: resolveAvatar(photoUrl) }} style={styles.photoThumbImg} />
                    {idx === 0 ? (
                      <View style={styles.mainPhotoTag}>
                        <Text style={styles.mainPhotoTagText}>MAIN</Text>
                      </View>
                    ) : (
                      <View style={styles.thumbHintTag}>
                        <Text style={styles.thumbHintTagText}>Tap to set</Text>
                      </View>
                    )}
                    <Pressable
                      style={styles.photoDeleteBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        confirmDeleteGalleryPhoto(idx);
                      }}
                      hitSlop={8}
                    >
                      <Ionicons name="trash" size={11} color="#FFFFFF" />
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>

            {/* ── 6. VIBE DNA & INTERESTS CHIPS ── */}
            {(interests.length > 0 || lookingFor.length > 0) && (
              <Animated.View
                entering={FadeInDown.delay(200).duration(340)}
                style={styles.sectionWrap}
              >
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>Vibe DNA & Passions</Text>
                  <Pressable onPress={() => router.push("/edit-profile")}>
                    <Text style={styles.sectionLink}>Edit →</Text>
                  </Pressable>
                </View>

                {lookingFor.length > 0 && (
                  <View style={styles.tagGroupBlock}>
                    <Text style={styles.tagGroupLabel}>LOOKING FOR</Text>
                    <View style={styles.tagChipsWrap}>
                      {lookingFor.map((item) => (
                        <View key={item} style={styles.lookingForChip}>
                          <Ionicons name="sparkles" size={11} color={T.gold} />
                          <Text style={styles.lookingForText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {interests.length > 0 && (
                  <View style={[styles.tagGroupBlock, { marginTop: 10 }]}>
                    <Text style={styles.tagGroupLabel}>PASSIONS & HOBBIES</Text>
                    <View style={styles.tagChipsWrap}>
                      {interests.map((tag) => (
                        <View key={tag} style={styles.interestChip}>
                          <Text style={styles.interestChipText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {/* ── 7. VIP / GOLD PRIVILEGE BANNER ── */}
            <Animated.View entering={FadeInDown.delay(230).duration(340)}>
              <Pressable onPress={openPaywall} style={styles.membershipCardWrap}>
                <LinearGradient
                  colors={
                    tier === "VIP"
                      ? T.vipGrad
                      : isPremium
                      ? T.goldGrad
                      : (["#181438", "#251D4A", "#171438"] as [string, string, string])
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.membershipCardGrad}
                >
                  <View style={styles.membershipLeft}>
                    <View style={styles.diamondCircle}>
                      <Ionicons name="diamond" size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.membershipEyebrow}>EXCLUSIVE MEMBERSHIP</Text>
                      <Text style={styles.membershipTitle}>
                        {tier === "VIP"
                          ? "VibeVIP Active"
                          : tier === "GOLD"
                          ? "VibeGold Active"
                          : "Unlock Hangora Gold"}
                      </Text>
                      <Text style={styles.membershipDesc}>
                        {isPremium
                          ? "All VIP radar perks, unlimited chats & badge active"
                          : "See who liked you, unlimited pings & spot boosts"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.membershipCtaPill}>
                    <Text style={styles.membershipCtaText}>
                      {isPremium ? "Manage" : "Upgrade"}
                    </Text>
                    <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* ── 8. ACCOUNT, SAFETY & SETTINGS HUB ── */}
            <Animated.View
              entering={FadeInDown.delay(260).duration(340)}
              style={styles.sectionWrap}
            >
              <Text style={styles.sectionHeaderTitle}>Account & Privacy Hub</Text>

              <View style={styles.hubCard}>
                {/* 1. Quick Discovery Toggle Row */}
                <View style={styles.hubRow}>
                  <View style={[styles.hubIconCircle, { backgroundColor: "rgba(34, 211, 238, 0.12)" }]}>
                    <Ionicons name="eye-outline" size={17} color={T.cyan} />
                  </View>
                  <View style={styles.hubCopyCol}>
                    <Text style={styles.hubLabel}>Discovery Mode</Text>
                    <Text style={styles.hubSub}>
                      {isPaused
                        ? "Profile hidden from discover deck"
                        : "Visible to active people nearby"}
                    </Text>
                  </View>
                  <Switch
                    value={!isPaused}
                    onValueChange={(val) => handleToggleDiscovery(!val)}
                    trackColor={{ false: "#1E293B", true: "#22D3EE" }}
                    thumbColor={!isPaused ? "#070A14" : "#94A3B8"}
                  />
                </View>


                {/* 3. My Hangouts */}
                <Pressable
                  style={styles.hubRow}
                  onPress={() => router.push("/hangout")}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: "rgba(34, 197, 94, 0.12)" }]}>
                    <Ionicons name="calendar-outline" size={17} color={T.green} />
                  </View>
                  <View style={styles.hubCopyCol}>
                    <Text style={styles.hubLabel}>My Hangouts</Text>
                    <Text style={styles.hubSub}>Scheduled plans, Chai & events</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={T.soft} />
                </Pressable>

                {/* 4. Match Preferences */}
                <Pressable
                  style={styles.hubRow}
                  onPress={() => router.push("/edit-profile")}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: "rgba(168, 85, 247, 0.12)" }]}>
                    <Ionicons name="options-outline" size={17} color={T.purple} />
                  </View>
                  <View style={styles.hubCopyCol}>
                    <Text style={styles.hubLabel}>Matching Preferences</Text>
                    <Text style={styles.hubSub}>Age range, distance & gender filter</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={T.soft} />
                </Pressable>

                {/* 5. Safety & Trust */}
                <Pressable
                  style={styles.hubRow}
                  onPress={() => {
                    Alert.alert(
                      "Safety & Trust Center 🛡️",
                      "• Always meet in public places (cafes, malls, parks).\n• Tell a friend where you're going.\n• You can Block or Report anyone instantly from their chat.\n• Hangora uses verified phone authentication.",
                      [{ text: "Got it" }]
                    );
                  }}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: "rgba(56, 189, 248, 0.12)" }]}>
                    <Ionicons name="shield-checkmark-outline" size={17} color="#38BDF8" />
                  </View>
                  <View style={styles.hubCopyCol}>
                    <Text style={styles.hubLabel}>Safety & Trust</Text>
                    <Text style={styles.hubSub}>Guidelines, safety tips & reporting</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={T.soft} />
                </Pressable>
              </View>
            </Animated.View>

            {/* ── 9. DANGER ACTIONS (LOGOUT & DELETE) ── */}
            <View style={styles.dangerSection}>
              <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color="#F87171" />
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </Pressable>

              <Pressable
                style={styles.deleteBtn}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#94A3B8" />
                ) : (
                  <Text style={styles.deleteBtnText}>Delete Account & Data</Text>
                )}
              </Pressable>
            </View>

            {/* ── FOOTER BRANDING ── */}
            <View style={styles.brandFooter}>
              <Text style={styles.brandFooterText}>HANGORA · VIBE ENGINE 2.0</Text>
              <Text style={styles.brandFooterSub}>Real connections in real time ✨</Text>
            </View>
          </>
        )}
      </ScrollView>
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
    paddingTop: 12,
  },
  loaderWrap: {
    height: 380,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },

  /* ── Header ── */
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#070A14",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    zIndex: 10,
  },
  headerLeftCol: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.4,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  beaconWrap: {
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  beaconGlow: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(34, 197, 94, 0.4)",
  },
  beaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  liveChipText: {
    color: "#22C55E",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#070A14",
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
  },

  /* ── 1. Hero Card ── */
  heroCard: {
    backgroundColor: T.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.2)",
    padding: 18,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarBorderRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#131C33",
  },
  avatarUploadBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#070A14",
    elevation: 4,
  },
  heroIdentityCol: {
    flex: 1,
  },
  nameVerifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  heroAge: {
    color: T.muted,
    fontSize: 18,
    fontFamily: VibeFonts.bold,
  },
  verifiedShield: {
    marginLeft: 2,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  heroLocationText: {
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },
  dotSep: {
    color: T.soft,
    fontSize: 11,
    marginHorizontal: 2,
  },
  heroJobText: {
    color: T.muted,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    flexShrink: 1,
  },
  membershipRow: {
    marginTop: 8,
    flexDirection: "row",
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  vipBadgeText: {
    color: "#070A14",
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.6,
  },
  freeMemberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(212, 247, 44, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  freeMemberBadgeText: {
    color: T.gold,
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    letterSpacing: 0.4,
  },
  bioBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  bioText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontFamily: VibeFonts.regular,
    lineHeight: 18,
  },
  heroActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  primaryActionBtn: {
    flex: 1.2,
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryActionGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
  },
  primaryActionText: {
    color: "#070A14",
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  secondaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },

  /* ── 2. Social Energy Controller ── */
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: VibeFonts.bold,
  },
  sectionLink: {
    color: T.cyan,
    fontSize: 13,
    fontFamily: VibeFonts.bold,
  },

  /* ── Profile Strength ── */
  strengthCard: {
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.18)",
    padding: 16,
    marginBottom: 16,
  },
  strengthHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  strengthTitleCol: {
    flex: 1,
  },
  strengthBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  strengthHeading: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: VibeFonts.bold,
  },
  allStarChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.gold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  allStarText: {
    color: "#070A14",
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
  },
  strengthSub: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    lineHeight: 16,
  },
  strengthPercentText: {
    color: T.gold,
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    marginLeft: 12,
  },
  strengthProgressBarWrap: {
    height: 7,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  strengthProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  strengthActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  strengthActionText: {
    color: T.gold,
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },

  /* ── 5. Photos Strip ── */
  galleryScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  addPhotoTile: {
    width: 96,
    height: 124,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(34, 211, 238, 0.35)",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  addPhotoGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: {
    color: T.cyan,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
  photoThumbWrap: {
    width: 96,
    height: 124,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#131C33",
  },
  photoThumbImg: {
    width: "100%",
    height: "100%",
  },
  mainPhotoTag: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(7, 10, 20, 0.8)",
    borderWidth: 1,
    borderColor: T.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mainPhotoTagText: {
    color: T.gold,
    fontSize: 8,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.6,
  },
  photoDeleteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  thumbHintTag: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(7, 10, 20, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  thumbHintTagText: {
    color: "#CBD5E1",
    fontSize: 8,
    fontFamily: VibeFonts.medium,
  },

  /* ── 6. Vibe DNA / Tags ── */
  tagGroupBlock: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  tagGroupLabel: {
    color: T.soft,
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  tagChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  lookingForChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(212, 247, 44, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  lookingForText: {
    color: T.gold,
    fontSize: 12,
    fontFamily: VibeFonts.bold,
  },
  interestChip: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  interestChipText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
  },

  /* ── 7. Membership Privilege ── */
  membershipCardWrap: {
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  membershipCardGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  membershipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  diamondCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  membershipEyebrow: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.8,
  },
  membershipTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    marginTop: 2,
  },
  membershipDesc: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },
  membershipCtaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  membershipCtaText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },

  /* ── 8. Account & Privacy Hub ── */
  hubCard: {
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  hubRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  hubIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  hubCopyCol: {
    flex: 1,
  },
  hubLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  hubSub: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },

  /* ── 9. Danger Section ── */
  dangerSection: {
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(248, 113, 113, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.2)",
    borderRadius: 16,
    paddingVertical: 13,
  },
  logoutBtnText: {
    color: "#F87171",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  deleteBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  deleteBtnText: {
    color: T.soft,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    textDecorationLine: "underline",
  },

  /* ── Footer ── */
  brandFooter: {
    alignItems: "center",
    paddingVertical: 12,
  },
  brandFooterText: {
    color: T.soft,
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 1,
  },
  brandFooterSub: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },
});
