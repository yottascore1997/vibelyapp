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
  FadeInDown,
  FadeOutDown,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import PulseDot from "../../components/home/PulseDot";
import GlassCard from "../../components/vibe/GlassCard";
import VibeSplitModal from "../../components/vibe/VibeSplitModal";
import { useMatches } from "../../context/MatchesContext";
import { usePlans } from "../../context/PlansContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/api";
import { showSafetyMenu, ICEBREAKERS } from "../../utils/datingSafety";
import {
  formatMessageTime,
  formatLastSeen,
  formatDayLabel,
  sameCalendarDay,
  parsePhotoUrl,
  encodeReplyMessage,
  formatChatPreview,
  type ChatMessage,
} from "../../constants/chats";
import { VibeColors, VibeFonts } from "../../constants/vibeTheme";
import { Radius, Spacing, API_URL } from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const T = {
  bg: "#000000",
  card: "#0C0F17",
  cardElevated: "#131722",
  ink: "#FFFFFF",
  muted: "#94A3B8",
  faint: "#64748B",
  border: "rgba(255, 255, 255, 0.08)",
  softPurple: "rgba(34, 211, 238, 0.12)",
  softPink: "rgba(212, 247, 44, 0.12)",
  purple: "#22D3EE",
  purpleDeep: "#06B6D4",
  purpleBright: "#38BDF8",
  pink: "#D4F72C",
  green: "#22C55E",
  greenSoft: "rgba(34, 197, 94, 0.18)",
  red: "#EF4444",
  glass: "#000000",
  cta: ["#D4F72C", "#22D3EE"] as const,
  bubbleGradMe: ["#0EA5E9", "#0284C7"] as const,
};

