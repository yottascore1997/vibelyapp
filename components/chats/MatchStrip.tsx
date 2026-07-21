import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import PulseDot from "../home/PulseDot";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

const T = {
  card: "#FFFBFE",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E4DFF0",
  softPurple: "#EDE7FF",
  softPink: "#FCE7F3",
  purple: "#8B5CF6",
  pink: "#EC4899",
  cta: ["#8B5CF6", "#EC4899"] as const,
};

interface Props {
  matches: MatchProfile[];
  onPressMatch: (match: MatchProfile) => void;
  onDiscover?: () => void;
}

export default function MatchStrip({ matches, onPressMatch, onDiscover }: Props) {
  if (matches.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LinearGradient colors={[...T.cta]} style={styles.sparkle}>
            <Ionicons name="sparkles" size={11} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>New matches</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{matches.length}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {matches.map((m) => (
          <Pressable key={m.id} style={styles.cell} onPress={() => onPressMatch(m)}>
            <LinearGradient colors={[...T.cta]} style={styles.ring}>
              <Image source={{ uri: m.avatarUrl }} style={styles.avatar} />
            </LinearGradient>
            {m.isOnline ? (
              <View style={styles.online}>
                <PulseDot size={5} color="#22C55E" />
              </View>
            ) : null}
            <Text style={styles.name} numberOfLines={1}>
              {m.name.split(" ")[0]}
            </Text>
            {m.isVerified ? (
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={T.purple}
                style={styles.verified}
              />
            ) : null}
          </Pressable>
        ))}
        <Pressable style={styles.newCell} onPress={onDiscover}>
          <View style={styles.newRing}>
            <Ionicons name="add" size={24} color={T.purple} />
          </View>
          <Text style={styles.newLabel}>Find more</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    backgroundColor: T.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sparkle: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  countPill: {
    backgroundColor: T.softPink,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F9A8D4",
  },
  countText: { fontSize: 11, fontFamily: VibeFonts.bold, color: T.pink },
  scroll: { paddingHorizontal: 14, gap: 12 },
  cell: { alignItems: "center", width: 70, position: "relative" },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 22,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 57,
    height: 57,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#fff",
  },
  online: {
    position: "absolute",
    top: 2,
    right: 4,
    backgroundColor: T.card,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  name: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.ink,
    marginTop: 6,
    textAlign: "center",
  },
  verified: { position: "absolute", bottom: 18, right: 6 },
  newCell: { alignItems: "center", width: 70 },
  newRing: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#C4B5FD",
    borderStyle: "dashed",
    backgroundColor: T.softPurple,
  },
  newLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 6,
  },
});
