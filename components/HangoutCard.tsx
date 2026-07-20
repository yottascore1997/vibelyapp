import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../constants/theme";

interface Props {
  title: string;
  description: string;
  location: string;
  time: string;
  distance: number;
  going: number;
  maxParticipants: number;
  badge: string;
  imageUrl: string;
  color?: string;
  dark?: boolean;
  onJoin?: () => void;
}

export default function HangoutCard({
  title,
  description,
  location,
  time,
  distance,
  going,
  maxParticipants,
  badge,
  imageUrl,
  color = Colors.primary,
  dark,
  onJoin,
}: Props) {
  return (
    <View style={[styles.card, dark && styles.cardDark]}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Ionicons name="location" size={10} color="#fff" />
          <Text style={styles.distanceText}>{distance} km</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
        <Text style={[styles.description, dark && styles.descriptionDark]} numberOfLines={2}>
          {description}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={dark ? "rgba(255,255,255,0.5)" : Colors.textSecondary} />
          <Text style={[styles.meta, dark && styles.metaDark]}>{time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={dark ? "rgba(255,255,255,0.5)" : Colors.textSecondary} />
          <Text style={[styles.meta, dark && styles.metaDark]} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.footer}>
          <View style={[styles.goingBox, { borderColor: color }]}>
            <Text style={[styles.goingText, { color }]}>
              {going}/{maxParticipants} Going
            </Text>
          </View>
          <TouchableOpacity style={[styles.joinBtn, { backgroundColor: color }]} onPress={onJoin}>
            <Text style={styles.joinText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  titleDark: { color: "#fff" },
  descriptionDark: { color: "rgba(255,255,255,0.55)" },
  metaDark: { color: "rgba(255,255,255,0.45)" },
  imageWrap: { width: 110, height: 130 },
  image: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  distanceBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    gap: 2,
  },
  distanceText: { color: "#fff", fontSize: 9, fontWeight: "600" },
  content: { flex: 1, padding: Spacing.md },
  title: { fontSize: 15, fontWeight: "700", color: Colors.text },
  description: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  meta: { fontSize: 11, color: Colors.textSecondary, flex: 1 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  goingBox: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  goingText: { fontSize: 11, fontWeight: "700" },
  joinBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.md },
  joinText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
