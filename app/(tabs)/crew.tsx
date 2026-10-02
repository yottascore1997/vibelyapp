import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { VibeFonts } from "../../constants/vibeTheme";
import HomeHeader from "../../components/HomeHeader";

interface Tag {
  label: string;
  color: string;
  bg: string;
  border: string;
}

interface CrewItem {
  id: string;
  name: string;
  description?: string;
  membersCount: number;
  glowColor: string;
  image: string;
  tags: Tag[];
  members: string[];
  extraMembers: number;
}

const INITIAL_CREWS: CrewItem[] = [
  {
    id: "weekend-gang",
    name: "Weekend Gang 🍻",
    description: "Your go-to squad for rooftop chills, food hunts & weekend getaways",
    membersCount: 8,
    glowColor: "#F43F5E",
    image:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=400&fit=crop",
    tags: [
      {
        label: "Chill",
        color: "#22D3EE",
        bg: "rgba(6, 182, 212, 0.16)",
        border: "rgba(6, 182, 212, 0.45)",
      },
      {
        label: "Food",
        color: "#FBBF24",
        bg: "rgba(245, 158, 11, 0.16)",
        border: "rgba(245, 158, 11, 0.45)",
      },
      {
        label: "Travel",
        color: "#F472B6",
        bg: "rgba(236, 72, 153, 0.16)",
        border: "rgba(236, 72, 153, 0.45)",
      },
    ],
    members: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop",
    ],
    extraMembers: 3,
  },
  {
    id: "college-friends",
    name: "College Friends 🎓",
    description: "Campus memories, old stories, late night chai & endless hangout plans",
    membersCount: 12,
    glowColor: "#06B6D4",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=400&fit=crop",
    tags: [
      {
        label: "Old Memories",
        color: "#38BDF8",
        bg: "rgba(56, 189, 248, 0.16)",
        border: "rgba(56, 189, 248, 0.45)",
      },
      {
        label: "New Plans",
        color: "#34D399",
        bg: "rgba(52, 211, 153, 0.16)",
        border: "rgba(52, 211, 153, 0.45)",
      },
    ],
    members: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop",
    ],
    extraMembers: 7,
  },
  {
    id: "office-buddies",
    name: "Office Buddies 💼",
    description: "Coffee breaks, venting sessions and Friday night decompression vibes",
    membersCount: 6,
    glowColor: "#F59E0B",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop",
    tags: [
      {
        label: "Work",
        color: "#A78BFA",
        bg: "rgba(167, 139, 250, 0.16)",
        border: "rgba(167, 139, 250, 0.45)",
      },
      {
        label: "Food",
        color: "#FBBF24",
        bg: "rgba(245, 158, 11, 0.16)",
        border: "rgba(245, 158, 11, 0.45)",
      },
      {
        label: "Weekend",
        color: "#FB7185",
        bg: "rgba(251, 113, 133, 0.16)",
        border: "rgba(251, 113, 133, 0.45)",
      },
    ],
    members: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
    ],
    extraMembers: 1,
  },
  {
    id: "gaming-crew",
    name: "Gaming Crew 🎮",
    description: "Late night squads, esports tournaments, pizza and discord chill",
    membersCount: 5,
    glowColor: "#A855F7",
    image:
      "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop",
    tags: [
      {
        label: "Games",
        color: "#2DD4BF",
        bg: "rgba(45, 212, 191, 0.16)",
        border: "rgba(45, 212, 191, 0.45)",
      },
      {
        label: "Chill",
        color: "#60A5FA",
        bg: "rgba(96, 165, 250, 0.16)",
        border: "rgba(96, 165, 250, 0.45)",
      },
      {
        label: "Explore",
        color: "#C084FC",
        bg: "rgba(192, 132, 252, 0.16)",
        border: "rgba(192, 132, 252, 0.45)",
      },
    ],
    members: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop",
    ],
    extraMembers: 0,
  },
];

const AVAILABLE_TAGS = [
  "Chill",
  "Food",
  "Travel",
  "Work",
  "Weekend",
  "Games",
  "Music",
  "Party",
  "Fitness",
];

