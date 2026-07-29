import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import PulseDot from "../../components/home/PulseDot";
import GlassCard from "../../components/vibe/GlassCard";
import VibeSplitModal from "../../components/vibe/VibeSplitModal";
import { useMatches } from "../../context/MatchesContext";
import { usePlans } from "../../context/PlansContext";
import { formatMessageTime } from "../../constants/chats";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing, API_URL } from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const T = {
  bg: "#F8F9FD",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  ink: "#18181B",
  muted: "#64748B",
  faint: "#94A3B8",
  border: "#E2E8F0",
  softPurple: "#F3E8FF",
  softPink: "#FDF2F8",
  purple: "#7C3AED",
  purpleDeep: "#6D28D9",
  purpleBright: "#8B5CF6",
  pink: "#EC4899",
  green: "#10B981",
  greenSoft: "rgba(16, 185, 129, 0.15)",
  red: "#EF4444",
  glass: "rgba(255, 255, 255, 0.94)",
  cta: ["#7C3AED", "#8B5CF6"] as const,
};

const MEMBER_COLORS = ["#A855F7", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#06B6D4"];
const getMemberColor = (name?: string) => {
  if (!name) return MEMBER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
};

const SparkParticle = ({ 
  index, 
  rocketDelay, 
  originX, 
  originY, 
  hasExploded 
}: { 
  index: number; 
  rocketDelay: number; 
  originX: number; 
  originY: number; 
  hasExploded: any;
}) => {
  const angle = (index / 35) * 2 * Math.PI + Math.random() * 0.4;
  const speed = 4 + Math.random() * 7;
  const color = ["#FF4B81", "#8A56FF", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#E11D48"][index % 8];
  const size = 8 + Math.random() * 10;
  const isCircle = index % 2 === 0;

  const particleX = useSharedValue(originX);
  const particleY = useSharedValue(originY);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(0, { duration: 3450 })
      );
      opacity.value = withTiming(0, { duration: 3600 });
      
      particleX.value = withTiming(originX + Math.cos(angle) * (speed * 32), { duration: 3600 });
      particleY.value = withTiming(originY + Math.sin(angle) * (speed * 32) + 140, { duration: 3600 });
    }, rocketDelay);

    return () => clearTimeout(timer);
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left: particleX.value,
    top: particleY.value,
    width: size,
    height: size,
    borderRadius: isCircle ? size / 2 : 3,
    backgroundColor: color,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
  }));

  return <Animated.View style={style} />;
};

