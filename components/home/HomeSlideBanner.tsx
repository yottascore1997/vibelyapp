import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { VibeFonts } from "../../constants/vibeTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const SLIDE_W = SCREEN_W - 36;
const SLIDE_GAP = 12;

const SLIDE_BANNERS = [
  {
    id: "b1",
    tag: "DISCOVER",
    title: "Swipe & match nearby",
    subtitle: "Find people who match your vibe",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&h=420&fit=crop",
    emoji: "💫",
    route: "/(tabs)/discover",
    colors: ["rgba(124,58,237,0.15)", "rgba(88,28,135,0.88)"] as const,
  },
  {
    id: "b2",
    tag: "HANGOUT",
    title: "Plans happening near you",
    subtitle: "Coffee, movie, sports — join in minutes",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&h=420&fit=crop",
    emoji: "☕",
    route: "/hangout",
    colors: ["rgba(219,39,119,0.12)", "rgba(131,24,67,0.9)"] as const,
  },
  {
    id: "b3",
    tag: "SPOTS",
    title: "Drop a beacon & meet",
    subtitle: "Broadcast where you are right now",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=900&h=420&fit=crop",
    emoji: "📍",
    route: "/spot-broadcast",
    colors: ["rgba(14,165,233,0.12)", "rgba(15,23,42,0.88)"] as const,
  },
];

export default function HomeSlideBanner() {
  const router = useRouter();
  const [slideIndex, setSlideIndex] = useState(0);
  const slideRef = useRef<FlatList>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((prev) => {
        const next = (prev + 1) % SLIDE_BANNERS.length;
        slideRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3600);
    return () => clearInterval(id);
  }, []);

  const onSlideScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (SLIDE_W + SLIDE_GAP));
    if (idx >= 0 && idx < SLIDE_BANNERS.length) setSlideIndex(idx);
  }, []);

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={slideRef}
        data={SLIDE_BANNERS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_W + SLIDE_GAP}
        decelerationRate="fast"
        onScroll={onSlideScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push(item.route as any)}
            style={{
              width: SLIDE_W,
              marginRight: index < SLIDE_BANNERS.length - 1 ? SLIDE_GAP : 0,
            }}
          >
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <LinearGradient colors={[...item.colors]} style={styles.overlay}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{item.subtitle}</Text>
              </LinearGradient>
            </View>
          </Pressable>
        )}
      />
      <View style={styles.dots}>
        {SLIDE_BANNERS.map((b, i) => (
          <View key={b.id} style={[styles.dot, i === slideIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  card: {
    height: 132,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1E1B4B",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    padding: 14,
    justifyContent: "flex-end",
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(124,58,237,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  tagText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: 0.6,
  },
  emoji: {
    position: "absolute",
    top: 12,
    right: 14,
    fontSize: 32,
  },
  title: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: VibeFonts.extraBold,
    letterSpacing: -0.3,
  },
  sub: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontFamily: VibeFonts.medium,
    marginTop: 3,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DDD6FE",
  },
  dotActive: {
    width: 18,
    backgroundColor: "#8B5CF6",
  },
});
