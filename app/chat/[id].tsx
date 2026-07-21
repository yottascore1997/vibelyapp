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
import { useMatches } from "../../context/MatchesContext";
import { usePlans } from "../../context/PlansContext";
import { formatMessageTime } from "../../constants/chats";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing, API_URL } from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const T = {
  bg: "#EEE9F8",
  card: "#FFFBFE",
  ink: "#1A1F36",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E4DFF0",
  softPurple: "#EDE7FF",
  softPink: "#FCE7F3",
  purple: VibeColors.glowPurple || "#8B5CF6",
  purpleDeep: "#7C3AED",
  pink: VibeColors.neonPink || "#EC4899",
  green: "#16A34A",
  greenSoft: "#DCFCE7",
  red: "#EF4444",
  glass: "rgba(255,251,254,0.96)",
  cta: ["#8B5CF6", "#EC4899"] as const,
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
  hasExploded: Animated.SharedValue<boolean>;
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showHangoutPanel, setShowHangoutPanel] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const triggerConfetti = () => {
    setConfettiKey((prev) => prev + 1);
    setConfettiActive(true);
    setTimeout(() => {
      setConfettiActive(false);
    }, 5500);
  };

  const toggleEmojiPanel = () => {
    if (!showEmojiPanel) {
      Keyboard.dismiss();
      setShowHangoutPanel(false);
    }
    setShowEmojiPanel((prev) => !prev);
  };

  const toggleHangoutPanel = () => {
    if (!showHangoutPanel) {
      Keyboard.dismiss();
      setShowEmojiPanel(false);
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

    return msg.fromMe ? (
      <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubbleGrad}>
        <Text style={styles.bubbleTextMe}>{msg.text}</Text>
      </LinearGradient>
    ) : (
      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        {thread.isGroup && msg.senderName ? (
          <Text style={styles.senderNameLabel}>{msg.senderName}</Text>
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
            <Pressable style={styles.moreBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color={T.purple} />
            </Pressable>
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
            <Text style={styles.matchBannerText}>
              {thread.isGroup
                ? "Hangout group chat — coordinate plans here"
                : chatGate?.unlocked
                  ? "Chat unlocked — ab freely baat karo"
                  : chatGate?.reason || "You matched — send one hello to start"}
            </Text>
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
            <Pressable style={styles.attachBtn}>
              <Ionicons name="add" size={22} color={T.purple} />
            </Pressable>

            <Pressable style={styles.emojiToggleBtn} onPress={toggleEmojiPanel}>
              <Ionicons
                name={showEmojiPanel ? "keyboard-outline" : "happy-outline"}
                size={22}
                color={T.purple}
              />
            </Pressable>

            <Pressable style={styles.hangoutToggleBtn} onPress={toggleHangoutPanel}>
              <Ionicons name="cafe-outline" size={22} color={T.purple} />
            </Pressable>

            <TextInput
              style={[styles.input, !canSend && styles.inputDisabled]}
              value={text}
              onChangeText={handleTextChange}
              onFocus={() => {
                setShowEmojiPanel(false);
                setShowHangoutPanel(false);
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  topGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 180 },
  safe: { backgroundColor: "transparent" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: T.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatarRing: {
    width: 46,
    height: 46,
    borderRadius: 16,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerName: {
    fontSize: 16,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    letterSpacing: -0.2,
  },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerStatus: { fontSize: 11, fontFamily: VibeFonts.semiBold, color: T.green },
  moreBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: T.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
  },
  matchBanner: { paddingHorizontal: 14, paddingBottom: 10 },
  matchBannerGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  matchBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: T.softPink,
    alignItems: "center",
    justifyContent: "center",
  },
  matchBannerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
    lineHeight: 15,
  },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 12, gap: 14 },
  bubbleWrap: { maxWidth: "82%" },
  bubbleWrapMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleWrapThem: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  bubble: { borderRadius: 20, overflow: "hidden", maxWidth: "100%" },
  bubbleMe: {
    borderBottomRightRadius: 6,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  bubbleThem: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderBottomLeftRadius: 6,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleGrad: { paddingHorizontal: 14, paddingVertical: 11 },
  bubbleTextMe: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: "#fff",
    lineHeight: 20,
  },
  bubbleTextThem: {
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 9,
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
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: T.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    borderWidth: 1,
    borderColor: T.border,
  },
  inputDisabled: { opacity: 0.55 },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: T.softPurple,
    borderWidth: 1,
    borderColor: T.border,
  },
  missing: {
    color: T.ink,
    textAlign: "center",
    marginTop: 40,
    fontFamily: VibeFonts.medium,
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,11,26,0.45)",
    zIndex: 99,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    padding: Spacing.xl,
    alignItems: "center",
    borderColor: T.border,
    maxHeight: "80%",
    backgroundColor: T.card,
  },
  modalCloseIcon: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalContent: {
    width: "100%",
    alignItems: "center",
  },
  avatarGlowContainer: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  modalAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: T.ink,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  groupInfoBox: { width: "100%", gap: 8 },
  matchInfoBox: { width: "100%", gap: 10, marginTop: Spacing.xs },
  groupDesc: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  infoRowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: T.softPurple,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  infoTextInline: {
    color: T.ink,
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    flex: 1,
  },
  membersTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: T.faint,
    textTransform: "uppercase",
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  membersScroll: { maxHeight: 160, width: "100%" },
  membersScrollContent: { gap: 6 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: T.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: T.border,
  },
  memberAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    borderRadius: 16,
    overflow: "hidden",
    marginTop: Spacing.lg,
  },
  modalConfirmGrad: {
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 16,
  },
  modalConfirmBtnText: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
    fontSize: 13,
  },
  errorTextInline: {
    color: T.muted,
    fontFamily: VibeFonts.medium,
    fontSize: 12,
  },
  senderNameLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.purple,
    marginBottom: 2,
  },
  emojiToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
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
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  hangoutPanel: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.card,
  },
  hangoutPanelTitle: {
    color: T.ink,
    fontFamily: VibeFonts.bold,
    fontSize: 15,
    textAlign: "center",
  },
  hangoutPanelSub: {
    color: T.muted,
    fontFamily: VibeFonts.medium,
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 12,
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
    paddingVertical: 12,
    alignItems: "center",
  },
  hangoutOptionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  hangoutOptionEmoji: { fontSize: 18 },
  hangoutOptionLabel: {
    color: T.ink,
    fontFamily: VibeFonts.bold,
    fontSize: 11,
    textAlign: "center",
  },
  bubbleInvite: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 20,
    overflow: "hidden",
    width: 250,
  },
  inviteCard: { padding: 12 },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inviteIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.softPurple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  inviteIconText: { fontSize: 20 },
  inviteTitle: {
    color: T.ink,
    fontFamily: VibeFonts.bold,
    fontSize: 14,
  },
  inviteSub: {
    color: T.muted,
    fontFamily: VibeFonts.medium,
    fontSize: 10,
    marginTop: 1,
  },
  inviteDivider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 10,
  },
  inviteStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  inviteStatusTextPending: {
    color: T.purple,
    fontFamily: VibeFonts.semiBold,
    fontSize: 12,
  },
  inviteActions: { flexDirection: "row", gap: 8 },
  inviteActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  inviteAcceptBtn: { backgroundColor: T.green },
  inviteDeclineBtn: { backgroundColor: T.red },
  inviteActionBtnText: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
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
    fontFamily: VibeFonts.bold,
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
    fontFamily: VibeFonts.bold,
    fontSize: 13,
  },
});

