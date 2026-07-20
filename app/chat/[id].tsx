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
                <Ionicons name="time-outline" size={14} color="#C084FC" />
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
              <Ionicons name="checkmark-done-circle" size={16} color="#22C55E" />
              <Text style={styles.inviteStatusTextAccepted}>Proposal Accepted! 🎉</Text>
            </View>
          ) : (
            <View style={styles.inviteStatusContainerDeclined}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.inviteStatusTextDeclined}>Proposal Declined</Text>
            </View>
          )}
        </View>
      );
    }

    return msg.fromMe ? (
      <LinearGradient colors={["#8A56FF", "#FF4B81"]} style={styles.bubbleGrad}>
        <Text style={styles.bubbleTextMe}>{msg.text}</Text>
      </LinearGradient>
    ) : (
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
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
        <SafeAreaView style={styles.safe}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.missing}>Chat not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={["rgba(138,86,255,0.12)", "transparent"]} style={styles.topGlow} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Pressable style={styles.headerCenter} onPress={() => setShowDetailsModal(true)}>
            <Image source={{ uri: thread.avatarUrl }} style={styles.headerAvatar} />
            <View>
              <Text style={styles.headerName}>{thread.matchName}</Text>
              <View style={styles.headerMeta}>
                {typers.length > 0 ? (
                  <Text style={[styles.headerStatus, { color: "#A855F7" }]}>
                    {thread.isGroup 
                      ? `${typers.map((t) => t.name.split(" ")[0]).join(", ")} typing...` 
                      : "Typing..."}
                  </Text>
                ) : thread.isGroup ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="people" size={12} color="#22C55E" />
                    <Text style={[styles.headerStatus, { color: "#22C55E" }]}>Hangout Group Chat</Text>
                  </View>
                ) : (
                  <>
                    {thread.isOnline ? <PulseDot size={5} /> : null}
                    <Text style={styles.headerStatus}>{thread.isOnline ? "Online now" : "Match unlocked"}</Text>
                  </>
                )}
              </View>
            </View>
          </Pressable>
          {!thread.isGroup ? (
            <Pressable style={styles.moreBtn} onPress={handleUnmatch}>
              <Ionicons name="close-circle-outline" size={22} color="#FF4B81" />
            </Pressable>
          ) : (
            <Pressable style={styles.moreBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color="#C084FC" />
            </Pressable>
          )}
        </View>

        <View style={styles.matchBanner}>
          <LinearGradient colors={["rgba(255,75,129,0.15)", "rgba(138,86,255,0.1)"]} style={styles.matchBannerGrad}>
            <Ionicons
              name={thread.isGroup ? "people" : chatGate?.waitingForOther ? "time" : chatGate?.unlocked ? "chatbubbles" : "heart"}
              size={14}
              color={thread.isGroup ? "#C084FC" : "#FF4B81"}
            />
            <Text style={styles.matchBannerText}>
              {thread.isGroup
                ? "This is your Hangout group chat. Coordinate plans here!"
                : chatGate?.unlocked
                  ? "Chat unlocked — ab freely baat karo"
                  : chatGate?.reason || "You matched — send one hello to start"}
            </Text>
          </LinearGradient>
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
                      : thread.avatarUrl 
                  }} 
                  style={styles.msgAvatar} 
                />
              ) : null}
              <View 
                style={[
                  styles.bubble, 
                  msg.text.match(/^\[INVITE:([^:]+):([^:]+):([^:]+)\]$/) 
                    ? styles.bubbleInvite 
                    : (msg.fromMe ? styles.bubbleMe : styles.bubbleThem)
                ]}
              >
                {renderMessageContent(msg)}
              </View>
              <Text style={[styles.msgTime, msg.fromMe && styles.msgTimeMe]}>{formatMessageTime(msg.sentAt)}</Text>
            </View>
          ))}
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.inputBar}>
          <View style={styles.inputRow}>
            <Pressable style={styles.attachBtn}>
              <Ionicons name="add" size={22} color="#C084FC" />
            </Pressable>

            <Pressable style={styles.emojiToggleBtn} onPress={toggleEmojiPanel}>
              <Ionicons 
                name={showEmojiPanel ? "keyboard-outline" : "happy-outline"} 
                size={22} 
                color="#C084FC" 
              />
            </Pressable>

            <Pressable style={styles.hangoutToggleBtn} onPress={toggleHangoutPanel}>
              <Ionicons 
                name="cafe-outline" 
                size={22} 
                color="#C084FC" 
              />
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
              placeholderTextColor={VibeColors.textMuted}
              multiline
              editable={canSend}
            />
            <Pressable onPress={handleSend} disabled={!text.trim() || !canSend}>
              <LinearGradient
                colors={text.trim() && canSend ? ["#22C55E", "#15803D"] : ["#333", "#222"]}
                style={styles.sendBtn}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </LinearGradient>
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
              <Text style={styles.hangoutPanelSub}>Ask them out in one tap. They can accept or decline instantly!</Text>
              
              <View style={styles.hangoutOptionsRow}>
                {[
                  { name: "Coffee Date", emoji: "☕", gradient: ["#F59E0B", "#D97706"] },
                  { name: "Movie Night", emoji: "🍿", gradient: ["#EC4899", "#DB2777"] },
                  { name: "Dinner", emoji: "🍽️", gradient: ["#10B981", "#059669"] },
                  { name: "Drinks", emoji: "🍺", gradient: ["#3B82F6", "#2563EB"] }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.hangoutOptionCard}
                    activeOpacity={0.85}
                    onPress={() => sendHangoutInvite(item.name, item.emoji)}
                  >
                    <LinearGradient colors={item.gradient} style={styles.hangoutOptionIconBg}>
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
          <GlassCard style={styles.modalCard}>
            <TouchableOpacity 
              style={styles.modalCloseIcon} 
              onPress={() => setShowDetailsModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            {thread.isGroup ? (
              // Group Details
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
                      <Ionicons name="location" size={14} color="#C084FC" />
                      <Text style={styles.infoTextInline} numberOfLines={1}>
                        {plan.location || "Flexible Location"}
                      </Text>
                    </View>

                    <View style={styles.infoRowInline}>
                      <Ionicons name="time" size={14} color="#C084FC" />
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
                              uri: member.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" 
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
              // Match Profile Details
              <View style={styles.modalContent}>
                <View style={styles.avatarGlowContainer}>
                  <Image source={{ uri: thread.avatarUrl }} style={styles.modalAvatarLarge} />
                </View>
                <Text style={styles.modalTitle}>
                  {match?.name || thread.matchName}
                </Text>
                
                <View style={styles.matchInfoBox}>
                  {match?.bio ? (
                    <Text style={styles.groupDesc}>{match.bio}</Text>
                  ) : (
                    <Text style={styles.groupDesc}>Hey! We matched on Discover. Let's get to know each other 💘</Text>
                  )}

                  {match?.city && (
                    <View style={styles.infoRowInline}>
                      <Ionicons name="home" size={14} color="#FF4B81" />
                      <Text style={styles.infoTextInline}>Lives in {match.city}</Text>
                    </View>
                  )}

                  {match?.education && (
                    <View style={styles.infoRowInline}>
                      <Ionicons name="school" size={14} color="#FF4B81" />
                      <Text style={styles.infoTextInline}>{match.education}</Text>
                    </View>
                  )}
                  
                  <View style={styles.infoRowInline}>
                    <Ionicons name="sparkles" size={14} color="#FF4B81" />
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
              <Text style={styles.modalConfirmBtnText}>Close Details</Text>
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
  root: { flex: 1, backgroundColor: VibeColors.bg },
  topGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  safe: { backgroundColor: "transparent" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: VibeColors.bgGlassBorder,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: "rgba(138,86,255,0.5)" },
  headerName: { fontSize: 16, fontFamily: VibeFonts.bold, color: VibeColors.text },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerStatus: { fontSize: 11, fontFamily: VibeFonts.medium, color: VibeColors.neonGreenDim },
  moreBtn: { padding: 8 },
  matchBanner: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  matchBannerGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,75,129,0.2)",
  },
  matchBannerText: { fontSize: 11, fontFamily: VibeFonts.semiBold, color: "#FF8FAB" },
  messages: { flex: 1 },
  messagesContent: { padding: Spacing.lg, paddingBottom: Spacing.md, gap: 12 },
  bubbleWrap: { maxWidth: "82%" },
  bubbleWrapMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleWrapThem: { alignSelf: "flex-start", flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14 },
  bubble: { borderRadius: 18, overflow: "hidden", maxWidth: "100%" },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: VibeColors.bgGlassBorder, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleGrad: { paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTextMe: { fontSize: 14, fontFamily: VibeFonts.medium, color: "#fff", lineHeight: 20 },
  bubbleTextThem: { fontSize: 14, fontFamily: VibeFonts.medium, color: VibeColors.text, lineHeight: 20 },
  msgTime: { fontSize: 9, fontFamily: VibeFonts.medium, color: VibeColors.textMuted, marginTop: 4, marginLeft: 4 },
  msgTimeMe: { marginRight: 4, marginLeft: 0 },
  inputBar: { borderTopWidth: 1, borderTopColor: VibeColors.bgGlassBorder, backgroundColor: "rgba(8,8,14,0.95)" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(138,86,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: VibeColors.text,
    borderWidth: 1,
    borderColor: VibeColors.bgGlassBorder,
  },
  inputDisabled: {
    opacity: 0.55,
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  missing: { color: VibeColors.text, textAlign: "center", marginTop: 40, fontFamily: VibeFonts.medium },

  // Details Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,5,8,0.85)",
    zIndex: 99,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    padding: Spacing.xl,
    alignItems: "center",
    borderColor: "rgba(138,86,255,0.2)",
    maxHeight: "80%",
  },
  modalCloseIcon: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalContent: {
    width: "100%",
    alignItems: "center",
  },
  avatarGlowContainer: {
    shadowColor: "#8A56FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  modalAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#C084FC",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: VibeFonts.extraBold,
    color: "#fff",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  groupInfoBox: {
    width: "100%",
    gap: 8,
  },
  matchInfoBox: {
    width: "100%",
    gap: 10,
    marginTop: Spacing.xs,
  },
  groupDesc: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: VibeColors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  infoRowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  infoTextInline: {
    color: "#fff",
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    flex: 1,
  },
  membersTitle: {
    fontSize: 12,
    fontFamily: VibeFonts.bold,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  membersScroll: {
    maxHeight: 160,
    width: "100%",
  },
  membersScrollContent: {
    gap: 6,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  memberAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  memberName: {
    fontSize: 13,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  modalConfirmBtn: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  modalConfirmBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: VibeFonts.bold,
    fontSize: 13,
  },
  errorTextInline: {
    color: VibeColors.textMuted,
    fontFamily: VibeFonts.medium,
    fontSize: 12,
  },
  senderNameLabel: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: "#C084FC",
    marginBottom: 2,
  },
  emojiToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(138,86,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPanel: {
    height: 250,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,10,18,0.95)",
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
    width: "11%", // roughly 8 items per row
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPanelText: {
    fontSize: 24,
  },
  emojiText: {
    fontSize: 15,
  },
  hangoutToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(138,86,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  hangoutPanel: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,10,18,0.95)",
  },
  hangoutPanelTitle: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
    fontSize: 15,
    textAlign: "center",
  },
  hangoutPanelSub: {
    color: VibeColors.textMuted,
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
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
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
  hangoutOptionEmoji: {
    fontSize: 18,
  },
  hangoutOptionLabel: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
    fontSize: 11,
    textAlign: "center",
  },
  bubbleInvite: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: Radius.lg,
    overflow: "hidden",
    width: 250,
  },
  inviteCard: {
    padding: 12,
  },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inviteIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inviteIconText: {
    fontSize: 20,
  },
  inviteTitle: {
    color: "#fff",
    fontFamily: VibeFonts.bold,
    fontSize: 14,
  },
  inviteSub: {
    color: VibeColors.textMuted,
    fontFamily: VibeFonts.medium,
    fontSize: 10,
    marginTop: 1,
  },
  inviteDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 10,
  },
  inviteStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  inviteStatusTextPending: {
    color: "#C084FC",
    fontFamily: VibeFonts.semiBold,
    fontSize: 12,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  inviteActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  inviteAcceptBtn: {
    backgroundColor: "#22C55E",
  },
  inviteDeclineBtn: {
    backgroundColor: "#EF4444",
  },
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
    color: "#22C55E",
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
    color: "#EF4444",
    fontFamily: VibeFonts.bold,
    fontSize: 13,
  },
});
