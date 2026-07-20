import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../../components/vibe/GlassCard";
import AppHeader from "../../components/vibe/AppHeader";
import { VibeFonts } from "../../constants/vibeTheme";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Radius, Spacing } from "../../constants/theme";

interface JarItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  type: "PLAN" | "STREAK" | "VIBE" | "MATCH" | string;
  imageUrl: string | null;
  meta: string | null;
  createdAt: string;
}

export default function JarScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<JarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJarItems = async (showRefreshIndicator = false) => {
    if (!user) return;
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.getJarItems(user.id);
      if (res) {
        setItems(res);
      }
    } catch (err) {
      console.error("Error fetching jar items:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJarItems();
  }, [user?.id]);

  const getIconConfig = (type: string) => {
    switch (type) {
      case "VIBE":
        return { name: "flash" as const, color: "#A855F7", bg: "rgba(168, 85, 247, 0.15)", label: "Active Vibe" };
      case "PLAN":
        return { name: "calendar" as const, color: "#F97316", bg: "rgba(249, 115, 22, 0.15)", label: "Spontaneous Plan" };
      case "STREAK":
        return { name: "flame" as const, color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)", label: "Streak" };
      case "MATCH":
        return { name: "heart" as const, color: "#EC4899", bg: "rgba(236, 72, 153, 0.15)", label: "Match" };
      default:
        return { name: "archive" as const, color: "#C084FC", bg: "rgba(192, 132, 252, 0.15)", label: "Memory" };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["rgba(168,85,247,0.2)", "transparent"]}
        style={styles.glowTop}
      />
      <AppHeader variant="dark" tagline="Moments you saved" />

      <View style={styles.titleBlock}>
        <Text style={styles.pageTitle}>My Jar</Text>
        <Text style={styles.pageSub}>
          {items.length > 0 ? `${items.length} moments saved` : "Your vault of sweet memories"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C084FC" />
          <Text style={styles.loadingText}>Unlocking memories...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchJarItems(true)}
              tintColor="#C084FC"
              colors={["#C084FC"]}
            />
          }
        >
          {items.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <LinearGradient
                colors={["rgba(138,86,255,0.15)", "rgba(255,75,129,0.08)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.jarIconWrapper}>
                <Ionicons name="archive" size={48} color="#C084FC" />
              </View>
              <Text style={styles.emptyTitle}>Your memory jar is empty</Text>
              <Text style={styles.emptyDescription}>
                Plans, streaks, and vibes you save will show up here.
              </Text>
            </GlassCard>
          ) : (
            <View style={styles.listContainer}>
              {items.map((item) => {
                const iconConfig = getIconConfig(item.type);
                return (
                  <GlassCard key={item.id} style={styles.memoryCard}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.typeBadge, { backgroundColor: iconConfig.bg }]}>
                        <Ionicons name={iconConfig.name} size={12} color={iconConfig.color} />
                        <Text style={[styles.typeBadgeText, { color: iconConfig.color }]}>
                          {iconConfig.label}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    </View>

                    <View style={styles.cardBody}>
                      {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.memoryImage} />
                      )}
                      <View style={styles.textContainer}>
                        <Text style={styles.memoryTitle}>{item.title}</Text>
                        {item.description && (
                          <Text style={styles.memoryDescription}>{item.description}</Text>
                        )}
                        {item.meta && (
                          <View style={styles.metaContainer}>
                            <Text style={styles.metaText}>{item.meta}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050508" },
  glowTop: { position: "absolute", top: 0, left: 0, right: 0, height: 220 },
  titleBlock: { paddingHorizontal: 16, paddingBottom: 8 },
  pageTitle: {
    fontSize: 24,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    letterSpacing: -0.4,
  },
  pageSub: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  loadingText: { color: "rgba(255, 255, 255, 0.6)", fontFamily: VibeFonts.medium, marginTop: 15, fontSize: 14 },
  scrollContent: { paddingBottom: 120, paddingTop: Spacing.sm, paddingHorizontal: 16 },
  listContainer: { gap: 16 },
  emptyCard: {
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 40,
  },
  jarIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(138,86,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(138,86,255,0.25)",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 20,
  },
  memoryCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255, 255, 255, 0.4)",
    marginLeft: "auto",
  },
  cardBody: {
    flexDirection: "row",
    gap: 12,
  },
  memoryImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  memoryTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#fff",
    marginBottom: 4,
  },
  memoryDescription: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 16,
    marginBottom: 8,
  },
  metaContainer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: "rgba(255, 255, 255, 0.5)",
  },
});
