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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import GlassCard from "../components/vibe/GlassCard";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { API_URL } from "../constants/theme";
import { VibeColors, VibeFonts } from "../constants/vibeTheme";
import { Radius, Spacing } from "../constants/theme";
import {
  GENDER_OPTIONS,
  INTERESTED_IN_OPTIONS,
  INTEREST_OPTIONS,
  LOOKING_FOR_OPTIONS,
  GENDER_PREF_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
} from "../constants/onboarding";

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
          backgroundColor: color ? `${color}33` : "rgba(138,86,255,0.28)",
          borderColor: color || "#A78BFA",
        },
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
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
    // comma-separated fallback
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
            setGallery(photosRes.photos.map((ph) => ph.url));
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
        Alert.alert("Limit", "Max 8 interests.");
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
        Alert.alert("Limit", "You can add up to 6 photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
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

  const removeGalleryPhoto = async (index: number) => {
    const next = gallery.filter((_, i) => i !== index);
    if (next.length === 0) {
      Alert.alert("Keep one photo", "Dating profiles need at least one photo.");
      return;
    }
    setGallery(next);
    setAvatarUrl(next[0]);
    try {
      await api.setMyPhotos(next);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update photos");
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
        Alert.alert("Saved", "Profile updated successfully!", [
          { text: "OK", onPress: () => router.back() },
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

  const getAvatarUri = () => {
    if (previewUri) return previewUri;
    if (avatarUrl) {
      if (avatarUrl.startsWith("/")) {
        return `${API_URL.replace("/api", "")}${avatarUrl}`;
      }
      return avatarUrl;
    }
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";
  };

  const interestCountLabel = useMemo(
    () => `${interests.length}/8 selected`,
    [interests.length]
  );

  return (
    <View style={styles.root}>
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={VibeColors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Pressable onPress={handleSave} disabled={saving || uploading} hitSlop={8}>
              <Text style={styles.headerSave}>{saving ? "…" : "Save"}</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#C084FC" />
              <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.avatarSection}>
                <Text style={styles.sectionTitle}>Photos (up to 6)</Text>
                <Text style={styles.photoHint}>First photo is your main avatar</Text>
                <View style={styles.galleryGrid}>
                  {gallery.map((url, index) => (
                    <View key={`${url}-${index}`} style={styles.gallerySlot}>
                      <Image source={{ uri: resolvePhotoUri(url) }} style={styles.galleryImg} />
                      {index === 0 ? (
                        <View style={styles.mainBadge}>
                          <Text style={styles.mainBadgeText}>Main</Text>
                        </View>
                      ) : null}
                      <Pressable
                        style={styles.galleryRemove}
                        onPress={() => removeGalleryPhoto(index)}
                      >
                        <Ionicons name="close" size={12} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                  {gallery.length < 6 ? (
                    <Pressable
                      style={styles.galleryAdd}
                      onPress={handlePickImage}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <ActivityIndicator color="#C084FC" />
                      ) : (
                        <>
                          <Ionicons name="add" size={22} color="#C084FC" />
                          <Text style={styles.galleryAddText}>Add</Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  style={[styles.pauseToggle, isPaused && styles.pauseToggleOn]}
                  onPress={() => setIsPaused((v) => !v)}
                >
                  <Ionicons
                    name={isPaused ? "eye-off" : "eye"}
                    size={16}
                    color={isPaused ? "#FBBF24" : "#fff"}
                  />
                  <Text style={styles.pauseToggleText}>
                    {isPaused ? "Discovery paused (hidden)" : "Visible in discovery"}
                  </Text>
                </Pressable>
              </View>

              {/* Basics */}
              <GlassCard style={styles.formCard}>
                <Text style={styles.sectionTitle}>Basics</Text>

                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={18} color={VibeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>Age</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={18} color={VibeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={age}
                    onChangeText={setAge}
                    placeholder="18+"
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>City</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={18} color={VibeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g. Nagpur"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>Bio</Text>
                <View style={[styles.inputContainer, styles.bioContainer]}>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell others about yourself…"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    maxLength={300}
                    style={[styles.input, styles.bioInput]}
                  />
                </View>
                <Text style={styles.hint}>{bio.length}/300</Text>
              </GlassCard>

              {/* Work & college */}
              <GlassCard style={styles.formCard}>
                <Text style={styles.sectionTitle}>Work & college</Text>

                <Text style={styles.label}>Job title</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="briefcase-outline" size={18} color={VibeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="e.g. Designer"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>Company</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business-outline" size={18} color={VibeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={company}
                    onChangeText={setCompany}
                    placeholder="Where you work"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>College</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="school-outline" size={18} color={VibeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={college}
                    onChangeText={setCollege}
                    placeholder="e.g. VNIT"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>Height</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="resize-outline" size={18} color={VibeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    placeholder="e.g. 5'8&quot;"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                  />
                </View>
              </GlassCard>

              {/* Gender */}
              <GlassCard style={styles.formCard}>
                <Text style={styles.sectionTitle}>I am</Text>
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

                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Interested in</Text>
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
              </GlassCard>

              {/* Looking for */}
              <GlassCard style={styles.formCard}>
                <Text style={styles.sectionTitle}>Looking for</Text>
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
              </GlassCard>

              {/* Interests */}
              <GlassCard style={styles.formCard}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Interests</Text>
                  <Text style={styles.hint}>{interestCountLabel}</Text>
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
              </GlassCard>

              {/* Preferences */}
              <GlassCard style={styles.formCard}>
                <Text style={styles.sectionTitle}>Discover preferences</Text>

                <Text style={styles.label}>Show me</Text>
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

                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Min age</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        value={minAge}
                        onChangeText={setMinAge}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={styles.input}
                        placeholderTextColor="rgba(255,255,255,0.4)"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Max age</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        value={maxAge}
                        onChangeText={setMaxAge}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={styles.input}
                        placeholderTextColor="rgba(255,255,255,0.4)"
                      />
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Max distance (km)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="navigate-outline" size={18} color={VibeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={maxDistance}
                    onChangeText={setMaxDistance}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="25"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.input}
                  />
                </View>
              </GlassCard>

              {/* Lifestyle */}
              <GlassCard style={styles.formCard}>
                <Text style={styles.sectionTitle}>Lifestyle</Text>
                <Text style={styles.label}>Smoking</Text>
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
                <Text style={styles.label}>Drinking</Text>
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
              </GlassCard>

              <Pressable style={styles.saveWrap} onPress={handleSave} disabled={saving || uploading}>
                <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.saveBtn}>
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: VibeColors.bg },
  orb: { position: "absolute", borderRadius: 999 },
  orb1: {
    width: 220,
    height: 220,
    top: -70,
    right: -80,
    backgroundColor: "rgba(138,86,255,0.12)",
  },
  orb2: {
    width: 180,
    height: 180,
    bottom: 80,
    left: -70,
    backgroundColor: "rgba(255,75,129,0.08)",
  },
  safe: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VibeColors.bgGlassBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: VibeColors.text,
  },
  headerSave: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#C084FC",
    minWidth: 40,
    textAlign: "right",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, fontFamily: VibeFonts.medium, color: VibeColors.textMuted },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  avatarSection: { marginVertical: Spacing.md, gap: 8 },
  photoHint: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: VibeColors.textMuted,
    marginBottom: 4,
  },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gallerySlot: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  galleryImg: { width: "100%", height: "100%" },
  galleryRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(124,58,237,0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mainBadgeText: { fontSize: 9, fontFamily: VibeFonts.bold, color: "#fff" },
  galleryAdd: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(192,132,252,0.45)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  galleryAddText: { fontSize: 12, fontFamily: VibeFonts.bold, color: "#C084FC" },
  pauseToggle: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pauseToggleOn: {
    borderColor: "rgba(251,191,36,0.45)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  pauseToggleText: { fontSize: 13, fontFamily: VibeFonts.semiBold, color: "#fff" },
  avatarWrap: { position: "relative" },
  avatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 102, height: 102, borderRadius: 51 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#8A56FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  changePhotoText: { color: "#fff", fontSize: 12, fontFamily: VibeFonts.bold },
  formCard: { padding: Spacing.lg, gap: 10, marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: VibeColors.text,
    marginBottom: 4,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: VibeColors.textMuted,
    marginTop: 4,
  },
  hint: { fontSize: 11, fontFamily: VibeFonts.medium, color: VibeColors.textMuted },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: VibeColors.bgGlassBorder,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    color: VibeColors.text,
    fontFamily: VibeFonts.medium,
    fontSize: 14,
  },
  bioContainer: {
    height: 100,
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
  },
  bioInput: {
    height: "100%",
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipText: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: VibeColors.textMuted,
  },
  chipTextActive: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
  },
  row2: { flexDirection: "row", gap: 10 },
  saveWrap: { marginTop: Spacing.sm, marginBottom: Spacing.xl },
  saveBtn: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontSize: 15, fontFamily: VibeFonts.bold },
});
