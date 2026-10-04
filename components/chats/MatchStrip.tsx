import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import PulseDot from "../home/PulseDot";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

const RING_GRADIENTS = [
  ["#22D3EE", "#06B6D4"] as const,
  ["#D4F72C", "#22D3EE"] as const,
  ["#F43F5E", "#FB7185"] as const,
  ["#A855F7", "#C084FC"] as const,
  ["#F59E0B", "#FBBF24"] as const,
];

interface Props {
  matches: MatchProfile[];
  onPressMatch: (match: MatchProfile) => void;
  onDiscover?: () => void;
}

export default function MatchStrip({ matches, onPressMatch, onDiscover }: Props) {
  if (!matches || matches.length === 0) return null;
  const isEmpty = matches.length === 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>New Matches 🔥</Text>
        </View>
        <View style={styles.countPill}>
          <LinearGradient
            colors={
              isEmpty
                ? ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.04)"]
                : ["rgba(212, 247, 44, 0.15)", "rgba(34, 211, 238, 0.15)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.countPillGrad, isEmpty && styles.countPillGradEmpty]}
          >
            <Text style={[styles.countText, isEmpty && styles.countTextEmpty]}>
              {isEmpty ? "0 NEW" : `${matches.length} NEW`}
            </Text>
          </LinearGradient>
        </View>
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          {onDiscover ? (
            <Pressable
              style={({ pressed }) => [styles.emptyActionRow, pressed && styles.cellPressed]}
              onPress={onDiscover}
            >
              <View style={styles.emptyIconCircle}>
                <LinearGradient
                  colors={["rgba(34, 211, 238, 0.18)", "rgba(212, 247, 44, 0.12)"]}
                  style={styles.emptyIconGrad}
                >
                  <Ionicons name="sparkles" size={22} color="#D4F72C" />
                </LinearGradient>
              </View>
              <View style={styles.emptyTextCol}>
                <Text style={styles.emptyTitle}>No new matches yet</Text>
                <Text style={styles.emptySub}>
                  Swipe on Discover or join Hangouts to find your match!
                </Text>
              </View>
              <View style={styles.emptyCtaBadge}>
                <LinearGradient
                  colors={["#D4F72C", "#22D3EE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyCtaBadgeGrad}
                >
                  <Text style={styles.emptyCtaBadgeText}>Discover</Text>
                  <Ionicons name="chevron-forward" size={12} color="#070A14" />
                </LinearGradient>
              </View>
            </Pressable>
          ) : (
            <View style={styles.emptyTextColOnly}>
              <Text style={styles.emptyTitle}>No new matches yet</Text>
              <Text style={styles.emptySub}>
                Check back soon or explore new people on Discover.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {matches.map((m, idx) => {
            const grad = RING_GRADIENTS[idx % RING_GRADIENTS.length];
            return (
              <Pressable
                key={m.id}
                style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
                onPress={() => onPressMatch(m)}
              >
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[...grad]}
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
                      <Ionicons name="checkmark" size={10} color="#070A14" />
                    </View>
                  ) : null}
                </View>

                <Text style={styles.name} numberOfLines={1}>
                  {m.name.split(" ")[0]}
                </Text>
              </Pressable>
            );
          })}

          {onDiscover ? (
            <Pressable
              style={({ pressed }) => [styles.newCell, pressed && styles.cellPressed]}
              onPress={onDiscover}
            >
              <View style={styles.newRing}>
                <LinearGradient
                  colors={["rgba(34, 211, 238, 0.12)", "rgba(212, 247, 44, 0.08)"]}
                  style={styles.newRingGrad}
                >
                  <Ionicons name="add" size={26} color="#22D3EE" />
                </LinearGradient>
              </View>
              <Text style={styles.newLabel}>Discover</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    marginHorizontal: 16,
    backgroundColor: "#0D1424",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
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
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  countPill: {
    borderRadius: 12,
    overflow: "hidden",
  },
  countPillGrad: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.35)",
  },
  countText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#D4F72C",
    letterSpacing: 0.5,
  },
  scroll: { paddingHorizontal: 16, gap: 14 },
  cell: { alignItems: "center", width: 70 },
  cellPressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },
  avatarContainer: { position: "relative", marginBottom: 6 },
  ring: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#0D1424",
  },
  online: {
    position: "absolute",
    top: 1,
    right: 1,
    backgroundColor: "#070A14",
    borderRadius: 10,
    padding: 2.5,
    borderWidth: 1.5,
    borderColor: "#0D1424",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#22D3EE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0D1424",
  },
  name: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#FFFFFF",
    textAlign: "center",
  },
  newCell: { alignItems: "center", width: 70 },
  newRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    borderColor: "rgba(34, 211, 238, 0.4)",
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
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  countPillGradEmpty: {
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  countTextEmpty: {
    color: "#94A3B8",
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
  },
  emptyActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  emptyIconGrad: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(212, 247, 44, 0.25)",
  },
  emptyTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  emptyTextColOnly: {
    alignItems: "center",
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  emptySub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 2,
    lineHeight: 15,
  },
  emptyCtaBadge: {
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyCtaBadgeGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  emptyCtaBadgeText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#070A14",
  },
});
