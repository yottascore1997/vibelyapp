import React, { useState, useEffect } from "react";
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

export default function EditProfileScreen() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;
      try {
        const res = await api.getProfile(token) as any;
        if (res) {
          setName(res.profile?.firstName || res.name || "");
          setBio(res.profile?.bio || "");
          setCity(res.profile?.city || "");
          setAvatarUrl(res.profile?.avatarUrl || "");
        }
      } catch (err) {
        console.error("Load profile failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token]);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Gallery permission is needed to upload photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const selectedUri = result.assets[0].uri;
        setPreviewUri(selectedUri);

        // Upload immediately
        setUploading(true);
        if (!token) return;
        const uploadRes = await api.uploadImage(selectedUri, token);
        if (uploadRes?.url) {
          setAvatarUrl(uploadRes.url);
          Alert.alert("Success", "Photo uploaded successfully!");
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }

    if (!token) return;
    setSaving(true);

    try {
      const updateRes = await api.updateProfile(
        {
          firstName: name,
          bio,
          city,
          avatarUrl,
        },
        token
      );

      if (updateRes) {
        Alert.alert("Success", "Profile updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", "Could not save profile changes.");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      Alert.alert("Error", "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const getAvatarUri = () => {
    if (previewUri) return previewUri;
    if (avatarUrl) {
      if (avatarUrl.startsWith("/")) {
        const serverBaseUrl = API_URL.replace("/api", "");
        return `${serverBaseUrl}${avatarUrl}`;
      }
      return avatarUrl;
    }
    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";
  };

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
            <View style={{ width: 40 }} />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#C084FC" />
              <Text style={styles.loadingText}>Loading profile details...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarWrap}>
                  <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.avatarBorder}>
                    <Image source={{ uri: getAvatarUri() }} style={styles.avatar} />
                  </LinearGradient>
                  {uploading && (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator color="#fff" size="small" />
                    </View>
                  )}
                </View>
                <Pressable style={styles.changePhotoBtn} onPress={handlePickImage} disabled={uploading}>
                  <Ionicons name="camera" size={16} color="#fff" />
                  <Text style={styles.changePhotoText}>{uploading ? "Uploading..." : "Change Photo"}</Text>
                </Pressable>
              </View>

              <GlassCard style={styles.formCard}>
                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={18} color={VibeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your Name"
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
                    placeholder="Tell others about yourself..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    numberOfLines={4}
                    maxLength={300}
                    style={[styles.input, styles.bioInput]}
                  />
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
  orb1: { width: 220, height: 220, top: -70, right: -80, backgroundColor: "rgba(138,86,255,0.12)" },
  orb2: { width: 180, height: 180, bottom: 80, left: -70, backgroundColor: "rgba(255,75,129,0.08)" },
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, fontFamily: VibeFonts.medium, color: VibeColors.textMuted },
  scroll: { padding: Spacing.lg },
  avatarSection: { alignItems: "center", marginVertical: Spacing.lg },
  avatarWrap: { position: "relative" },
  avatarBorder: { width: 110, height: 110, borderRadius: 55, padding: 3, alignItems: "center", justifyContent: "center" },
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
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  changePhotoText: { color: "#fff", fontSize: 12, fontFamily: VibeFonts.bold },
  formCard: { padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.xl },
  label: { fontSize: 13, fontFamily: VibeFonts.bold, color: VibeColors.text, marginBottom: -4 },
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
  saveWrap: { marginBottom: Spacing.xl },
  saveBtn: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF4B81",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  saveText: { color: "#fff", fontSize: 15, fontFamily: VibeFonts.bold },
});