const MEMBER_COLORS = ["#22D3EE", "#D4F72C", "#38BDF8", "#34D399", "#FBBF24", "#A78BFA"];
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
    deleteMessage,
    getChatGate,
    unmatch,
    deleteCustomGroup,
  } = useMatches();
  const { myPlans, nearbyPlans, refresh: refreshPlans } = usePlans();
  const { token, user } = useAuth();
  const { openInviteModal } = useNotifications();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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

  const handleInviteAction = async (
    messageId: string,
    activityName: string,
    emoji: string,
    status: "accepted" | "rejected"
  ) => {
    if (!id) return;
    const currentThread = getConversation(id);

    if (status === "rejected") {
      updateMessageContent(
        messageId,
        `[INVITE:${activityName}:${emoji}:rejected]`,
        id,
        currentThread?.isGroup
      );
      return;
    }

    try {
      const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const plan = await api.createPlan({
        title: `${emoji} ${activityName}`,
        activity: activityName,
        scheduledAt,
        maxParticipants: 2,
        isPrivate: true,
        visibility: "FRIENDS",
        location: "TBD",
        inviteeId: currentThread?.isGroup ? undefined : id,
      });

      if (!plan?.id) {
        Alert.alert(
          "Could not create plan",
          "Invite accepted in chat, but plan creation failed. Try again."
        );
        updateMessageContent(
          messageId,
          `[INVITE:${activityName}:${emoji}:accepted]`,
          id,
          currentThread?.isGroup
        );
        return;
      }

      updateMessageContent(
        messageId,
        `[INVITE:${activityName}:${emoji}:accepted:${plan.id}]`,
        id,
        currentThread?.isGroup
      );
      triggerConfetti();
      await refreshPlans();
      Alert.alert("Plan ready!", `${activityName} plan created — check My Plans.`);
    } catch (err) {
      console.error("Invite accept failed:", err);
      Alert.alert("Error", "Could not create hangout plan. Try again.");
    }
  };

  const handlePickPhoto = async () => {
    if (!id || !token) return;
    const gate = getChatGate(id);
    if (gate && !gate.canSend) {
      Alert.alert("Chat locked", gate.reason || "Wait for their reply before sending photos.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Gallery access is required to send photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setShowAttachPanel(false);
    setUploadingPhoto(true);
    try {
      const uploaded = await api.uploadImage(result.assets[0].uri, token);
      if (!uploaded?.url) {
        Alert.alert("Upload failed", "Could not upload photo. Try again.");
        return;
      }
      const url = uploaded.url.startsWith("/")
        ? `${API_URL.replace("/api", "")}${uploaded.url}`
        : uploaded.url;
      const body = `[PHOTO:${url}]`;
      const payload = replyTo
        ? encodeReplyMessage(replyTo.id, formatChatPreview(replyTo.text), body)
        : body;
      setReplyTo(null);
      await sendMessage(id, payload);
    } catch (err) {
      console.error("Photo send failed:", err);
      Alert.alert("Error", "Could not send photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleMessageLongPress = (msg: ChatMessage) => {
    if (msg.text === "[DELETED]") return;
    const currentThread = id ? getConversation(id) : undefined;
    const buttons: {
      text: string;
      style?: "cancel" | "destructive" | "default";
      onPress?: () => void;
    }[] = [
      {
        text: "Reply",
        onPress: () => setReplyTo(msg),
      },
    ];
    if (msg.fromMe && !msg.id.startsWith("temp-")) {
      buttons.push({
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (!id) return;
          deleteMessage(msg.id, id, currentThread?.isGroup);
        },
      });
    }
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Message", undefined, buttons);
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => {
      const next = prev + emoji;
      handleTextChange(next);
      return next;
    });
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.text === "[DELETED]") {
      return (
        <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text style={[styles.bubbleTextThem, { fontStyle: "italic", color: T.faint }]}>
            Message deleted
          </Text>
        </View>
      );
    }

    const replyParsed = msg.replyToText
      ? { replyToText: msg.replyToText, body: msg.text.replace(/^\[REPLY:[^\]]+\]/, "") }
      : (() => {
          const m = msg.text.match(/^\[REPLY:([^|]+)\|([^\]]*)\]([\s\S]*)$/);
          if (!m) return null;
          return {
            replyToText: decodeURIComponent(m[2] || ""),
            body: m[3] || "",
          };
        })();

    const contentText = replyParsed ? replyParsed.body : msg.text;
    const replyPreview = replyParsed?.replyToText;

    const inviteRegex = /^\[INVITE:([^:]+):([^:]+):([^:\]]+)(?::([^\]]+))?\]$/;
    const matchInvite = contentText.match(inviteRegex);

    if (matchInvite) {
      const [, activityName, emoji, status, hangoutId] = matchInvite;

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            const matchProfile = matches.find((m) => m.id === id);
            openInviteModal({
              senderName: msg.fromMe ? (user?.name || "You") : (matchProfile?.name || "Friend"),
              senderAvatar: msg.fromMe
                ? (user?.avatar || undefined)
                : (matchProfile?.avatarUrl || undefined),
              category: activityName.toLowerCase(),
              location: "CHAYOS, GALLERIA",
              time: "6 PM TODAY",
            });
          }}
          style={styles.inviteCard}
        >
          {replyPreview ? (
            <Text style={styles.replyQuote} numberOfLines={1}>
              ↪ {replyPreview}
            </Text>
          ) : null}
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
            <View style={{ gap: 8 }}>
              <View style={styles.inviteStatusContainerAccepted}>
                <Ionicons name="checkmark-done-circle" size={16} color={T.green} />
                <Text style={styles.inviteStatusTextAccepted}>Proposal Accepted!</Text>
              </View>
              {hangoutId ? (
                <TouchableOpacity
                  style={[styles.inviteActionBtn, styles.inviteAcceptBtn]}
                  onPress={() =>
                    router.push({ pathname: "/plan-details", params: { id: hangoutId } })
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons name="calendar-outline" size={15} color="#fff" />
                  <Text style={styles.inviteActionBtnText}>Open plan</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.inviteStatusContainerDeclined}>
              <Ionicons name="close-circle" size={16} color={T.red} />
              <Text style={styles.inviteStatusTextDeclined}>Proposal Declined</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    const photoUrl = parsePhotoUrl(contentText);
    if (photoUrl) {
      return (
        <View style={styles.photoWrap}>
          {replyPreview ? (
            <Text style={[styles.replyQuote, { marginBottom: 6 }]} numberOfLines={1}>
              ↪ {replyPreview}
            </Text>
          ) : null}
          <Image source={{ uri: photoUrl }} style={styles.photoMsg} resizeMode="cover" />
        </View>
      );
    }

    if (contentText && contentText.includes("[VibeSplit]")) {
      const isSettlement = contentText.includes("settled");
      const cleanText = contentText.replace(/^[💳🤝]\s*\[VibeSplit\]\s*/, "");

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

    const displayBody = contentText;

    return msg.fromMe ? (
      <LinearGradient colors={[...T.bubbleGradMe]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubbleGrad}>
        {replyPreview ? (
          <Text style={styles.replyQuoteMe} numberOfLines={2}>
            ↪ {replyPreview}
          </Text>
        ) : null}
        <Text style={styles.bubbleTextMe}>{displayBody}</Text>
      </LinearGradient>
    ) : (
      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        {thread?.isGroup && msg.senderName ? (
          <Text style={[styles.senderNameLabel, { color: getMemberColor(msg.senderName) }]}>
            {msg.senderName}
          </Text>
        ) : null}
        {replyPreview ? (
          <Text style={styles.replyQuote} numberOfLines={2}>
            ↪ {replyPreview}
          </Text>
        ) : null}
        <Text style={styles.bubbleTextThem}>{displayBody}</Text>
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

  const handleSafetyMenu = () => {
    if (!id || thread?.isGroup) return;
    showSafetyMenu({
      userId: id,
      name: thread?.matchName || match?.name || "Friend",
      onUnmatch: handleUnmatch,
      alsoUnmatchOnBlock: async () => {
        await unmatch(id);
      },
      onDone: () => router.back(),
    });
  };

  const handleSend = async () => {
    if (!text.trim() || !id) return;
    if (!canSend) {
      Alert.alert("Chat locked", chatGate?.reason || "Wait for their reply.");
      return;
    }
    const msg = replyTo
      ? encodeReplyMessage(replyTo.id, formatChatPreview(replyTo.text), text.trim())
      : text;
    setText("");
    setReplyTo(null);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    sendTypingStatus(id, false);
    setShowEmojiPanel(false);

    await sendMessage(id, msg);
  };

  if (!thread) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safe}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={T.ink} />
          </Pressable>
          <Text style={styles.missing}>Chat not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={T.ink} />
          </Pressable>
          <Pressable style={styles.headerCenter} onPress={() => setShowDetailsModal(true)}>
            <LinearGradient colors={[...T.cta]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerAvatarRing}>
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
                    <Text style={[styles.headerStatus, { color: T.purple }]}>
                      {thread.members ? `${thread.members.length} members` : "Group chat"}
                    </Text>
                  </View>
                ) : (
                  <>
                    {thread.isOnline ? <PulseDot size={5} color="#22C55E" /> : null}
                    <Text style={styles.headerStatus}>
                      {thread.isOnline
                        ? "Online now"
                        : formatLastSeen(thread.lastSeenAt || match?.lastSeenAt)}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Pressable>
          <Pressable
            style={styles.moreBtn}
            onPress={() => (thread.isGroup ? setShowDetailsModal(true) : handleSafetyMenu())}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#22D3EE" />
          </Pressable>
        </View>

        {!thread.isGroup && !chatGate?.unlocked && (
          <View style={styles.matchBanner}>
            <View style={styles.matchBannerGrad}>
              <View style={styles.matchBannerIcon}>
                <Ionicons
                  name={chatGate?.waitingForOther ? "time" : "heart"}
                  size={13}
                  color="#070A14"
                />
              </View>
              <Text style={styles.matchBannerText}>
                {chatGate?.reason || "Send one hello to start the chat"}
              </Text>
            </View>
          </View>
        )}
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
          {!thread.isGroup && thread.messages.length === 0 && canSend ? (
            <View style={styles.iceWrap}>
              <Text style={styles.iceTitle}>Break the ice</Text>
              <Text style={styles.iceSub}>Tap a suggestion to send</Text>
              {ICEBREAKERS.map((line: string) => (
                <Pressable
                  key={line}
                  style={styles.iceChip}
                  onPress={async () => {
                    if (!id || !canSend) return;
                    await sendMessage(id, line);
                  }}
                >
                  <Text style={styles.iceChipText}>{line}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {thread.messages.map((msg, index) => {
            const prev = thread.messages[index - 1];
            const showDay = !prev || !sameCalendarDay(prev.sentAt, msg.sentAt);
            const isInvite = /\[INVITE:/.test(msg.text);
            const isPhoto = !!parsePhotoUrl(msg.text.replace(/^\[REPLY:[^\]]+\]/, ""));
            return (
              <View key={msg.id}>
                {showDay ? (
                  <View style={styles.daySep}>
                    <Text style={styles.daySepText}>{formatDayLabel(msg.sentAt)}</Text>
                  </View>
                ) : null}
                <Pressable
                  onLongPress={() => handleMessageLongPress(msg)}
                  delayLongPress={280}
                  style={[styles.bubbleWrap, msg.fromMe ? styles.bubbleWrapMe : styles.bubbleWrapThem]}
                >
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
                      isInvite || isPhoto
                        ? styles.bubbleInvite
                        : msg.fromMe
                          ? styles.bubbleMe
                          : styles.bubbleThem,
                    ]}
                  >
                    {renderMessageContent(msg)}
                  </View>
                  <View style={[styles.msgMeta, msg.fromMe && styles.msgMetaMe]}>
                    <Text style={[styles.msgTime, msg.fromMe && styles.msgTimeMe]}>
                      {formatMessageTime(msg.sentAt)}
                    </Text>
                    {msg.fromMe && !thread.isGroup ? (
                      <Ionicons
                        name={msg.isRead ? "checkmark-done" : "checkmark"}
                        size={14}
                        color={msg.isRead ? T.purple : T.faint}
                        style={{ marginLeft: 2 }}
                      />
                    ) : null}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        {/* Backdrop to dismiss floating menu */}
        {showAttachPanel && (
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowAttachPanel(false)}
          />
        )}

        {/* Floating Menu Popover (Split, Create Hangout, Photo) */}
        {showAttachPanel && (
          <Animated.View
            entering={FadeInDown.duration(180)}
            exiting={FadeOutDown.duration(150)}
            style={styles.floatingMenuCard}
          >
            <TouchableOpacity
              style={styles.floatingMenuItem}
              activeOpacity={0.8}
              onPress={() => {
                setShowAttachPanel(false);
                setShowSplitModal(true);
              }}
            >
              <LinearGradient
                colors={["#D4F72C", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.floatingMenuIconBg}
              >
                <Ionicons name="wallet" size={17} color="#070A14" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.floatingMenuTitle}>Split Bill 💳</Text>
                <Text style={styles.floatingMenuSub}>VibeSplit expense</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.floatingMenuDivider} />

            <TouchableOpacity
              style={styles.floatingMenuItem}
              activeOpacity={0.8}
              onPress={() => {
                setShowAttachPanel(false);
                toggleHangoutPanel();
              }}
            >
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.floatingMenuIconBg}
              >
                <Ionicons name="cafe" size={17} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.floatingMenuTitle}>Create Hangout ☕</Text>
                <Text style={styles.floatingMenuSub}>Propose quick plan</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.floatingMenuDivider} />

            <TouchableOpacity
              style={styles.floatingMenuItem}
              activeOpacity={0.8}
              disabled={uploadingPhoto || !canSend}
              onPress={() => {
                setShowAttachPanel(false);
                handlePickPhoto();
              }}
            >
              <LinearGradient
                colors={["#0EA5E9", "#0284C7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.floatingMenuIconBg}
              >
                <Ionicons name={uploadingPhoto ? "cloud-upload" : "image"} size={17} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.floatingMenuTitle}>{uploadingPhoto ? "Uploading…" : "Photo / Gallery 📷"}</Text>
                <Text style={styles.floatingMenuSub}>Send from gallery</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Floating Plus Button in Corner */}
        <TouchableOpacity
          style={styles.cornerFloatingFab}
          activeOpacity={0.85}
          onPress={toggleAttachPanel}
        >
          <LinearGradient
            colors={showAttachPanel ? ["#EF4444", "#DC2626"] : ["#D4F72C", "#22D3EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cornerFloatingFabGrad}
          >
            <Ionicons
              name={showAttachPanel ? "close" : "add"}
              size={24}
              color={showAttachPanel ? "#FFFFFF" : "#070A14"}
            />
          </LinearGradient>
        </TouchableOpacity>

        <SafeAreaView edges={["bottom"]} style={styles.inputBar}>
          {replyTo ? (
            <View style={styles.replyBar}>
              <View style={styles.replyBarAccent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.replyBarLabel}>Replying</Text>
                <Text style={styles.replyBarText} numberOfLines={1}>
                  {formatChatPreview(replyTo.text)}
                </Text>
              </View>
              <Pressable onPress={() => setReplyTo(null)} hitSlop={10}>
                <Ionicons name="close" size={18} color={T.muted} />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <Pressable style={styles.emojiToggleBtn} onPress={toggleEmojiPanel}>
              <Ionicons
                name={showEmojiPanel ? "keypad-outline" : "happy-outline"}
                size={23}
                color="#22D3EE"
              />
            </Pressable>

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
                <LinearGradient colors={["#D4F72C", "#22D3EE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtn}>
                  <Ionicons name="send" size={17} color="#070A14" />
                </LinearGradient>
              ) : (
                <View style={[styles.sendBtn, styles.sendBtnDisabled]}>
                  <Ionicons name="send" size={17} color="#64748B" />
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
          <GlassCard style={styles.modalCard}>
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
                    colors={["#D4F72C", "#22D3EE"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSplitGrad}
                  >
                    <View style={styles.modalSplitIconCircle}>
                      <Ionicons name="wallet" size={18} color="#070A14" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalSplitTitle}>VibeSplit — Split Bills 💳💸</Text>
                      <Text style={styles.modalSplitSub}>Add expenses & settle balances for this group</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#070A14" />
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
                ) : thread.members && thread.members.length > 0 ? (
                  <View style={styles.groupInfoBox}>
                    <Text style={styles.groupDesc} numberOfLines={3}>
                      Vibe group chat with your crew 👥
                    </Text>

                    <Text style={styles.membersTitle}>
                      Group Members ({thread.members.length})
                    </Text>

                    <ScrollView
                      style={styles.membersScroll}
                      contentContainerStyle={styles.membersScrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {thread.members.map((member) => (
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
                            {member.name} {member.id === user?.id ? "(You)" : ""}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.errorTextInline}>Group details</Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.modalConfirmBtn,
                    {
                      marginTop: 14,
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      borderColor: "rgba(239, 68, 68, 0.4)",
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "Leave Group",
                      "Are you sure you want to leave this group chat?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Leave",
                          style: "destructive",
                          onPress: async () => {
                            setShowDetailsModal(false);
                            await deleteCustomGroup(id);
                            router.back();
                          },
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalConfirmBtnText, { color: "#EF4444" }]}>
                    Leave Group 🚪
                  </Text>
                </TouchableOpacity>
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
  root: { flex: 1, backgroundColor: "#000000" },
  safe: { backgroundColor: "#000000" },
  flex: { flex: 1, backgroundColor: "#000000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.07)",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  headerAvatar: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 2,
    borderColor: "#0D1424",
  },
  headerName: {
    fontSize: 16,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  headerStatus: { fontSize: 11, fontFamily: VibeFonts.medium, color: "#22D3EE" },
  moreBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
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
    borderColor: "rgba(34, 211, 238, 0.2)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  matchBannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  matchBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: VibeFonts.semiBold,
    color: "#E2E8F0",
    lineHeight: 16,
  },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 84, gap: 14 },
  iceWrap: {
    marginBottom: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(13, 20, 36, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
    gap: 8,
  },
  iceTitle: {
    fontSize: 15,
    fontFamily: VibeFonts.bold,
    color: "#fff",
  },
  iceSub: {
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginBottom: 4,
  },
  iceChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  iceChipText: {
    fontSize: 13,
    fontFamily: VibeFonts.medium,
    color: "rgba(255, 255, 255, 0.9)",
  },
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
    borderColor: T.bg,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  bubble: { borderRadius: 22, overflow: "hidden", maxWidth: "100%" },
  bubbleMe: {
    borderBottomRightRadius: 4,
    borderRadius: 20,
    shadowColor: "#0284C7",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  bubbleThem: {
    backgroundColor: T.cardElevated,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
    color: "#F8FAFC",
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
  msgMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginLeft: 4,
  },
  msgMetaMe: {
    marginLeft: 0,
    marginRight: 4,
    alignSelf: "flex-end",
  },
  daySep: {
    alignItems: "center",
    marginVertical: 12,
  },
  daySepText: {
    fontSize: 11,
    fontFamily: VibeFonts.semiBold,
    color: T.muted,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  replyBarAccent: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: T.purple,
  },
  replyBarLabel: {
    fontSize: 11,
    fontFamily: VibeFonts.bold,
    color: T.purple,
  },
  replyBarText: {
    fontSize: 12,
    fontFamily: VibeFonts.regular,
    color: T.muted,
    marginTop: 1,
  },
  replyQuote: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: T.muted,
    marginBottom: 4,
    opacity: 0.9,
  },
  replyQuoteMe: {
    fontSize: 11,
    fontFamily: VibeFonts.medium,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
  },
  photoWrap: {
    padding: 4,
  },
  photoMsg: {
    width: Math.min(SCREEN_WIDTH * 0.62, 240),
    height: Math.min(SCREEN_WIDTH * 0.62, 240),
    borderRadius: 14,
    backgroundColor: T.cardElevated,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#000000",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: "#11141B",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: VibeFonts.medium,
    color: T.ink,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  inputDisabled: { opacity: 0.55 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D4F72C",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
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
    backgroundColor: "rgba(3, 5, 12, 0.75)",
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
    borderColor: "rgba(34, 211, 238, 0.3)",
  },
  modalContent: {
    width: "100%",
    alignItems: "center",
  },
  avatarGlowContainer: {
    shadowColor: "#22D3EE",
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
    borderColor: T.bg,
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
    borderColor: "rgba(34, 211, 238, 0.3)",
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
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emojiPanel: {
    height: 250,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#0A0D14",
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
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  hangoutPanel: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#0A0D14",
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
    backgroundColor: T.cardElevated,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
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
    backgroundColor: T.cardElevated,
    borderWidth: 1,
    borderColor: T.border,
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
    borderColor: "rgba(34, 211, 238, 0.3)",
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
    borderColor: "rgba(34, 211, 238, 0.25)",
    maxWidth: 280,
    gap: 8,
    shadowColor: "#22D3EE",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  vibeSplitCardExpense: {
    backgroundColor: T.cardElevated,
    borderColor: "rgba(34, 211, 238, 0.3)",
  },
  vibeSplitCardSettled: {
    backgroundColor: T.greenSoft,
    borderColor: "rgba(52, 211, 153, 0.3)",
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
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vibeSplitTapText: {
    fontSize: 10,
    fontFamily: VibeFonts.bold,
    color: T.purpleBright,
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
    color: "#070A14",
    fontFamily: VibeFonts.bold,
    fontSize: 11,
  },
  bannerSplitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
  },
  bannerSplitPillText: {
    fontSize: 10.5,
    fontFamily: VibeFonts.bold,
    color: "#22D3EE",
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
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.2)",
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
  cornerFloatingFab: {
    position: "absolute",
    right: 16,
    bottom: 74,
    zIndex: 20,
    shadowColor: "#22D3EE",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cornerFloatingFabGrad: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingMenuCard: {
    position: "absolute",
    right: 16,
    bottom: 132,
    width: 224,
    backgroundColor: "#0D1424",
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.3)",
    zIndex: 25,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    gap: 4,
  },
  floatingMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  floatingMenuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingMenuTitle: {
    fontSize: 13.5,
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
  },
  floatingMenuSub: {
    fontSize: 10.5,
    fontFamily: VibeFonts.medium,
    color: "#94A3B8",
    marginTop: 1,
  },
  floatingMenuDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    marginHorizontal: 4,
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
    color: "#070A14",
  },
  modalSplitSub: {
    fontSize: 10.5,
    fontFamily: VibeFonts.medium,
    color: "rgba(7, 10, 20, 0.75)",
    marginTop: 1,
  },
});

