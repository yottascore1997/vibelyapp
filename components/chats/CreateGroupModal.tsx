import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMatches } from "../../context/MatchesContext";
import { MatchProfile } from "../../constants/matches";
import { VibeFonts } from "../../constants/vibeTheme";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}

const AVATAR_PRESETS = [
  {
    label: "Crew",
    emoji: "🎉",
    url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&h=200&fit=crop",
  },
  {
    label: "Cafe",
    emoji: "☕",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&h=200&fit=crop",
  },
  {
    label: "Foodies",
    emoji: "🍕",
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop",
  },
  {
    label: "Travel",
    emoji: "✈️",
    url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200&h=200&fit=crop",
  },
  {
    label: "Gaming",
    emoji: "🎮",
    url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=200&fit=crop",
  },
];

export default function CreateGroupModal({
  visible,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const insets = useSafeAreaInsets();
  const { matches, createCustomGroup } = useMatches();

  const [groupName, setGroupName] = useState("");
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(0);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMatches = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((m) => m.name.toLowerCase().includes(q));
  }, [matches, memberSearch]);

  const selectedMatchProfiles = useMemo(() => {
    return matches.filter((m) => selectedMemberIds.includes(m.id));
  }, [matches, selectedMemberIds]);

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const removeMember = (id: string) => {
    setSelectedMemberIds((prev) => prev.filter((mId) => mId !== id));
  };

  const handleCreate = async () => {
    const trimmed = groupName.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const chosenAvatar = AVATAR_PRESETS[selectedAvatarIdx]?.url;
      const selectedMembersData = selectedMatchProfiles.map((m) => ({
        id: m.id,
        name: m.name,
        avatarUrl: m.avatarUrl,
      }));

      const newGroupId = await createCustomGroup(
        trimmed,
        selectedMembersData,
        chosenAvatar
      );

      // Reset fields
      setGroupName("");
      setSelectedMemberIds([]);
      setSelectedAvatarIdx(0);
      setMemberSearch("");
      onClose();
      onGroupCreated(newGroupId);
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreateDisabled = !groupName.trim() || isSubmitting;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBarWrapper}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Create New Group 👥</Text>
              <Text style={styles.modalSubtitle}>
                Add your friends & start chatting
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Avatar Preset Selector */}
            <Text style={styles.fieldLabel}>GROUP ICON & THEME</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarRow}
            >
              {AVATAR_PRESETS.map((preset, idx) => {
                const isSelected = selectedAvatarIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.avatarPresetCard,
                      isSelected && styles.avatarPresetCardSelected,
                    ]}
                    onPress={() => setSelectedAvatarIdx(idx)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: preset.url }}
                      style={styles.avatarPresetImg}
                    />
                    {isSelected ? (
                      <View style={styles.avatarSelectedBadge}>
                        <Ionicons name="checkmark" size={11} color="#070A14" />
                      </View>
                    ) : null}
                    <Text
                      style={[
                        styles.avatarPresetLabel,
                        isSelected && { color: "#D4F72C" },
                      ]}
                    >
                      {preset.emoji} {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Group Name Input */}
            <Text style={styles.fieldLabel}>GROUP NAME</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="chatbubbles"
                size={18}
                color="#22D3EE"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Chai & Chill, Weekend Plans..."
                placeholderTextColor="#64748B"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={45}
              />
              {groupName.length > 0 && (
                <Pressable onPress={() => setGroupName("")}>
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                </Pressable>
              )}
            </View>

            {/* Selected Members Chips */}
            {selectedMatchProfiles.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.fieldLabel}>
                  SELECTED ({selectedMatchProfiles.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {selectedMatchProfiles.map((m) => (
                    <View key={m.id} style={styles.memberChip}>
                      <Image
                        source={{ uri: m.avatarUrl }}
                        style={styles.chipAvatar}
                      />
                      <Text style={styles.chipName} numberOfLines={1}>
                        {m.name.split(" ")[0]}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeMember(m.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color="#22D3EE"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Members Search & Checklist */}
            <View style={styles.membersHeaderRow}>
              <Text style={styles.fieldLabel}>ADD MEMBERS FROM MATCHES</Text>
              <Text style={styles.selectedCountBadge}>
                {selectedMemberIds.length} selected
              </Text>
            </View>

            {matches.length > 0 ? (
              <>
                <View style={styles.memberSearchWrapper}>
                  <Ionicons
                    name="search"
                    size={16}
                    color="#64748B"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={styles.memberSearchInput}
                    placeholder="Search by name..."
                    placeholderTextColor="#64748B"
                    value={memberSearch}
                    onChangeText={setMemberSearch}
                  />
                  {memberSearch.length > 0 && (
                    <Pressable onPress={() => setMemberSearch("")}>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color="#64748B"
                      />
                    </Pressable>
                  )}
                </View>

                <View style={styles.membersListContainer}>
                  {filteredMatches.map((m) => {
                    const isSelected = selectedMemberIds.includes(m.id);
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.memberItemRow,
                          isSelected && styles.memberItemRowSelected,
                        ]}
                        onPress={() => toggleMember(m.id)}
                        activeOpacity={0.75}
                      >
                        <Image
                          source={{ uri: m.avatarUrl }}
                          style={styles.memberRowAvatar}
                        />
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Text style={styles.memberRowName}>{m.name}</Text>
                            {m.isVerified ? (
                              <Ionicons
                                name="checkmark-circle"
                                size={14}
                                color="#22D3EE"
                              />
                            ) : null}
                          </View>
                          <Text style={styles.memberRowSub}>
                            {m.isOnline ? "Online now" : "Matched"}
                          </Text>
                        </View>

                        {/* Checkbox */}
                        {isSelected ? (
                          <LinearGradient
                            colors={["#D4F72C", "#22D3EE"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.checkedCircle}
                          >
                            <Ionicons
                              name="checkmark"
                              size={13}
                              color="#070A14"
                            />
                          </LinearGradient>
                        ) : (
                          <View style={styles.uncheckedCircle} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.noMatchesBox}>
                <Ionicons name="sparkles-outline" size={24} color="#D4F72C" />
                <Text style={styles.noMatchesTitle}>No matches yet</Text>
                <Text style={styles.noMatchesSub}>
                  You can create this group now as a personal space, and add
                  friends whenever you match!
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createBtnWrapper,
                isCreateDisabled && { opacity: 0.45 },
              ]}
              onPress={handleCreate}
              disabled={isCreateDisabled}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#D4F72C", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createBtnGrad}
              >
                <Ionicons name="checkmark-circle" size={17} color="#070A14" />
                <Text style={styles.createBtnText}>
                  {isSubmitting ? "Creating…" : "Create Group"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.78)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: "#0D1424",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    maxHeight: "88%",
  },
  handleBarWrapper: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handleBar: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: VibeFonts.bold,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 16,
  },
  avatarPresetCard: {
    alignItems: "center",
    padding: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.5,
    borderColor: "transparent",
    position: "relative",
  },
  avatarPresetCardSelected: {
    borderColor: "#D4F72C",
    backgroundColor: "rgba(212, 247, 44, 0.08)",
  },
  avatarPresetImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  avatarSelectedBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#D4F72C",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPresetLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#070A14",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
  },
  selectedSection: {
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.28)",
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chipName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    maxWidth: 70,
  },
  membersHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  selectedCountBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22D3EE",
  },
  memberSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#070A14",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    height: 38,
    marginBottom: 10,
  },
  memberSearchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
  },
  membersListContainer: {
    gap: 6,
    maxHeight: 220,
  },
  memberItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 12,
  },
  memberItemRowSelected: {
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    borderColor: "rgba(34, 211, 238, 0.3)",
  },
  memberRowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberRowName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  memberRowSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  uncheckedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#64748B",
  },
  noMatchesBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  noMatchesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },
  noMatchesSub: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  cancelBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  createBtnWrapper: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  createBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 6,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#070A14",
    fontFamily: VibeFonts.bold,
  },
});
