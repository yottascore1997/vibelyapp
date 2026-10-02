import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { VibeFonts } from "../../constants/vibeTheme";

const { height: SCREEN_H } = Dimensions.get("window");

export interface MenuItem {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "smoke",
    name: "Smoke / Sutta",
    subtitle: "Classic Filter • Mint • Clove • Tapri Vibe",
    emoji: "🚬",
    badge: "Popular 🔥",
    badgeBg: "rgba(244, 63, 94, 0.15)",
    badgeColor: "#FB7185",
  },
  {
    id: "breakfast",
    name: "Breakfast",
    subtitle: "Crispy Bun Maska • Hot Poha • Samosa Plate",
    emoji: "🥐",
    badge: "Fresh & Hot 😋",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    badgeColor: "#FBBF24",
  },
  {
    id: "chai",
    name: "Chai",
    subtitle: "Kadak Adrak-Elaichi Tapri Steaming Chai",
    emoji: "☕",
    badge: "Kadak ☕",
    badgeBg: "rgba(255, 107, 0, 0.15)",
    badgeColor: "#FF8A00",
  },
];

interface ChaiHangoutModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite?: (items: MenuItem[]) => void;
}

export default function ChaiHangoutModal({
  visible,
  onClose,
  onInvite,
}: ChaiHangoutModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Selected item IDs (single toggle: added or not added)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedList = MENU_ITEMS.filter((item) => !!selectedIds[item.id]);
  const selectedCount = selectedList.length;

  const handleProceedToInvite = () => {
    if (onInvite) {
      onInvite(selectedList);
    }
    onClose();

    // Prepare items description for invite screen
    const itemsSummary = selectedList
      .map((item) => `${item.emoji} ${item.name}`)
      .join(", ");

    router.push({
      pathname: "/invite-friends",
      params: {
        name: "Chai Hangout ☕",
        tab: "friends",
        code: "CHAI" + Math.floor(1000 + Math.random() * 9000),
        subtitle: itemsSummary || "Chai Hangout Vibe",
      },
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop Tap to Close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Bottom Sheet Container */}
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={[
            styles.bottomSheet,
            { paddingBottom: Math.max(insets.bottom, 20) + 10 },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagEmoji}>☕</Text>
                <Text style={styles.tagText}>CHAI ADDA HANGOUT</Text>
              </View>
              <Text style={styles.sheetTitle}>Start Chai Hangout</Text>
              <Text style={styles.sheetSubtitle}>
                Add Smoke, Breakfast & Chai to your hangout
              </Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Content Scrollable List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* List of Items */}
            {MENU_ITEMS.map((item) => {
              const isAdded = !!selectedIds[item.id];

              return (
                <View key={item.id} style={styles.itemCard}>
                  {/* Big Icon without background circle */}
                  <View style={styles.iconWrap}>
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  </View>

                  {/* Center Details (No Price) */}
                  <View style={styles.itemInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View
                        style={[
                          styles.badgePill,
                          { backgroundColor: item.badgeBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgePillText,
                            { color: item.badgeColor },
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  </View>

                  {/* Right Action: Orange Add button or Added pill */}
                  <View style={styles.actionWrap}>
                    {!isAdded ? (
                      <Pressable
                        onPress={() => handleToggleItem(item.id)}
                        style={styles.addBtnOrange}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text style={styles.addBtnText}>Add</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => handleToggleItem(item.id)}
                        style={styles.addedBtn}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={15}
                          color="#FF7A00"
                        />
                        <Text style={styles.addedBtnText}>Added</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Action Footer: Invite Friends CTA */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleProceedToInvite}
              style={styles.inviteButtonWrap}
            >
              <LinearGradient
                colors={["#D4F72C", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.inviteButton}
              >
                <Ionicons name="people" size={18} color="#0D1220" />
                <Text style={styles.inviteButtonText}>
                  {selectedCount > 0
                    ? `Invite Friends (${selectedCount} Added)`
                    : "Invite Friends"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#0D1220" />
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(3, 6, 15, 0.72)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    backgroundColor: "#0D111E",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    maxHeight: SCREEN_H * 0.85,
    paddingTop: 10,
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
  dragHandleWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dragHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 122, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 122, 0, 0.35)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    marginBottom: 6,
  },
  tagEmoji: {
    fontSize: 11,
  },
  tagText: {
    fontSize: 10,
    fontFamily: VibeFonts.extraBold,
    color: "#FF8A00",
    letterSpacing: 0.6,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },

  // Item Card (No selection border change as requested)
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131726",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },

  // Big Icon without surrounding circle
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemEmoji: {
    fontSize: 34,
  },

  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 3,
  },
  itemName: {
    fontSize: 15.5,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgePillText: {
    fontSize: 9.5,
    fontFamily: VibeFonts.bold,
  },
  itemSubtitle: {
    fontSize: 11.5,
    fontFamily: VibeFonts.regular,
    color: "#94A3B8",
    lineHeight: 16,
  },

  // Action Buttons on Right
  actionWrap: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  // ORANGE Add Button (Flat, no shadow)
  addBtnOrange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FF6B00",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },

  // Added Pill Button
  addedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    borderWidth: 1.2,
    borderColor: "#FF6B00",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },
  addedBtnText: {
    fontSize: 12.5,
    fontFamily: VibeFonts.bold,
    color: "#FF8A00",
  },



  // Footer & CTA
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inviteButtonWrap: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  inviteButtonText: {
    fontSize: 15,
    fontFamily: VibeFonts.extraBold,
    color: "#070A13",
    letterSpacing: 0.2,
  },
});