export default function MyCrewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [crews, setCrews] = useState<CrewItem[]>(INITIAL_CREWS);
  const [selectedCrew, setSelectedCrew] = useState<CrewItem | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCrewName, setNewCrewName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("⚡");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Chill", "Food"]);

  // Calculate dynamic stats
  const totalCrews = crews.length;
  const totalMembers = crews.reduce((acc, c) => acc + c.membersCount, 0);
  const totalHangouts = 12;

  const handleCreateCrew = () => {
    if (!newCrewName.trim()) {
      Alert.alert("Enter Name", "Please give your crew a name!");
      return;
    }

    const tagColors = [
      { color: "#22D3EE", bg: "rgba(6, 182, 212, 0.16)", border: "rgba(6, 182, 212, 0.45)" },
      { color: "#FBBF24", bg: "rgba(245, 158, 11, 0.16)", border: "rgba(245, 158, 11, 0.45)" },
      { color: "#F472B6", bg: "rgba(236, 72, 153, 0.16)", border: "rgba(236, 72, 153, 0.45)" },
    ];

    const tags: Tag[] = selectedTags.length > 0
      ? selectedTags.map((t, idx) => ({
          label: t,
          ...tagColors[idx % tagColors.length],
        }))
      : [
          { label: "Crew", color: "#D4F72C", bg: "rgba(212, 247, 44, 0.16)", border: "rgba(212, 247, 44, 0.45)" },
          { label: "Active", color: "#22D3EE", bg: "rgba(34, 211, 238, 0.16)", border: "rgba(34, 211, 238, 0.45)" },
        ];

    const newCrew: CrewItem = {
      id: `crew-${Date.now()}`,
      name: `${newCrewName.trim()} ${selectedEmoji}`,
      membersCount: 1,
      glowColor: "#22D3EE",
      image:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop",
      tags,
      members: [
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
      ],
      extraMembers: 0,
    };

    setCrews((prev) => [newCrew, ...prev]);
    setNewCrewName("");
    setCreateModalVisible(false);

    router.push({
      pathname: "/crew-details",
      params: {
        id: newCrew.id,
        name: newCrew.name,
        image: newCrew.image,
        description: "New crew created for spontaneous meetups, hangouts & good vibes",
        glowColor: newCrew.glowColor,
        membersCount: newCrew.membersCount.toString(),
      },
    });
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 3) return;
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const cursiveFont = Platform.select({
    ios: "Snell Roundhand",
    android: "sans-serif-condensed",
    default: "cursive",
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <HomeHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 95 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&auto=format&fit=crop&q=80",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(7, 10, 20, 0.25)", "rgba(7, 10, 20, 0.72)"]}
            style={styles.heroOverlay}
          />

          {/* Left Text */}
          <View style={styles.heroLeftTextContainer}>
            <Text style={[styles.heroScriptText, { fontFamily: cursiveFont }]}>
              Real Friends
            </Text>
            <Text style={[styles.heroScriptText, { fontFamily: cursiveFont, marginTop: -2 }]}>
              Real Moments
            </Text>
            <Text
              style={[
                styles.heroScriptHighlight,
                { fontFamily: cursiveFont, marginTop: 4 },
              ]}
            >
              My Crew 💛
            </Text>
          </View>

          {/* Right Text */}
          <View style={styles.heroRightTextContainer}>
            <Text style={[styles.heroScriptRight, { fontFamily: cursiveFont }]}>
              Good People
            </Text>
            <Text style={[styles.heroScriptRight, { fontFamily: cursiveFont, marginTop: 2 }]}>
              Brighter Nights 🤍
            </Text>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsCard}>
          <View style={styles.statCol}>
            <Ionicons name="people" size={22} color="#F43F5E" />
            <Text style={styles.statNumber}>{totalCrews}</Text>
            <Text style={styles.statLabel}>Crews</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Ionicons name="people-sharp" size={22} color="#22D3EE" />
            <Text style={styles.statNumber}>{totalMembers}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Ionicons name="calendar-outline" size={22} color="#FACC15" />
            <Text style={styles.statNumber}>{totalHangouts}</Text>
            <Text style={styles.statLabel}>Upcoming Hangouts</Text>
          </View>
        </Animated.View>

        {/* Crew List */}
        <View style={styles.crewListSection}>
          {crews.map((crew, index) => (
            <Animated.View
              key={crew.id}
              entering={FadeInDown.delay(180 + index * 70).duration(400)}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.crewCard,
                  pressed && styles.crewCardPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/crew-details",
                    params: {
                      id: crew.id,
                      name: crew.name,
                      image: crew.image,
                      description: crew.description || "",
                      glowColor: crew.glowColor,
                      membersCount: crew.membersCount.toString(),
                    },
                  })
                }
              >
                {/* Square image - full cover fill, no border */}
                <View style={styles.crewThumb}>
                  <Image
                    source={{ uri: crew.image }}
                    style={styles.crewAvatar}
                    resizeMode="cover"
                  />
                </View>

                {/* Details */}
                <View style={styles.crewInfo}>
                  <Text style={styles.crewName} numberOfLines={1}>
                    {crew.name}
                  </Text>
                  <Text style={styles.crewMembersSubtitle}>
                    👥 {crew.membersCount} members
                  </Text>

                  {/* Tags */}
                  <View style={styles.tagsRow}>
                    {crew.tags.map((tag) => (
                      <View
                        key={tag.label}
                        style={[
                          styles.tagBadge,
                          {
                            backgroundColor: tag.bg,
                            borderColor: tag.border,
                          },
                        ]}
                      >
                        <Text style={[styles.tagText, { color: tag.color }]}>
                          {tag.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Overlapping member faces */}
                  <View style={styles.membersStackRow}>
                    {crew.members.map((uri, mIdx) => (
                      <Image
                        key={mIdx}
                        source={{ uri }}
                        style={[
                          styles.memberFace,
                          { marginLeft: mIdx === 0 ? 0 : -8, zIndex: 10 - mIdx },
                        ]}
                      />
                    ))}
                    {crew.extraMembers > 0 && (
                      <View style={styles.extraMembersPill}>
                        <Text style={styles.extraMembersText}>
                          +{crew.extraMembers}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Chevron */}
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#64748B"
                  style={styles.crewChevron}
                />
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Create a New Crew Banner Card */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(400)}
          style={styles.createBannerCard}
        >
          {/* Subtle cyan glow gradient */}
          <LinearGradient
            colors={["rgba(15, 23, 42, 0.95)", "rgba(10, 15, 29, 0.98)"]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.createBannerContent}>
            {/* Left side text and button */}
            <View style={styles.createBannerLeft}>
              <Text style={styles.createBannerTitle}>Create a New Crew</Text>
              <Text style={styles.createBannerDesc}>
                Bring your people together. Make new memories.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.createCrewButton,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => setCreateModalVisible(true)}
              >
                <LinearGradient
                  colors={["#D4F72C", "#22D3EE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createCrewBtnGrad}
                >
                  <Ionicons name="add" size={17} color="#050508" />
                  <Text style={styles.createCrewBtnText}>Create Crew</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Right side tilted Polaroids with doodles */}
            <View style={styles.createBannerRight}>
              <View style={styles.polaroidContainer}>
                {/* Back tilted polaroid */}
                <View style={[styles.polaroidFrame, styles.polaroidBack]}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=300&h=300&fit=crop",
                    }}
                    style={styles.polaroidImage}
                  />
                </View>

                {/* Front tilted polaroid */}
                <View style={[styles.polaroidFrame, styles.polaroidFront]}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&h=300&fit=crop",
                    }}
                    style={styles.polaroidImage}
                  />
                </View>

                {/* Doodle text */}
                <View style={styles.doodleContainer}>
                  <Text style={[styles.doodleText, { fontFamily: cursiveFont }]}>
                    Better Together 💚
                  </Text>
                  <Text style={styles.doodleSlashes}>\\\</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modal: Create Crew */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setCreateModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Create a New Crew</Text>
              <Pressable
                onPress={() => setCreateModalVisible(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Crew Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Night Owls, Coffee Addicts..."
                placeholderTextColor="#64748B"
                value={newCrewName}
                onChangeText={setNewCrewName}
              />
              <Text style={styles.inputEmoji}>{selectedEmoji}</Text>
            </View>

            {/* Quick Emoji Picker */}
            <Text style={styles.inputLabel}>Select Emoji</Text>
            <View style={styles.emojiRow}>
              {["🍻", "🎓", "💼", "🎮", "⚡", "🍕", "✈️", "🔥", "🚀", "🎉", "🌟", "👾"].map((em) => (
                <Pressable
                  key={em}
                  style={[
                    styles.emojiBtn,
                    selectedEmoji === em && styles.emojiBtnActive,
                  ]}
                  onPress={() => setSelectedEmoji(em)}
                >
                  <Text style={styles.emojiChar}>{em}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.modalSubmitBtn,
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleCreateCrew}
            >
              <LinearGradient
                colors={["#D4F72C", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalSubmitGrad}
              >
                <Text style={styles.modalSubmitText}>Create Crew</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal: Crew Details */}
      <Modal
        visible={!!selectedCrew}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCrew(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setSelectedCrew(null)}
          />
          {selectedCrew && (
            <Animated.View entering={ZoomIn.duration(200)} style={styles.detailCard}>
              <Image source={{ uri: selectedCrew.image }} style={styles.detailBanner} />
              <LinearGradient
                colors={["transparent", "rgba(11, 15, 28, 0.95)", "#0B0F1C"]}
                style={styles.detailBannerGrad}
              />

              <Pressable
                style={styles.detailCloseBtn}
                onPress={() => setSelectedCrew(null)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>

              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>{selectedCrew.name}</Text>
                <Text style={styles.detailMembers}>
                  👥 {selectedCrew.membersCount} Crew Members • Active today
                </Text>

                <View style={styles.detailTagsRow}>
                  {selectedCrew.tags.map((t) => (
                    <View
                      key={t.label}
                      style={[
                        styles.tagBadge,
                        { backgroundColor: t.bg, borderColor: t.border },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: t.color }]}>
                        {t.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Quick actions */}
                <View style={styles.detailActionsRow}>
                  <Pressable
                    style={styles.actionBtnSecondary}
                    onPress={() => {
                      setSelectedCrew(null);
                      router.push("/create-plan");
                    }}
                  >
                    <Ionicons name="calendar" size={17} color="#22D3EE" />
                    <Text style={styles.actionBtnTextSecondary}>Plan Hangout</Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionBtnPrimary}
                    onPress={() => {
                      setSelectedCrew(null);
                      router.push("/(tabs)/chats");
                    }}
                  >
                    <LinearGradient
                      colors={["#D4F72C", "#22D3EE"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionBtnGrad}
                    >
                      <Ionicons name="chatbubbles" size={17} color="#050508" />
                      <Text style={styles.actionBtnTextPrimary}>Crew Chat</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070A14",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#070A14",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCenter: {
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleMy: {
    fontSize: 21,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  headerTitleCrew: {
    fontSize: 21,
    fontFamily: VibeFonts.extraBold,
    color: "#D4F72C",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 2,
  },
  addButtonGlow: {
    shadowColor: "#D4F72C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  addBtnGrad: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },

  // Hero Card
  heroCard: {
    height: 195,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "#0C1222",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroLeftTextContainer: {
    position: "absolute",
    top: 18,
    left: 18,
  },
  heroScriptText: {
    fontSize: 19,
    color: "#FFFFFF",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroScriptHighlight: {
    fontSize: 22,
    color: "#FDE047",
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroRightTextContainer: {
    position: "absolute",
    top: 18,
    right: 18,
    alignItems: "flex-end",
  },
  heroScriptRight: {
    fontSize: 13,
    color: "#F1F5F9",
    textAlign: "right",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Stats Card
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(13, 20, 36, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    marginTop: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  statCol: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 19,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 2,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  // Crew List
  crewListSection: {
    marginTop: 14,
    gap: 12,
  },
  crewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1424",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 22,
    padding: 14,
  },
  crewCardPressed: {
    backgroundColor: "#131C33",
  },
  crewThumb: {
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#131C33",
  },
  crewAvatar: {
    width: "100%",
    height: "100%",
  },
  crewInfo: {
    flex: 1,
    marginLeft: 14,
  },
  crewName: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  crewDescription: {
    fontSize: 11.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 2,
  },
  crewMembersSubtitle: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "#64748B",
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 7,
  },
  tagBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
  },
  membersStackRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  memberFace: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#0D1424",
  },
  extraMembersPill: {
    marginLeft: 5,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  extraMembersText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#94A3B8",
  },
  crewChevron: {
    marginLeft: 6,
  },

  // Create Banner Card
  createBannerCard: {
    marginTop: 14,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: "rgba(34, 211, 238, 0.25)",
    backgroundColor: "#0B132B",
  },
  createBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  createBannerLeft: {
    flex: 1.2,
  },
  createBannerTitle: {
    fontSize: 17,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  createBannerDesc: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: "#94A3B8",
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 165,
  },
  createCrewButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    borderRadius: 20,
    overflow: "hidden",
  },
  createCrewBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 4,
  },
  createCrewBtnText: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#050508",
  },
  createBannerRight: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  polaroidContainer: {
    width: 125,
    height: 105,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  polaroidFrame: {
    width: 65,
    height: 68,
    backgroundColor: "#FFFFFF",
    padding: 3,
    paddingBottom: 9,
    borderRadius: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
    position: "absolute",
  },
  polaroidBack: {
    transform: [{ rotate: "10deg" }],
    right: 14,
    top: 14,
  },
  polaroidFront: {
    transform: [{ rotate: "-8deg" }],
    left: 8,
    top: 10,
    zIndex: 2,
  },
  polaroidImage: {
    width: "100%",
    height: "100%",
    borderRadius: 3,
  },
  doodleContainer: {
    position: "absolute",
    top: -8,
    right: -4,
    zIndex: 4,
    alignItems: "flex-end",
  },
  doodleText: {
    fontSize: 11,
    color: "#34D399",
    fontWeight: "700",
  },
  doodleSlashes: {
    fontSize: 14,
    color: "#FACC15",
    fontWeight: "900",
    marginTop: 78,
    marginRight: 10,
    letterSpacing: 2,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#0D1424",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: VibeFonts.semiBold,
    color: "#94A3B8",
    marginBottom: 8,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: VibeFonts.medium,
  },
  inputEmoji: {
    fontSize: 24,
  },
  emojiRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 26,
    marginTop: 2,
  },
  emojiBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  emojiBtnActive: {
    borderColor: "#D4F72C",
    backgroundColor: "rgba(212, 247, 44, 0.18)",
    transform: [{ scale: 1.06 }],
  },
  emojiChar: {
    fontSize: 24,
  },
  modalTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  modalTagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTagChipActive: {
    borderColor: "#22D3EE",
    backgroundColor: "rgba(34, 211, 238, 0.15)",
  },
  modalTagChipText: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
  },
  modalTagChipTextActive: {
    color: "#22D3EE",
    fontFamily: VibeFonts.bold,
  },
  modalSubmitBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  modalSubmitGrad: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#050508",
  },

  // Crew Detail View
  detailCard: {
    margin: 20,
    backgroundColor: "#0D1424",
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.12)",
    marginBottom: 40,
  },
  detailBanner: {
    width: "100%",
    height: 160,
  },
  detailBannerGrad: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  detailCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    padding: 18,
    marginTop: -20,
  },
  detailTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  detailMembers: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 4,
  },
  detailTagsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  detailActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    gap: 6,
  },
  actionBtnTextSecondary: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#22D3EE",
  },
  actionBtnPrimary: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  actionBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  actionBtnTextPrimary: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#050508",
  },
});
