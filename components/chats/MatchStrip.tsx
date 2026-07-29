import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import PulseDot from "../home/PulseDot";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

const T = {
  card: "#FFFFFF",
  ink: "#0F172A",
  muted: "#64748B",
  faint: "#94A3B8",
  border: "#E2E8F0",
  softPurple: "#F1F0FE",
  softPink: "#FDF2F8",
  purple: "#8B5CF6",
  pink: "#EC4899",
  cta: ["#8B5CF6", "#EC4899"] as const,
  ctaGold: ["#F59E0B", "#EF4444"] as const,
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
          <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sparkle}>
            <Ionicons name="sparkles" size={12} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>New Matches</Text>
        </View>
        <View style={styles.countPill}>
          <LinearGradient colors={["#EC48991A", "#8B5CF61A"]} style={styles.countPillGrad}>
            <Text style={styles.countText}>{matches.length} NEW</Text>
          </LinearGradient>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {matches.map((m) => (
          <Pressable
            key={m.id}
            style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
            onPress={() => onPressMatch(m)}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={m.isOnline ? [...T.cta] : ["#C4B5FD", "#F472B6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ring}
              >
                <Image source={{ uri: m.avatarUrl }} style={styles.avatar} />
              </LinearGradient>

              {m.isOnline ? (
                <View style={styles.online}>
                  <PulseDot size={5} color="#22C55E" />
                </View>
              ) : null}

              {m.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={9} color="#fff" />
                </View>
              ) : null}
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {m.name.split(" ")[0]}
            </Text>
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [styles.newCell, pressed && styles.cellPressed]}
          onPress={onDiscover}
        >
          <View style={styles.newRing}>
            <LinearGradient
              colors={["#8B5CF615", "#EC489915"]}
              style={styles.newRingGrad}
            >
              <Ionicons name="add" size={26} color={T.purple} />
            </LinearGradient>
          </View>
          <Text style={styles.newLabel}>Discover</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    marginHorizontal: 16,
    backgroundColor: T.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    paddingVertical: 14,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sparkle: {
    width: 24,
    height: 24,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.2,
  },
  countPill: {
    borderRadius: 12,
    overflow: "hidden",
  },
  countPillGrad: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  countText: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: T.pink,
    letterSpacing: 0.5,
  },
  scroll: { paddingHorizontal: 16, gap: 14 },
  cell: { alignItems: "center", width: 72 },
  cellPressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },
  avatarContainer: { position: "relative", marginBottom: 6 },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 24,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  avatar: {
    width: 61,
    height: 61,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  online: {
    position: "absolute",
    top: 1,
    right: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 2.5,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: T.purple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.ink,
    textAlign: "center",
  },
  newCell: { alignItems: "center", width: 72 },
  newRing: {
    width: 68,
    height: 68,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#C4B5FD",
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 6,
  },
  newRingGrad: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  newLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
  },
});

