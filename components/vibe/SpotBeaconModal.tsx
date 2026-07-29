import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { VibeFonts } from "../../constants/vibeTheme";
import { api } from "../../services/api";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const VENUE_PRESETS = [
  { id: "cafe", name: "Starbucks / Cafe", emoji: "☕", icon: "cafe", color: "#F59E0B" },
  { id: "food", name: "Pizza / Dinner", emoji: "🍕", icon: "pizza", color: "#EF4444" },
  { id: "movie", name: "Cinema / Movie", emoji: "🍿", icon: "film", color: "#8B5CF6" },
  { id: "drive", name: "Late Drive", emoji: "🚗", icon: "car", color: "#3B82F6" },
  { id: "drinks", name: "Pub / Cocktails", emoji: "🍸", icon: "wine", color: "#EC4899" },
  { id: "gaming", name: "Gaming / Arcade", emoji: "🎮", icon: "game-controller", color: "#10B981" },
];

const TIME_PRESETS = [
  { label: "30 Mins ⚡", val: 30 },
  { label: "45 Mins ⏳", val: 45 },
  { label: "1 Hour ⌛", val: 60 },
];

export default function SpotBeaconModal({ visible, onClose }: Props) {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState(VENUE_PRESETS[0]);
  const [venueName, setVenueName] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleBroadcastSpot = async () => {
    const finalVenue = venueName.trim() || selectedPreset.name;
    setLoading(true);

    try {
      await api.updateSocialStatus({
        energy: "LESSGO",
        freeNow: true,
        activity: `${selectedPreset.emoji} at ${finalVenue}`,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
      onClose();
      router.push({
        pathname: "/spot-radar",
        params: {
          venue: finalVenue,
          vibe: selectedPreset.name,
          emoji: selectedPreset.emoji,
          duration: String(duration),
        },
      });
    }
  };

  const handleShareToWhatsApp = async () => {
    const finalVenue = venueName.trim() || selectedPreset.name;
    setLoading(true);
    try {
      const res = await api.createPublicInvite({
        activityName: selectedPreset.name,
        activityEmoji: selectedPreset.emoji,
        timeLabel: `At ${finalVenue} for next ${duration} mins!`,
      });

      const shareMsg = `Hey! Sitting at ${finalVenue} (${selectedPreset.emoji}). Join my table: ${
        res?.inviteUrl || "https://vibematch.app"
      }`;
      await Share.share({ message: shareMsg });
    } catch {
      const shareMsg = `Sitting at ${finalVenue} (${selectedPreset.emoji}) right now! Join me: https://vibematch.app`;
      await Share.share({ message: shareMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <Animated.View entering={FadeInDown.duration(280)} style={styles.sheet}>
          <View style={styles.dragHandle} />

          {/* Icon Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LinearGradient colors={["#7C3AED", "#EC4899"]} style={styles.badgeIconWrap}>
                <Ionicons name="flash" size={16} color="#FFF" />
              </LinearGradient>
              <View>
                <Text style={styles.title}>Live Spot Beacon</Text>
                <Text style={styles.subtitle}>Broadcast venue & scan nearby 📍</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Visual Icon Grid Presets */}
            <Text style={styles.secLabel}>WHERE ARE YOU AT?</Text>
            <View style={styles.presetsGrid}>
              {VENUE_PRESETS.map((item) => {
                const isSelected = selectedPreset.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.presetTile, isSelected && styles.presetTileSelected]}
                    onPress={() => setSelectedPreset(item)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.tileIconCircle, { backgroundColor: `${item.color}15` }]}>
                      <Text style={{ fontSize: 44 }}>{item.emoji}</Text>
                    </View>
                    <Text style={[styles.tileName, isSelected && styles.tileNameSelected]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.activeCheck}>
                        <Ionicons name="checkmark" size={10} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Location Input */}
            <View style={styles.inputWrap}>
              <Ionicons name="location-sharp" size={16} color="#7C3AED" style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.input}
                placeholder="Or custom spot (e.g. Cafe Mocha, Block B)..."
                placeholderTextColor="#94A3B8"
                value={venueName}
                onChangeText={setVenueName}
              />
            </View>

            {/* Duration Timer Chips */}
            <Text style={styles.secLabel}>TIMER DURATION</Text>
            <View style={styles.timeRow}>
              {TIME_PRESETS.map((t) => {
                const isSelected = duration === t.val;
                return (
                  <TouchableOpacity
                    key={t.val}
                    style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                    onPress={() => setDuration(t.val)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.broadcastBtn}
              onPress={handleBroadcastSpot}
              disabled={loading}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#10B981", "#059669", "#047857"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.broadcastBtnGrad}
              >
                <Ionicons name={"radar" as any} size={20} color="#FFF" />
                <Text style={styles.broadcastBtnText}>
                  {loading ? "Scanning..." : "SCAN NEARBY USERS ⚡"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareToWhatsApp}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={16} color="#166534" />
              <Text style={styles.shareBtnText}>Share Table Link</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "flex-end",
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "82%",
    paddingTop: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badgeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FD",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  secLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  presetTile: {
    width: "31%",
    backgroundColor: "#F8F9FD",
    borderRadius: 18,
    padding: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    position: "relative",
    marginBottom: 2,
  },
  presetTileSelected: {
    backgroundColor: "#F3E8FF",
    borderColor: "#7C3AED",
  },
  tileIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  tileName: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#18181B",
    textAlign: "center",
  },
  tileNameSelected: {
    color: "#7C3AED",
  },
  activeCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 42,
    marginTop: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#0F172A",
  },
  timeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  timeChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F8F9FD",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  timeChipSelected: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  timeText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
  },
  timeTextSelected: {
    color: "#FFF",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  broadcastBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  broadcastBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
  },
  broadcastBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.5,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  shareBtnText: {
    color: "#166534",
    fontSize: 11,
    fontFamily: VibeFonts.bold,
  },
});