const RocketAndExplosion = ({ index }: { index: number }) => {
  const startX = SCREEN_WIDTH * 0.2 + Math.random() * (SCREEN_WIDTH * 0.6);
  const targetX = startX + (Math.random() * 80 - 40);
  const startY = SCREEN_HEIGHT;
  const targetY = SCREEN_HEIGHT * 0.15 + Math.random() * (SCREEN_HEIGHT * 0.25);

  const rocketX = useSharedValue(startX);
  const rocketY = useSharedValue(startY);
  const rocketScale = useSharedValue(1);
  const rocketOpacity = useSharedValue(1);
  const hasExploded = useSharedValue(false);

  const delay = index * 600;

  useEffect(() => {
    rocketY.value = withDelay(delay, withTiming(targetY, { duration: 1300 }, (finished) => {
      if (finished) {
        hasExploded.value = true;
        rocketOpacity.value = 0;
      }
    }));
    rocketX.value = withDelay(delay, withTiming(targetX, { duration: 1300 }));
  }, []);

  const rocketStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: rocketX.value,
    top: rocketY.value,
    width: 6,
    height: 18,
    borderRadius: 3,
    backgroundColor: "#FFA500",
    transform: [{ scale: rocketScale.value }],
    opacity: rocketOpacity.value,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  }));

  return (
    <>
      <Animated.View style={rocketStyle} />
      {Array.from({ length: 35 }).map((_, sparkIdx) => (
        <SparkParticle 
          key={sparkIdx} 
          index={sparkIdx} 
          rocketDelay={delay + 1300} 
          originX={targetX} 
          originY={targetY} 
          hasExploded={hasExploded}
        />
      ))}
    </>
  );
};

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
  "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠",
  "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥",
  "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
  "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻",
  "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
  "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆",
  "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️",
  "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀",
  "👁️", "👅", "👄", "💋", "🩸", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥",
  "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌", "💤", "💢", "💣", "💥", "💦",
  "💨", "💫", "💬", "🗯️"
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getConversation,
    sendMessage,
    markRead,
    matches,
    typingUsers,
    sendTypingStatus,
    updateMessageContent,
    getChatGate,
    unmatch,
  } = useMatches();
  const { myPlans, nearbyPlans } = usePlans();
  const [text, setText] = useState("");
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showHangoutPanel, setShowHangoutPanel] = useState(false);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const triggerConfetti = () => {
    setConfettiKey((prev) => prev + 1);
    setConfettiActive(true);
    setTimeout(() => {
      setConfettiActive(false);
    }, 5500);
  };

  const toggleAttachPanel = () => {
    if (!showAttachPanel) {
      Keyboard.dismiss();
      setShowEmojiPanel(false);
      setShowHangoutPanel(false);
    }
    setShowAttachPanel((prev) => !prev);
  };

  const toggleEmojiPanel = () => {
    if (!showEmojiPanel) {
      Keyboard.dismiss();
      setShowHangoutPanel(false);
      setShowAttachPanel(false);
    }
    setShowEmojiPanel((prev) => !prev);
  };

  const toggleHangoutPanel = () => {
    if (!showHangoutPanel) {
      Keyboard.dismiss();
      setShowEmojiPanel(false);
      setShowAttachPanel(false);
    }
    setShowHangoutPanel((prev) => !prev);
  };

  const sendHangoutInvite = async (activityName: string, emoji: string) => {
    if (!id) return;
    const gate = getChatGate(id);
    if (gate && !gate.canSend) {
      Alert.alert("Chat locked", gate.reason || "Wait for their reply before sending invites.");
      return;
    }
    const inviteText = `[INVITE:${activityName}:${emoji}:pending]`;
    setShowHangoutPanel(false);
    await sendMessage(id, inviteText);
  };

  const handleInviteAction = (messageId: string, activityName: string, emoji: string, status: "accepted" | "rejected") => {
    if (!id) return;
    const newContent = `[INVITE:${activityName}:${emoji}:${status}]`;
    updateMessageContent(messageId, newContent, id, thread?.isGroup);
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => {
      const next = prev + emoji;
      handleTextChange(next);
      return next;
    });
  };

  const renderMessageContent = (msg: any) => {
    const inviteRegex = /^\[INVITE:([^:]+):([^:]+):([^:]+)\]$/;
    const matchInvite = msg.text.match(inviteRegex);

    if (matchInvite) {
      const [_, activityName, emoji, status] = matchInvite;
      
      return (
        <View style={styles.inviteCard}>
          <View style={styles.inviteHeader}>
            <View style={styles.inviteIconCircle}>
              <Text style={styles.inviteIconText}>{emoji}</Text>
            </View>
            <View>
              <Text style={styles.inviteTitle}>{activityName}</Text>
              <Text style={styles.inviteSub}>Hangout Proposal</Text>
            </View>
          </View>
          
          <View style={styles.inviteDivider} />
          
          {status === "pending" ? (
            msg.fromMe ? (
              <View style={styles.inviteStatusContainer}>
                <Ionicons name="time-outline" size={14} color={T.purple} />
                <Text style={styles.inviteStatusTextPending}>Waiting for response...</Text>
              </View>
            ) : (
              <View style={styles.inviteActions}>
                <TouchableOpacity 
                  style={[styles.inviteActionBtn, styles.inviteAcceptBtn]} 
                  onPress={() => handleInviteAction(msg.id, activityName, emoji, "accepted")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
                  <Text style={styles.inviteActionBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.inviteActionBtn, styles.inviteDeclineBtn]} 
                  onPress={() => handleInviteAction(msg.id, activityName, emoji, "rejected")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={15} color="#fff" />
                  <Text style={styles.inviteActionBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )
          ) : status === "accepted" ? (
            <View style={styles.inviteStatusContainerAccepted}>
              <Ionicons name="checkmark-done-circle" size={16} color={T.green} />
              <Text style={styles.inviteStatusTextAccepted}>Proposal Accepted! 🎉</Text>
            </View>
          ) : (
            <View style={styles.inviteStatusContainerDeclined}>
              <Ionicons name="close-circle" size={16} color={T.red} />
              <Text style={styles.inviteStatusTextDeclined}>Proposal Declined</Text>
            </View>
          )}
        </View>
      );
    }

    if (msg.text && msg.text.includes("[VibeSplit]")) {
      const isSettlement = msg.text.includes("settled");
      const cleanText = msg.text.replace(/^[💳🤝]\s*\[VibeSplit\]\s*/, "");

      return (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => thread?.isGroup && setShowSplitModal(true)}
          style={[styles.vibeSplitCard, isSettlement ? styles.vibeSplitCardSettled : styles.vibeSplitCardExpense]}
        >
          <View style={styles.vibeSplitHeaderRow}>
            <LinearGradient
              colors={isSettlement ? ["#10B981", "#059669"] : ["#8B5CF6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.vibeSplitBadge}
            >
              <Ionicons name={isSettlement ? "checkmark-circle" : "wallet"} size={13} color="#FFF" />
              <Text style={styles.vibeSplitBadgeText}>{isSettlement ? "SETTLED UP" : "VIBESPLIT BILL"}</Text>
            </LinearGradient>

            {thread?.isGroup ? (
              <View style={styles.vibeSplitTapPill}>
                <Text style={styles.vibeSplitTapText}>Details</Text>
                <Ionicons name="chevron-forward" size={12} color="#A78BFA" />
              </View>
            ) : null}
          </View>

          <Text style={styles.vibeSplitCardText}>{cleanText}</Text>
        </TouchableOpacity>
      );
    }

    return msg.fromMe ? (
      <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubbleGrad}>
        <Text style={styles.bubbleTextMe}>{msg.text}</Text>
      </LinearGradient>
    ) : (
      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        {thread?.isGroup && msg.senderName ? (
          <Text style={[styles.senderNameLabel, { color: getMemberColor(msg.senderName) }]}>
            {msg.senderName}
          </Text>
        ) : null}
        <Text style={styles.bubbleTextThem}>{msg.text}</Text>
      </View>
    );
  };

  const resolveMemberAvatar = (url?: string | null) => {
    if (!url) return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";
    if (url.startsWith("/")) {
      const serverBaseUrl = API_URL.replace("/api", "");
      return `${serverBaseUrl}${url}`;
    }
    return url;
  };

  const thread = id ? getConversation(id) : undefined;
  const plan = (thread && thread.isGroup) ? [...myPlans, ...nearbyPlans].find((p) => p.id === id) : undefined;
  const match = (thread && !thread.isGroup) ? matches.find((m) => m.id === id) : undefined;
  const typers = id ? (typingUsers[id] || []) : [];
  const isTypingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && id) {
        sendTypingStatus(id, false);
      }
    };
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [thread?.messages.length]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && id) {
        sendTypingStatus(id, false);
      }
    };
  }, [id]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (!id) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStatus(id, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingStatus(id, false);
    }, 2500);
  };

  useEffect(() => {
    if (id) markRead(id);
  }, [id, markRead]);

  const isFirstRender = useRef(true);
  const acceptedIdsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!thread?.messages) return;

    if (isFirstRender.current) {
      thread.messages.forEach((m) => {
        if (m.text.includes(":accepted]")) {
          acceptedIdsRef.current[m.id] = true;
        }
      });
      isFirstRender.current = false;
      return;
    }

    thread.messages.forEach((m) => {
      if (m.text.includes(":accepted]") && !acceptedIdsRef.current[m.id]) {
        acceptedIdsRef.current[m.id] = true;
        triggerConfetti();
      }
    });
  }, [thread?.messages]);

  const chatGate = thread && !thread.isGroup && id ? getChatGate(id) : null;
  const canSend = thread?.isGroup ? true : chatGate?.canSend !== false;

  const handleUnmatch = () => {
    if (!id || thread?.isGroup) return;
    Alert.alert(
      "Unmatch?",
      "This will delete the match and chat for both of you.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            await unmatch(id);
            router.back();
          },
        },
      ]
    );
  };

  const handleSend = async () => {
    if (!text.trim() || !id) return;
    if (!canSend) {
      Alert.alert("Chat locked", chatGate?.reason || "Wait for their reply.");
      return;
    }
    const msg = text;
    setText("");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    sendTypingStatus(id, false);
    setShowEmojiPanel(false);

    await sendMessage(id, msg);
  };

  if (!thread) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safe}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={T.ink} />
          </Pressable>
          <Text style={styles.missing}>Chat not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={["rgba(139,92,246,0.16)", "rgba(236,72,153,0.08)", "transparent"]}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={T.ink} />
          </Pressable>
          <Pressable style={styles.headerCenter} onPress={() => setShowDetailsModal(true)}>
            <LinearGradient colors={[...T.cta]} style={styles.headerAvatarRing}>
              <Image source={{ uri: thread.avatarUrl }} style={styles.headerAvatar} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName} numberOfLines={1}>{thread.matchName}</Text>
              <View style={styles.headerMeta}>
                {typers.length > 0 ? (
                  <Text style={[styles.headerStatus, { color: T.purple }]}>
                    {thread.isGroup
                      ? `${typers.map((t) => t.name.split(" ")[0]).join(", ")} typing...`
                      : "Typing..."}
                  </Text>
                ) : thread.isGroup ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="people" size={12} color={T.purple} />
                    <Text style={[styles.headerStatus, { color: T.purple }]}>Hangout group</Text>
                  </View>
                ) : (
                  <>
                    {thread.isOnline ? <PulseDot size={5} color="#22C55E" /> : null}
                    <Text style={styles.headerStatus}>
                      {thread.isOnline ? "Online now" : "Match unlocked"}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Pressable>
          {!thread.isGroup ? (
            <Pressable style={styles.moreBtn} onPress={handleUnmatch}>
              <Ionicons name="close-circle-outline" size={22} color={T.pink} />
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TouchableOpacity
                style={styles.headerSplitBadge}
                onPress={() => setShowSplitModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient colors={["#8B5CF6", "#EC4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerSplitGrad}>
                  <Ionicons name="wallet-outline" size={13} color="#FFF" />
                  <Text style={styles.headerSplitText}>Split 💳</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Pressable style={styles.moreBtn} onPress={() => setShowDetailsModal(true)}>
                <Ionicons name="ellipsis-vertical" size={20} color={T.purple} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.matchBanner}>
          <View style={styles.matchBannerGrad}>
            <View style={styles.matchBannerIcon}>
              <Ionicons
                name={
                  thread.isGroup
                    ? "people"
                    : chatGate?.waitingForOther
                      ? "time"
                      : chatGate?.unlocked
                        ? "chatbubbles"
                        : "heart"
                }
                size={13}
                color={thread.isGroup ? T.purple : T.pink}
              />
            </View>
            <Text style={[styles.matchBannerText, thread.isGroup && { flex: 1 }]}>
              {thread.isGroup
                ? "Hangout group chat — coordinate & split bills"
                : chatGate?.unlocked
                  ? "Chat unlocked — ab freely baat karo"
                  : chatGate?.reason || "You matched — send one hello to start"}
            </Text>
            {thread.isGroup && (
              <TouchableOpacity
                onPress={() => setShowSplitModal(true)}
                style={styles.bannerSplitPill}
                activeOpacity={0.8}
              >
                <Ionicons name="card" size={11} color="#8B5CF6" />
                <Text style={styles.bannerSplitPillText}>Split Bill 💳</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {thread.messages.map((msg) => (
            <View key={msg.id} style={[styles.bubbleWrap, msg.fromMe ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
              {!msg.fromMe ? (
                <Image
                  source={{
                    uri: thread.isGroup
                      ? resolveMemberAvatar(msg.senderAvatar)
                      : thread.avatarUrl,
                  }}
                  style={styles.msgAvatar}
                />
              ) : null}
              <View
                style={[
                  styles.bubble,
                  msg.text.match(/^\[INVITE:([^:]+):([^:]+):([^:]+)\]$/)
                    ? styles.bubbleInvite
                    : msg.fromMe
                      ? styles.bubbleMe
                      : styles.bubbleThem,
                ]}
              >
                {renderMessageContent(msg)}
              </View>
              <Text style={[styles.msgTime, msg.fromMe && styles.msgTimeMe]}>
                {formatMessageTime(msg.sentAt)}
              </Text>
            </View>
          ))}
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.inputBar}>
          <View style={styles.inputRow}>
            <Pressable style={styles.attachBtn} onPress={toggleAttachPanel}>
              <Ionicons name={showAttachPanel ? "close" : "add"} size={22} color={T.purple} />
            </Pressable>

            <Pressable style={styles.emojiToggleBtn} onPress={toggleEmojiPanel}>
              <Ionicons
                name={showEmojiPanel ? "keypad-outline" : "happy-outline"}
                size={22}
                color={T.purple}
              />
            </Pressable>

            <Pressable style={styles.hangoutToggleBtn} onPress={toggleHangoutPanel}>
              <Ionicons name="cafe-outline" size={22} color={T.purple} />
            </Pressable>

            {thread.isGroup && (
              <Pressable
                style={styles.splitToggleBtn}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowEmojiPanel(false);
                  setShowHangoutPanel(false);
                  setShowAttachPanel(false);
                  setShowSplitModal(true);
                }}
              >
                <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.splitBtnGrad}>
                  <Ionicons name="wallet-outline" size={16} color="#fff" />
                </LinearGradient>
              </Pressable>
            )}

            <TextInput
              style={[styles.input, !canSend && styles.inputDisabled]}
              value={text}
              onChangeText={handleTextChange}
              onFocus={() => {
                setShowEmojiPanel(false);
                setShowHangoutPanel(false);
                setShowAttachPanel(false);
              }}
              placeholder={
                !canSend
                  ? chatGate?.waitingForOther
                    ? "Waiting for their reply..."
                    : "Chat locked"
                  : chatGate?.mustSendOpener
                    ? "Send your one hello..."
                    : "Type a message..."
              }
              placeholderTextColor={T.faint}
              multiline
              editable={canSend}
            />
            <Pressable onPress={handleSend} disabled={!text.trim() || !canSend}>
              {text.trim() && canSend ? (
                <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtn}>
                  <Ionicons name="send" size={17} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={[styles.sendBtn, styles.sendBtnDisabled]}>
                  <Ionicons name="send" size={17} color={T.faint} />
                </View>
              )}
            </Pressable>
          </View>

          {showAttachPanel && (
            <View style={styles.attachPanel}>
              <Text style={styles.attachPanelTitle}>Group Quick Options</Text>
              <Text style={styles.attachPanelSub}>
                Split bills, send hangout invites, or react!
              </Text>
              <View style={styles.attachOptionsRow}>
                {thread.isGroup && (
                  <TouchableOpacity
                    style={styles.attachOptionCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowAttachPanel(false);
                      setShowSplitModal(true);
                    }}
                  >
                    <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.attachOptionIconBg}>
                      <Ionicons name="card" size={20} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.attachOptionLabel}>Split Bills</Text>
                    <Text style={styles.attachOptionSub}>VibeSplit 💳</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.attachOptionCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    setShowAttachPanel(false);
                    toggleHangoutPanel();
                  }}
                >
                  <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.attachOptionIconBg}>
                    <Ionicons name="cafe" size={20} color="#FFF" />
                  </LinearGradient>
                  <Text style={styles.attachOptionLabel}>Hangout</Text>
                  <Text style={styles.attachOptionSub}>Proposal ☕</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOptionCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    setShowAttachPanel(false);
                    toggleEmojiPanel();
                  }}
                >
                  <LinearGradient colors={["#06B6D4", "#0284C7"]} style={styles.attachOptionIconBg}>
                    <Ionicons name="happy" size={20} color="#FFF" />
                  </LinearGradient>
                  <Text style={styles.attachOptionLabel}>Emojis</Text>
                  <Text style={styles.attachOptionSub}>Reactions 😊</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showEmojiPanel && (
            <View style={styles.emojiPanel}>
              <ScrollView
                contentContainerStyle={styles.emojiGrid}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={styles.emojiPanelItem}
                    onPress={() => handleEmojiSelect(emoji)}
                  >
                    <Text style={styles.emojiPanelText}>{emoji}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {showHangoutPanel && (
            <View style={styles.hangoutPanel}>
              <Text style={styles.hangoutPanelTitle}>Quick Hangout Proposal</Text>
              <Text style={styles.hangoutPanelSub}>
                Ask them out in one tap. They can accept or decline instantly!
              </Text>

              <View style={styles.hangoutOptionsRow}>
                {[
                  { name: "Coffee Date", emoji: "☕", gradient: ["#F59E0B", "#D97706"] as const },
                  { name: "Travel Trip", emoji: "✈️", gradient: ["#06B6D4", "#0284C7"] as const },
                  { name: "Movie Night", emoji: "🍿", gradient: ["#EC4899", "#DB2777"] as const },
                  { name: "Dinner", emoji: "🍽️", gradient: ["#10B981", "#059669"] as const },
                  { name: "Drinks", emoji: "🍺", gradient: ["#3B82F6", "#2563EB"] as const },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.hangoutOptionCard}
                    activeOpacity={0.85}
                    onPress={() => sendHangoutInvite(item.name, item.emoji)}
                  >
                    <LinearGradient colors={[...item.gradient]} style={styles.hangoutOptionIconBg}>
                      <Text style={styles.hangoutOptionEmoji}>{item.emoji}</Text>
                    </LinearGradient>
                    <Text style={styles.hangoutOptionLabel}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Details modal overlay */}
      {showDetailsModal && (
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} lightMode>
            <TouchableOpacity
              style={styles.modalCloseIcon}
              onPress={() => setShowDetailsModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={T.ink} />
            </TouchableOpacity>

            {thread.isGroup ? (
              <View style={styles.modalContent}>
                <View style={styles.avatarGlowContainer}>
                  <Image source={{ uri: thread.avatarUrl }} style={styles.modalAvatarLarge} />
                </View>
                <Text style={styles.modalTitle}>{thread.matchName}</Text>

                {/* VibeSplit Quick Banner in Group Info Modal */}
                <TouchableOpacity
                  style={styles.modalSplitCard}
                  onPress={() => {
                    setShowDetailsModal(false);
                    setShowSplitModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#8B5CF6", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSplitGrad}
                  >
                    <View style={styles.modalSplitIconCircle}>
                      <Ionicons name="wallet" size={18} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalSplitTitle}>VibeSplit — Split Bills 💳💸</Text>
                      <Text style={styles.modalSplitSub}>Add expenses & settle balances for this hangout group</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>

                {plan ? (
                  <View style={styles.groupInfoBox}>
                    <Text style={styles.groupDesc} numberOfLines={3}>
                      {plan.description || "Coordinate hangout logistics, location, and timing below."}
                    </Text>

                    <View style={styles.infoRowInline}>
                      <Ionicons name="location" size={14} color={T.purple} />
                      <Text style={styles.infoTextInline} numberOfLines={1}>
                        {plan.location || "Flexible Location"}
                      </Text>
                    </View>

                    <View style={styles.infoRowInline}>
                      <Ionicons name="time" size={14} color={T.purple} />
                      <Text style={styles.infoTextInline} numberOfLines={1}>
                        {plan.timeLabel || "Flexible Timing"}
                      </Text>
                    </View>

                    <Text style={styles.membersTitle}>
                      Group Members ({plan.participants?.length || 0})
                    </Text>

                    <ScrollView
                      style={styles.membersScroll}
                      contentContainerStyle={styles.membersScrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {plan.participants?.map((member) => (
                        <View key={member.id} style={styles.memberRow}>
                          <Image
                            source={{
                              uri:
                                member.avatarUrl ||
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
                            }}
                            style={styles.memberAvatar}
                          />
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.name} {member.id === plan.creatorId ? "(Host)" : ""}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.errorTextInline}>Plan details unavailable</Text>
                )}
              </View>
            ) : (
              <View style={styles.modalContent}>
                <View style={styles.avatarGlowContainer}>
                  <Image source={{ uri: thread.avatarUrl }} style={styles.modalAvatarLarge} />
                </View>
                <Text style={styles.modalTitle}>{match?.name || thread.matchName}</Text>

                <View style={styles.matchInfoBox}>
                  {match?.bio ? (
                    <Text style={styles.groupDesc}>{match.bio}</Text>
                  ) : (
                    <Text style={styles.groupDesc}>
                      Hey! We matched on Discover. Let's get to know each other 💘
                    </Text>
                  )}

                  {match?.city && (
                    <View style={styles.infoRowInline}>
                      <Ionicons name="home" size={14} color={T.pink} />
                      <Text style={styles.infoTextInline}>Lives in {match.city}</Text>
                    </View>
                  )}

                  {match?.education && (
                    <View style={styles.infoRowInline}>
                      <Ionicons name="school" size={14} color={T.pink} />
                      <Text style={styles.infoTextInline}>{match.education}</Text>
                    </View>
                  )}

                  <View style={styles.infoRowInline}>
                    <Ionicons name="sparkles" size={14} color={T.pink} />
                    <Text style={styles.infoTextInline}>Interested in Vibes & Hangouts</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setShowDetailsModal(false)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalConfirmGrad}>
                <Text style={styles.modalConfirmBtnText}>Close Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

      {confettiActive && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: 3 }).map((_, rocketIdx) => (
            <RocketAndExplosion key={`${confettiKey}-${rocketIdx}`} index={rocketIdx} />
          ))}
        </View>
      )}

      {thread.isGroup && (
        <VibeSplitModal
          visible={showSplitModal}
          onClose={() => setShowSplitModal(false)}
          hangoutId={id}
          titleName={thread.matchName || "Hangout"}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  topGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 220 },
  safe: { backgroundColor: "transparent" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: T.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 18,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerAvatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerName: {
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.3,
  },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  headerStatus: { fontSize: 11, fontFamily: VibeFonts.bold, color: T.green },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: T.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  matchBanner: { paddingHorizontal: 16, paddingBottom: 10 },
  matchBannerGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  matchBannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: T.softPink,
    alignItems: "center",
    justifyContent: "center",
  },
  matchBannerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
    lineHeight: 16,
  },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 16, gap: 14 },
  bubbleWrap: { maxWidth: "82%" },
  bubbleWrapMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleWrapThem: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bubble: { borderRadius: 22, overflow: "hidden", maxWidth: "100%" },
  bubbleMe: {
    borderBottomRightRadius: 6,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bubbleThem: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    borderBottomLeftRadius: 6,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bubbleGrad: { paddingHorizontal: 16, paddingVertical: 12 },
  bubbleTextMe: {
    fontSize: 14.5,
    fontFamily: VibeFonts.medium,
    color: "#FFFFFF",
    lineHeight: 21,
  },
  bubbleTextThem: {
    fontSize: 14.5,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    lineHeight: 21,
  },
  msgTime: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.faint,
    marginTop: 4,
    marginLeft: 4,
  },
  msgTimeMe: { marginRight: 4, marginLeft: 0 },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.glass,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: T.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  inputDisabled: { opacity: 0.55 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EC4899",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: T.softPurple,
    borderWidth: 1,
    borderColor: T.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  missing: {
    color: T.ink,
    textAlign: "center",
    marginTop: 40,
    fontFamily: VibeFonts.bold,
    fontSize: 16,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 11, 26, 0.55)",
    zIndex: 99,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    padding: Spacing.xl,
    alignItems: "center",
    borderColor: T.border,
    maxHeight: "82%",
    backgroundColor: T.card,
    borderRadius: 28,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalCloseIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  modalContent: {
    width: "100%",
    alignItems: "center",
  },
  avatarGlowContainer: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    borderRadius: 55,
    marginBottom: Spacing.md,
  },
  modalAvatarLarge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3.5,
    borderColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    textAlign: "center",
    marginBottom: Spacing.sm,
    letterSpacing: -0.4,
  },
  groupInfoBox: { width: "100%", gap: 10 },
  matchInfoBox: { width: "100%", gap: 12, marginTop: Spacing.xs },
  groupDesc: {
    fontSize: 13.5,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: Spacing.xs,
  },
  infoRowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: T.softPurple,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  infoTextInline: {
    color: T.ink,
    fontSize: 13,
    fontFamily: VibeFonts.semiBold,
    flex: 1,
  },
  membersTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.extraBold,
    color: T.faint,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  membersScroll: { maxHeight: 160, width: "100%" },
  membersScrollContent: { gap: 8 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: T.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: T.border,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  memberName: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  modalConfirmBtn: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    marginTop: Spacing.lg,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalConfirmGrad: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 18,
  },
  modalConfirmBtnText: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.bold,
    fontSize: 14,
  },
  errorTextInline: {
    color: T.muted,
    fontFamily: VibeFonts.medium,
    fontSize: 12,
  },
  senderNameLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.extraBold,
    color: T.purple,
    marginBottom: 3,
  },
  emojiToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  emojiPanel: {
    height: 250,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.card,
    paddingVertical: 10,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    gap: 8,
  },
  emojiPanelItem: {
    width: "11%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPanelText: { fontSize: 24 },
  emojiText: { fontSize: 15 },
  hangoutToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  hangoutPanel: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.card,
  },
  hangoutPanelTitle: {
    color: T.ink,
    fontFamily: VibeFonts.extraBold,
    fontSize: 16,
    textAlign: "center",
  },
  hangoutPanelSub: {
    color: T.muted,
    fontFamily: VibeFonts.medium,
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 14,
  },
  hangoutOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  hangoutOptionCard: {
    flex: 1,
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  hangoutOptionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  hangoutOptionEmoji: { fontSize: 20 },
  hangoutOptionLabel: {
    color: T.ink,
    fontFamily: VibeFonts.bold,
    fontSize: 12,
    textAlign: "center",
  },
  bubbleInvite: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    borderRadius: 22,
    overflow: "hidden",
    width: 260,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  inviteCard: { padding: 14 },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inviteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  inviteIconText: { fontSize: 22 },
  inviteTitle: {
    color: T.ink,
    fontFamily: VibeFonts.extraBold,
    fontSize: 15,
  },
  inviteSub: {
    color: T.muted,
    fontFamily: VibeFonts.semiBold,
    fontSize: 11,
    marginTop: 1,
  },
  inviteDivider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 12,
  },
  inviteStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  inviteStatusTextPending: {
    color: T.purple,
    fontFamily: VibeFonts.bold,
    fontSize: 12.5,
  },
  inviteActions: { flexDirection: "row", gap: 8 },
  inviteActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inviteAcceptBtn: { backgroundColor: T.green },
  inviteDeclineBtn: { backgroundColor: T.red },
  inviteActionBtnText: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.extraBold,
    fontSize: 12,
  },
  inviteStatusContainerAccepted: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  inviteStatusTextAccepted: {
    color: T.green,
    fontFamily: VibeFonts.extraBold,
    fontSize: 13,
  },
  inviteStatusContainerDeclined: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  inviteStatusTextDeclined: {
    color: T.red,
    fontFamily: VibeFonts.extraBold,
    fontSize: 13,
  },
  vibeSplitCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.25)",
    maxWidth: 280,
    gap: 8,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  vibeSplitCardExpense: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  vibeSplitCardSettled: {
    backgroundColor: "#F0FDF4",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  vibeSplitHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  vibeSplitTapPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vibeSplitTapText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  vibeSplitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vibeSplitBadgeText: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.extraBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  vibeSplitCardText: {
    color: T.ink,
    fontFamily: VibeFonts.semiBold,
    fontSize: 13.5,
    lineHeight: 19,
  },
  headerSplitBadge: {
    borderRadius: 12,
    overflow: "hidden",
  },
  headerSplitGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  headerSplitText: {
    color: "#FFFFFF",
    fontFamily: VibeFonts.bold,
    fontSize: 11,
  },
  bannerSplitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  bannerSplitPillText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#7C3AED",
  },
  splitToggleBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  splitBtnGrad: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  attachPanel: {
    padding: 14,
    backgroundColor: T.card,
    borderTopWidth: 1,
    borderColor: T.border,
  },
  attachPanelTitle: {
    fontSize: 14,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
  },
  attachPanelSub: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginBottom: 10,
    marginTop: 2,
  },
  attachOptionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  attachOptionCard: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    backgroundColor: T.softPurple,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.15)",
  },
  attachOptionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  attachOptionLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.ink,
  },
  attachOptionSub: {
    fontSize: 10,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginTop: 1,
  },
  modalSplitCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
  },
  modalSplitGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  modalSplitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSplitTitle: {
    fontSize: 13,
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
  },
  modalSplitSub: {
    fontSize: 10.5,
    fontFamily: VibeFonts.medium,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 1,
  },
});

