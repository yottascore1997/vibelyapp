import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { API_URL } from "../constants/theme";
import { VibeFonts } from "../constants/vibeTheme";
import {
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  INTEREST_OPTIONS,
  LOOKING_FOR_OPTIONS,
  GENDER_PREF_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  WORKOUT_OPTIONS,
  DIET_OPTIONS,
} from "../constants/onboarding";

const { width: SCREEN_W } = Dimensions.get("window");

const T = {
  bg: "#070A14",
  card: "#0D1424",
  cardElevated: "#121C33",
  cardGlass: "rgba(18, 28, 51, 0.75)",
  border: "rgba(255, 255, 255, 0.08)",
  borderFocus: "rgba(34, 211, 238, 0.4)",
  ink: "#FFFFFF",
  muted: "#94A3B8",
  soft: "#64748B",
  gold: "#D4F72C",
  goldSoft: "rgba(212, 247, 44, 0.12)",
  cyan: "#22D3EE",
  cyanSoft: "rgba(34, 211, 238, 0.12)",
  green: "#22C55E",
  ctaGrad: ["#D4F72C", "#22D3EE"] as [string, string],
};

function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && {
          backgroundColor: color ? `${color}25` : "rgba(212, 247, 44, 0.14)",
          borderColor: color || T.gold,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active && {
            color: color || T.gold,
            fontFamily: VibeFonts.bold,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function parseLookingFor(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fallback
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseInterests(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => item?.interest?.name || item?.name || (typeof item === "string" ? item : null))
    .filter(Boolean);
}

export default function EditProfileScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [college, setCollege] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");
  const [interestedIn, setInterestedIn] = useState("");
  const [genderPreference, setGenderPreference] = useState("");
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("35");
  const [maxDistance, setMaxDistance] = useState("25");
  const [smoking, setSmoking] = useState("");
  const [drinking, setDrinking] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;
      try {
        const res = (await api.getProfile(token)) as any;
        if (res) {
          const p = res.profile || {};
          setName(p.firstName || res.name || "");
          setBio(p.bio || "");
          setCity(p.city || "");
          setAge(p.age != null ? String(p.age) : "");
          setJobTitle(p.jobTitle || "");
          setCompany(p.company || "");
          setCollege(p.college || "");
          setHeight(p.height || "");
          setGender(p.gender || "");
          setInterestedIn(p.interestedIn || "");
          setGenderPreference(p.genderPreference || p.interestedIn || "");
          setMinAge(p.minAge != null ? String(p.minAge) : "18");
          setMaxAge(p.maxAge != null ? String(p.maxAge) : "35");
          setMaxDistance(p.maxDistance != null ? String(p.maxDistance) : "25");
          setSmoking(p.smoking || "");
          setDrinking(p.drinking || "");
          setInterests(parseInterests(p.interests));
          setLookingFor(parseLookingFor(p.lookingFor));
          setAvatarUrl(p.avatarUrl || "");
          setIsPaused(!!p.isPaused);
        }
        try {
          const photosRes = await api.getMyPhotos();
          if (photosRes?.photos?.length) {
            setGallery(photosRes.photos.map((ph: any) => ph.url));
            if (photosRes.avatarUrl) setAvatarUrl(photosRes.avatarUrl);
          } else if (res?.profile?.avatarUrl) {
            setGallery([res.profile.avatarUrl]);
          }
        } catch {
          if (res?.profile?.avatarUrl) setGallery([res.profile.avatarUrl]);
        }
      } catch (err) {
        console.error("Load profile failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token]);

  const toggleInterest = (name: string) => {
    setInterests((prev) => {
      if (prev.includes(name)) return prev.filter((x) => x !== name);
      if (prev.length >= 8) {
        Alert.alert("Limit Reached", "You can pick up to 8 interests.");
        return prev;
      }
      return [...prev, name];
    });
  };

  const toggleLookingFor = (id: string) => {
    setLookingFor((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const resolvePhotoUri = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/")) return `${API_URL.replace("/api", "")}${url}`;
    return url;
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Gallery permission is needed to upload photos.");
        return;
      }

      if (gallery.length >= 6) {
        Alert.alert("Limit Reached", "You can add up to 6 photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]) {
        const selectedUri = result.assets[0].uri;
        setUploading(true);
        if (!token) return;
        const uploadRes = await api.uploadImage(selectedUri, token);
        if (uploadRes?.url) {
          const next = [...gallery, uploadRes.url].slice(0, 6);
          setGallery(next);
          setAvatarUrl(next[0]);
          setPreviewUri(selectedUri);
          await api.setMyPhotos(next);
        } else {
          Alert.alert("Upload Error", "Photo upload failed. Try again.");
        }
      }
    } catch (err) {
      console.error("Pick image error:", err);
      Alert.alert("Error", "Could not pick image.");
    } finally {
      setUploading(false);
    }
  };

  const confirmDeletePhoto = (index: number) => {
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
            setAvatarUrl(next[0] || "");
            try {
              await api.setMyPhotos(next);
              if (token && next[0]) {
                await api.updateProfile({ avatarUrl: next[0] }, token);
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
            onPress: () => confirmDeletePhoto(index),
          },
          { text: "Done", style: "cancel" },
        ]
      );
    } else {
      Alert.alert("Manage Photo", "What would you like to do?", [
        {
          text: "⭐ Set as Main Photo",
          onPress: async () => {
            const chosen = gallery[index];
            const next = [chosen, ...gallery.filter((_, i) => i !== index)];
            setGallery(next);
            setAvatarUrl(next[0]);
            try {
              await api.setMyPhotos(next);
              if (token) {
                await api.updateProfile({ avatarUrl: next[0] }, token);
              }
              Alert.alert("Updated! ✨", "This photo is now your main profile picture.");
            } catch (e) {
              Alert.alert("Error", "Could not update main photo");
            }
          },
        },
        {
          text: "🗑️ Delete Photo",
          style: "destructive",
          onPress: () => confirmDeletePhoto(index),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    if (!token) return;

    const ageNum = age.trim() ? Number(age) : undefined;
    if (ageNum != null && (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 99)) {
      Alert.alert("Invalid age", "Age must be between 18 and 99.");
      return;
    }

    setSaving(true);
    try {
      if (gallery.length === 0) {
        Alert.alert("Add a photo", "Upload at least one profile photo before saving.");
        setSaving(false);
        return;
      }
      await api.setMyPhotos(gallery);
      const updateRes = await api.updateProfile(
        {
          firstName: name.trim(),
          bio: bio.trim(),
          city: city.trim(),
          avatarUrl: gallery[0] || avatarUrl || undefined,
          age: ageNum,
          jobTitle: jobTitle.trim() || undefined,
          company: company.trim() || undefined,
          college: college.trim() || undefined,
          height: height.trim() || undefined,
          gender: gender || undefined,
          interestedIn: interestedIn || undefined,
          genderPreference: genderPreference || interestedIn || undefined,
          minAge: Number(minAge) || 18,
          maxAge: Number(maxAge) || 35,
          maxDistance: Number(maxDistance) || 25,
          smoking: smoking || undefined,
          drinking: drinking || undefined,
          interests,
          lookingFor,
          isPaused,
          onboardingDone: true,
        },
        token
      );

      if (updateRes) {
        Alert.alert("Saved! ✨", "Profile updated successfully!", [
          { text: "Awesome", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", "Could not save profile changes.");
      }
    } catch (err: any) {
      console.error("Save profile error:", err);
      Alert.alert("Error", err?.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const interestCountLabel = useMemo(
    () => `${interests.length}/8 selected`,
    [interests.length]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070A14" />

      {/* ── TOP EXECUTIVE HEADER ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Customize your vibe presence</Text>
        </View>

        <Pressable
          style={styles.headerSavePill}
          onPress={handleSave}
          disabled={saving || uploading}
          hitSlop={8}
        >
          <LinearGradient
            colors={T.ctaGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerSaveGrad}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#070A14" />
            ) : (
              <Text style={styles.headerSaveText}>Save</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={T.gold} />
            <Text style={styles.loadingText}>Loading your profile data…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: Math.max(insets.bottom, 20) + 90 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── 1. PHOTOS (UP TO 6) ── */}
            <Animated.View entering={FadeIn.duration(320)} style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Profile Photos <Text style={{ color: T.muted }}>({gallery.length}/6)</Text>
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Tap a photo to set as Main or tap 🗑️ to delete
                  </Text>
                </View>
              </View>

              <View style={styles.galleryGrid}>
                {gallery.map((url, index) => (
                  <Pressable
                    key={`${url}-${index}`}
                    style={styles.gallerySlot}
                    onPress={() => handlePhotoPress(index)}
                  >
                    <Image source={{ uri: resolvePhotoUri(url) }} style={styles.galleryImg} />
                    {index === 0 ? (
                      <View style={styles.mainBadge}>
                        <Ionicons name="star" size={10} color="#070A14" />
                        <Text style={styles.mainBadgeText}>MAIN</Text>
                      </View>
                    ) : (
                      <View style={styles.manageHintBadge}>
                        <Text style={styles.manageHintText}>Tap to set</Text>
                      </View>
                    )}
                    <Pressable
                      style={styles.galleryRemove}
                      onPress={(e) => {
                        e.stopPropagation();
                        confirmDeletePhoto(index);
                      }}
                      hitSlop={8}
                    >
                      <Ionicons name="trash" size={13} color="#FFFFFF" />
                    </Pressable>
                  </Pressable>
                ))}

                {gallery.length < 6 && (
                  <Pressable
                    style={styles.galleryAdd}
                    onPress={handlePickImage}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator color={T.cyan} />
                    ) : (
                      <>
                        <View style={styles.addIconCircle}>
                          <Ionicons name="camera-outline" size={20} color={T.cyan} />
                        </View>
                        <Text style={styles.galleryAddText}>Add Photo</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {/* ── 2. DISCOVERY STATUS CARD ── */}
            <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.sectionCard}>
              <View style={styles.discoveryRow}>
                <View style={[styles.discIconBox, { backgroundColor: isPaused ? "rgba(250,204,21,0.12)" : "rgba(34,211,238,0.12)" }]}>
                  <Ionicons
                    name={isPaused ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={isPaused ? T.gold : T.cyan}
                  />
                </View>
                <View style={styles.discTextCol}>
                  <Text style={styles.discTitle}>Discovery Visibility</Text>
                  <Text style={styles.discDesc}>
                    {isPaused
                      ? "Profile hidden from the discover deck"
                      : "Visible to active people nearby"}
                  </Text>
                </View>
                <Switch
                  value={!isPaused}
                  onValueChange={(val) => setIsPaused(!val)}
                  trackColor={{ false: "#1E293B", true: "#22D3EE" }}
                  thumbColor={!isPaused ? "#070A14" : "#94A3B8"}
                />
              </View>
            </Animated.View>

            {/* ── 3. BASICS INFORMATION ── */}
            <Animated.View entering={FadeInDown.delay(100).duration(320)} style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Basic Information</Text>

              {/* First Name */}
              <Text style={styles.fieldLabel}>First Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={17} color={T.gold} style={styles.inputIcon} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your display name"
                  placeholderTextColor={T.soft}
                  style={styles.input}
                />
              </View>

              {/* Age & City Row */}
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={17} color={T.cyan} style={styles.inputIcon} />
                    <TextInput
                      value={age}
                      onChangeText={setAge}
                      placeholder="18+"
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholderTextColor={T.soft}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={{ flex: 1.6 }}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={17} color={T.gold} style={styles.inputIcon} />
                    <TextInput
                      value={city}
                      onChangeText={setCity}
                      placeholder="e.g. Mumbai"
                      placeholderTextColor={T.soft}
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>

              {/* Bio */}
              <View style={styles.bioHeaderRow}>
                <Text style={styles.fieldLabel}>Bio / Vibe Description</Text>
                <Text style={styles.charCount}>{bio.length}/300</Text>
              </View>
              <View style={[styles.inputContainer, styles.bioContainer]}>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Share what makes you tick, favorite hangout spots, chai preferences..."
                  placeholderTextColor={T.soft}
                  multiline
                  maxLength={300}
                  style={[styles.input, styles.bioInput]}
                />
              </View>
            </Animated.View>

            {/* ── 4. WORK & EDUCATION ── */}
            <Animated.View entering={FadeInDown.delay(130).duration(320)} style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Work & Education</Text>

              {/* Job Title */}
              <Text style={styles.fieldLabel}>Job Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="briefcase-outline" size={17} color={T.cyan} style={styles.inputIcon} />
                <TextInput
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  placeholder="e.g. Product Designer"
                  placeholderTextColor={T.soft}
                  style={styles.input}
                />
              </View>

              {/* Company */}
              <Text style={styles.fieldLabel}>Company / Workspace</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={17} color={T.gold} style={styles.inputIcon} />
                <TextInput
                  value={company}
                  onChangeText={setCompany}
                  placeholder="e.g. Google / Freelancer"
                  placeholderTextColor={T.soft}
                  style={styles.input}
                />
              </View>

              {/* College & Height Row */}
              <View style={styles.row2}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.fieldLabel}>College / University</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="school-outline" size={17} color={T.cyan} style={styles.inputIcon} />
                    <TextInput
                      value={college}
                      onChangeText={setCollege}
                      placeholder="e.g. IIT / St. Xavier's"
                      placeholderTextColor={T.soft}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Height</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="resize-outline" size={17} color={T.gold} style={styles.inputIcon} />
                    <TextInput
                      value={height}
                      onChangeText={setHeight}
                      placeholder={`e.g. 5'10"`}
                      placeholderTextColor={T.soft}
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* ── 5. GENDER & ORIENTATION ── */}
            <Animated.View entering={FadeInDown.delay(160).duration(320)} style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Identity & Orientation</Text>

              <Text style={styles.fieldLabel}>I am</Text>
              <View style={styles.chipRow}>
                {GENDER_OPTIONS.map((g) => (
                  <Chip
                    key={g.id}
                    label={`${g.emoji} ${g.label}`}
                    active={gender === g.id}
                    onPress={() => setGender(g.id)}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Interested in seeing</Text>
              <View style={styles.chipRow}>
                {INTERESTED_IN_OPTIONS.map((g) => (
                  <Chip
                    key={g.id}
                    label={`${g.emoji} ${g.label}`}
                    active={interestedIn === g.id}
                    onPress={() => {
                      setInterestedIn(g.id);
                      setGenderPreference(g.id);
                    }}
                  />
                ))}
              </View>
            </Animated.View>

            {/* ── 6. LOOKING FOR ── */}
            <Animated.View entering={FadeInDown.delay(190).duration(320)} style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Looking For</Text>
                <Text style={styles.charCount}>Tap to select</Text>
              </View>

              <View style={styles.chipRow}>
                {LOOKING_FOR_OPTIONS.map((o) => (
                  <Chip
                    key={o.id}
                    label={`${o.emoji} ${o.label}`}
                    active={lookingFor.includes(o.id)}
                    onPress={() => toggleLookingFor(o.id)}
                    color={o.color}
                  />
                ))}
              </View>
            </Animated.View>

            {/* ── 7. INTERESTS & PASSIONS ── */}
            <Animated.View entering={FadeInDown.delay(220).duration(320)} style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Passions & Hobbies</Text>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterBadgeText}>{interestCountLabel}</Text>
                </View>
              </View>

              <View style={styles.chipRow}>
                {INTEREST_OPTIONS.map((o) => (
                  <Chip
                    key={o.name}
                    label={o.name}
                    active={interests.includes(o.name)}
                    onPress={() => toggleInterest(o.name)}
                    color={o.color}
                  />
                ))}
              </View>
            </Animated.View>

            {/* ── 8. DISCOVERY PREFERENCES ── */}
            <Animated.View entering={FadeInDown.delay(250).duration(320)} style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Matching Preferences</Text>

              <Text style={styles.fieldLabel}>Show me</Text>
              <View style={styles.chipRow}>
                {GENDER_PREF_OPTIONS.map((g) => (
                  <Chip
                    key={g.id}
                    label={`${g.emoji} ${g.label}`}
                    active={genderPreference === g.id}
                    onPress={() => setGenderPreference(g.id)}
                  />
                ))}
              </View>

              <View style={[styles.row2, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Min Age</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={minAge}
                      onChangeText={setMinAge}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={styles.input}
                      placeholderTextColor={T.soft}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Max Age</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      value={maxAge}
                      onChangeText={setMaxAge}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={styles.input}
                      placeholderTextColor={T.soft}
                    />
                  </View>
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Max Distance (km)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="navigate-outline" size={17} color={T.cyan} style={styles.inputIcon} />
                <TextInput
                  value={maxDistance}
                  onChangeText={setMaxDistance}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="25"
                  placeholderTextColor={T.soft}
                  style={styles.input}
                />
              </View>
            </Animated.View>

            {/* ── 9. LIFESTYLE HABITS ── */}
            <Animated.View entering={FadeInDown.delay(280).duration(320)} style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Lifestyle Habits</Text>

              <Text style={styles.fieldLabel}>Smoking</Text>
              <View style={styles.chipRow}>
                {SMOKING_OPTIONS.map((o) => (
                  <Chip
                    key={o.id}
                    label={`${o.emoji} ${o.label}`}
                    active={smoking === o.id}
                    onPress={() => setSmoking(o.id)}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Drinking</Text>
              <View style={styles.chipRow}>
                {DRINKING_OPTIONS.map((o) => (
                  <Chip
                    key={o.id}
                    label={`${o.emoji} ${o.label}`}
                    active={drinking === o.id}
                    onPress={() => setDrinking(o.id)}
                  />
                ))}
              </View>
            </Animated.View>

            {/* ── 10. PRIMARY SAVE ACTION BUTTON ── */}
            <View style={styles.bottomSaveWrap}>
              <Pressable
                style={styles.saveActionBtn}
                onPress={handleSave}
                disabled={saving || uploading}
              >
                <LinearGradient
                  colors={T.ctaGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveActionGrad}
                >
                  {saving ? (
                    <ActivityIndicator color="#070A14" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={19} color="#070A14" />
                      <Text style={styles.saveActionText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  keyboardView: {
    flex: 1,
  },
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
  },

  /* ── Header ── */
  header: {
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitleCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 1,
  },
  headerSavePill: {
    borderRadius: 999,
    overflow: "hidden",
  },
  headerSaveGrad: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSaveText: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* ── Card Style ── */
  sectionCard: {
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    marginTop: 2,
  },

  /* ── Photos Grid ── */
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  gallerySlot: {
    width: (SCREEN_W - 32 - 32 - 20) / 3,
    height: (SCREEN_W - 32 - 32 - 20) / 3 * 1.25,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#131C33",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  galleryImg: {
    width: "100%",
    height: "100%",
  },
  galleryRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
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
  manageHintBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(7, 10, 20, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  manageHintText: {
    fontSize: 8,
    fontFamily: VibeFonts.medium,
    color: "#CBD5E1",
  },
  mainBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: T.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mainBadgeText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#070A14",
    letterSpacing: 0.6,
  },
  galleryAdd: {
    width: (SCREEN_W - 32 - 32 - 20) / 3,
    height: (SCREEN_W - 32 - 32 - 20) / 3 * 1.25,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(34, 211, 238, 0.35)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 211, 238, 0.04)",
    gap: 6,
  },
  addIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryAddText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.cyan,
  },

  /* ── Discovery Card ── */
  discoveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  discIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  discTextCol: {
    flex: 1,
  },
  discTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.bold,
  },
  discDesc: {
    color: T.muted,
    fontSize: 11,
    fontFamily: VibeFonts.regular,
    marginTop: 2,
  },

  /* ── Form Inputs ── */
  fieldLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.muted,
    marginTop: 6,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: VibeFonts.medium,
    fontSize: 14,
  },
  bioHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 6,
  },
  charCount: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.soft,
  },
  bioContainer: {
    height: 96,
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  bioInput: {
    height: "100%",
    textAlignVertical: "top",
  },
  row2: {
    flexDirection: "row",
    gap: 12,
  },

  /* ── Chips ── */
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  chipText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
  },
  counterBadge: {
    backgroundColor: "rgba(212, 247, 44, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  counterBadgeText: {
    color: T.gold,
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },

  /* ── Bottom Save Action ── */
  bottomSaveWrap: {
    marginTop: 8,
    marginBottom: 30,
  },
  saveActionBtn: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: T.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  saveActionGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  saveActionText: {
    color: "#070A14",
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
  },
});
