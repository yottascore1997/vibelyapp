import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import PulseDot from "../home/PulseDot";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

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
          <Ionicons name="sparkles" size={14} color="#FBBF24" />
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
            <LinearGradient colors={["#FF4B81", "#8A56FF"]} style={styles.ring}>
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
                color="#60A5FA"
                style={styles.verified}
              />
            ) : null}
          </Pressable>
        ))}
        <Pressable style={styles.newCell} onPress={onDiscover}>
          <View style={styles.newRing}>
            <Ionicons name="add" size={24} color="#C084FC" />
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
    backgroundColor: "#12121A",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: {
    fontSize: 14,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  countPill: {
    backgroundColor: "rgba(255,75,129,0.18)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,75,129,0.35)",
  },
  countText: { fontSize: 11, fontFamily: VibeFonts.bold, color: "#FF4B81" },
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
    borderColor: "#0A0A10",
  },
  online: {
    position: "absolute",
    top: 2,
    right: 4,
    backgroundColor: "#050508",
    borderRadius: 8,
    padding: 2,
  },
  name: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: "rgba(255,255,255,0.85)",
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
    borderColor: "rgba(192,132,252,0.4)",
    borderStyle: "dashed",
    backgroundColor: "rgba(138,86,255,0.1)",
  },
  newLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.4)",
    marginTop: 6,
  },
});
