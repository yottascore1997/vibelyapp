import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import PulseDot from "../home/PulseDot";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

const T = {
  card: "rgba(22, 26, 46, 0.94)",
  ink: "#F4F6FB",
  muted: "#A7B0C4",
  faint: "#7C869C",
  border: "rgba(160, 170, 200, 0.16)",
  softPurple: "rgba(139, 92, 246, 0.18)",
  purple: "#A78BFA",
  pink: "#F472B6",
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
          <Text style={styles.title}>New Matches</Text>
        </View>
        <View style={styles.countPill}>
          <LinearGradient
            colors={["rgba(236,72,153,0.2)", "rgba(139,92,246,0.2)"]}
            style={styles.countPillGrad}
          >
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
                colors={m.isOnline ? [...T.cta] : ["#7C3AED", "#DB2777"]}
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

        {onDiscover ? (
          <Pressable
            style={({ pressed }) => [styles.newCell, pressed && styles.cellPressed]}
            onPress={onDiscover}
          >
            <View style={styles.newRing}>
              <LinearGradient
                colors={["rgba(139,92,246,0.15)", "rgba(236,72,153,0.15)"]}
                style={styles.newRingGrad}
              >
                <Ionicons name="add" size={26} color={T.purple} />
              </LinearGradient>
            </View>
            <Text style={styles.newLabel}>Discover</Text>
          </Pressable>
        ) : null}
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
    borderColor: T.border,
    paddingVertical: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
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
    borderColor: "rgba(236, 72, 153, 0.35)",
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
  },
  avatar: {
    width: 61,
    height: 61,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#1A2238",
  },
  online: {
    position: "absolute",
    top: 1,
    right: 1,
    backgroundColor: "#12182C",
    borderRadius: 10,
    padding: 2.5,
    borderWidth: 1.5,
    borderColor: "#1A2238",
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
    borderColor: "#1A2238",
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
    borderColor: "rgba(167, 139, 250, 0.5)",
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
