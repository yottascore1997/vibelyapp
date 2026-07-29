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
      <AppHeader variant="light" tagline="Moments & squad memories" />

      <View style={styles.titleBlock}>
        <View style={styles.eyebrowPill}>
          <Ionicons name="archive" size={11} color="#7C3AED" />
          <Text style={styles.eyebrowText}>SAVED MEMORIES</Text>
        </View>
        <Text style={styles.pageTitle}>
          My Jar <Text style={{ color: "#7C3AED" }}>Vault 🏺</Text>
        </Text>
        <Text style={styles.pageSub}>
          {items.length > 0 ? `${items.length} moments saved in squad vault` : "Your vault of sweet memories & plans"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Unlocking squad memories...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchJarItems(true)}
              tintColor="#7C3AED"
              colors={["#7C3AED"]}
            />
          }
        >
          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.jarIconWrapper}>
                <Ionicons name="archive" size={42} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>Your memory jar is empty 🏺</Text>
              <Text style={styles.emptyDescription}>
                Plans, streaks, and vibes you save with squad will show up here as 3D floating memory cards!
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {items.map((item) => {
                const iconConfig = getIconConfig(item.type);
                return (
                  <View key={item.id} style={styles.memoryCard}>
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
                  </View>
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
  root: { flex: 1, backgroundColor: "#F8F9FD" },
  titleBlock: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 6 },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  eyebrowText: {
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    color: "#7C3AED",
    letterSpacing: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
  },
  pageSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 2,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  loadingText: { color: "#64748B", fontFamily: VibeFonts.medium, marginTop: 15, fontSize: 14 },
  scrollContent: { paddingBottom: 120, paddingTop: 10, paddingHorizontal: 16 },
  listContainer: { gap: 14 },
  emptyCard: {
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginTop: 30,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  jarIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  memoryCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#64748B",
    marginLeft: "auto",
  },
  cardBody: {
    flexDirection: "row",
    gap: 12,
  },
  memoryImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  memoryTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#18181B",
    marginBottom: 2,
  },
  memoryDescription: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#475569",
    lineHeight: 18,
  },
  metaContainer: {
    marginTop: 6,
    backgroundColor: "#F8F9FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  metaText: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
});
