import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  ImageBackground,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useFonts, Satisfy_400Regular } from "@expo-google-fonts/satisfy";
import { VibeFonts } from "../../constants/vibeTheme";

/**
 * Hero = Figma crop. Copy / CTA / footer = coded, device-stable.
 */

const { width: W, height: H } = Dimensions.get("window");

const FW = 402;
const FH = 874;
const STATUS = 48;
const COPY_START = 520;

/** Same scale on every device (width-locked, no topPad drift) */
const s = W / FW;
const fx = (n: number) => n * s;
const fy = (n: number) => (n - STATUS) * s;

const welcomeFull = require("../../assets/onboarding/welcome-full.png");
const loveFull = require("../../assets/onboarding/love-full.png");
const peopleFull = require("../../assets/onboarding/people-full.png");
const bgSpotlight = require("../../assets/onboarding/bg-spotlight.png");
const pinkBrush = require("../../assets/onboarding/pink-brush.png");

type OnboardKey = "love" | "people";
const ONBOARD: OnboardKey[] = ["love", "people"];

function TypingWord({
  text,
  active,
  fontSize = 34,
  msPerChar = 65,
  fontReady,
}: {
  text: string;
  active: boolean;
  fontSize?: number;
  msPerChar?: number;
  fontReady: boolean;
}) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!active || !fontReady) {
      setShown(active && fontReady ? "" : active ? text : "");
      return;
    }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, msPerChar);
    return () => clearInterval(id);
  }, [active, text, msPerChar, fontReady]);

  const display = fontReady ? (shown.length ? shown : " ") : text;
  const size = fx(fontSize);

  return (
    <ImageBackground
      source={pinkBrush}
      resizeMode="stretch"
      style={styles.scriptChip}
      imageStyle={styles.scriptBrushImg}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.scriptText,
          {
            fontSize: size,
            lineHeight: size * 1.4,
            fontFamily: fontReady ? "Satisfy_400Regular" : VibeFonts.extraBold,
            fontStyle: fontReady ? "normal" : "italic",
          },
        ]}
      >
        {display}
      </Text>
    </ImageBackground>
  );
}

function HeroShot({ source }: { source: number }) {
  const clipH = (COPY_START - STATUS) * s;
  return (
    <View style={[styles.frameClip, { height: clipH }]}>
      <Image
        source={source}
        style={{ width: W, height: FH * s, marginTop: -STATUS * s }}
        resizeMode="stretch"
      />
    </View>
  );
}

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.page}>
      <View style={styles.bgFill} />
      <Image source={bgSpotlight} style={styles.bgImage} resizeMode="cover" />
      {children}
    </View>
  );
}

function PageWelcome({
  onStart,
  fontReady,
  bottomPad,
}: {
  onStart: () => void;
  fontReady: boolean;
  bottomPad: number;
}) {
  return (
    <ScreenShell>
      <HeroShot source={welcomeFull} />

      <View style={[styles.bottomStack, { paddingBottom: bottomPad + fx(12) }]}>
        <View style={styles.copyBlockLeft}>
          <Text style={styles.h1Left}>Make Plans</Text>
          <View style={styles.rowNowrap}>
            <Text style={styles.h1Left}>Make </Text>
            <TypingWord text="Memories" active fontReady={fontReady} fontSize={34} />
          </View>
          <Text style={styles.subLeft}>
            Find your people, discover new experiences into real-life hangouts.
          </Text>
        </View>

        <Pressable
          onPress={onStart}
          style={styles.ctaPress}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <LinearGradient colors={["#93BEFF", "#0166FF"]} style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Get Started</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

function PageLove({ active, fontReady }: { active: boolean; fontReady: boolean }) {
  return (
    <ScreenShell>
      <HeroShot source={loveFull} />

      <View style={styles.copyBlockCenter}>
        <Text style={[styles.h1, styles.center]}>Everything You Love</Text>
        <View style={styles.rowNowrapCenter}>
          <Text style={styles.h1Soft}>all in </Text>
          <TypingWord text="One Place" active={active} fontReady={fontReady} fontSize={32} />
        </View>
        <Text style={[styles.sub, styles.center]}>
          Discover people, create plans{"\n"}Vibe together
        </Text>
      </View>
    </ScreenShell>
  );
}

function PagePeople({ active, fontReady }: { active: boolean; fontReady: boolean }) {
  return (
    <ScreenShell>
      <HeroShot source={peopleFull} />

      <View style={styles.copyBlockCenter}>
        <Text style={[styles.h1, styles.center]}>Your People, Your</Text>
        <View style={styles.rowNowrapCenter}>
          <Text style={styles.h1}>Vibe Your </Text>
          <TypingWord text="Hangout" active={active} fontReady={fontReady} fontSize={32} />
        </View>
        <Text style={[styles.sub, styles.center]}>
          Join a community that's always{"\n"}up to something fun
        </Text>
      </View>
    </ScreenShell>
  );
}

function OnboardFooter({
  index,
  onSkip,
  onNext,
  bottomPad,
}: {
  index: number;
  onSkip: () => void;
  onNext: () => void;
  bottomPad: number;
}) {
  const activeDot = index + 1;
  return (
    <View style={[styles.footerBar, { paddingBottom: Math.max(bottomPad, 16) }]}>
      <Pressable onPress={onSkip} hitSlop={12} style={styles.skipHit}>
        <Text style={styles.skip}>Skip</Text>
      </Pressable>
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === activeDot && styles.dotOn]} />
        ))}
      </View>
      <Pressable onPress={onNext} style={styles.nextHit} accessibilityLabel="Next">
        <View style={styles.nextRing}>
          <LinearGradient colors={["#93BEFF", "#0166FF"]} style={styles.nextInner}>
            <Ionicons name="chevron-forward" size={fx(22)} color="#fff" />
          </LinearGradient>
        </View>
      </Pressable>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [started, setStarted] = useState(false);
  const [onboardIndex, setOnboardIndex] = useState(0);
  const [fontReady] = useFonts({ Satisfy_400Regular });

  const goLogin = () => router.replace("/(auth)/login");

  const goNext = () => {
    if (onboardIndex >= ONBOARD.length - 1) {
      goLogin();
      return;
    }
    const next = onboardIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setOnboardIndex(next);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i !== onboardIndex) setOnboardIndex(i);
  };

  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {!started ? (
        <PageWelcome
          onStart={() => setStarted(true)}
          fontReady={!!fontReady}
          bottomPad={bottomPad}
        />
      ) : (
        <View style={styles.root}>
          <FlatList
            ref={listRef}
            style={styles.list}
            data={ONBOARD}
            horizontal
            pagingEnabled
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            keyExtractor={(k) => k}
            onMomentumScrollEnd={onScrollEnd}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            renderItem={({ item, index }) => (
              <View style={styles.slide}>
                {item === "love" ? (
                  <PageLove active={onboardIndex === index} fontReady={!!fontReady} />
                ) : (
                  <PagePeople active={onboardIndex === index} fontReady={!!fontReady} />
                )}
              </View>
            )}
          />
          <OnboardFooter
            index={onboardIndex}
            onSkip={goLogin}
            onNext={goNext}
            bottomPad={bottomPad}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#010103" },
  list: { flex: 1, backgroundColor: "transparent" },
  slide: { width: W, height: H, backgroundColor: "#010103" },
  page: { flex: 1, width: W, height: H, backgroundColor: "#010103" },
  bgFill: { ...StyleSheet.absoluteFillObject, backgroundColor: "#010103" },
  bgImage: { ...StyleSheet.absoluteFillObject, width: W, height: H, opacity: 0.85 },
  frameClip: {
    position: "absolute",
    top: 0,
    left: 0,
    width: W,
    overflow: "hidden",
    zIndex: 1,
  },

  bottomStack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: fx(15),
    zIndex: 40,
  },
  copyBlockLeft: {
    marginBottom: fx(18),
  },
  copyBlockCenter: {
    position: "absolute",
    left: fx(16),
    right: fx(16),
    top: fy(534),
    alignItems: "center",
    zIndex: 40,
  },

  rowNowrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  rowNowrapCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
    marginTop: fx(4),
    width: "100%",
  },
  center: { textAlign: "center" },

  h1: {
    fontSize: fx(30),
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: fx(0.5),
    lineHeight: fx(40),
  },
  h1Left: {
    fontSize: fx(32),
    fontFamily: VibeFonts.extraBold,
    color: "#FFFFFF",
    letterSpacing: fx(0.5),
    lineHeight: fx(42),
  },
  h1Soft: {
    fontSize: fx(28),
    fontFamily: VibeFonts.bold,
    color: "#FFFFFF",
    letterSpacing: fx(0.4),
    lineHeight: fx(40),
    flexShrink: 0,
  },
  sub: {
    marginTop: fx(16),
    fontSize: fx(15.5),
    fontFamily: VibeFonts.medium,
    color: "#FFFFFF",
    letterSpacing: fx(0.3),
    lineHeight: fx(21),
  },
  subLeft: {
    marginTop: fx(14),
    fontSize: fx(15.5),
    fontFamily: VibeFonts.medium,
    color: "#FFFFFF",
    letterSpacing: fx(0.3),
    lineHeight: fx(21),
    paddingRight: fx(8),
  },

  scriptChip: {
    flexShrink: 0,
    paddingLeft: fx(16),
    paddingRight: fx(22),
    paddingTop: fx(10),
    paddingBottom: fx(12),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    transform: [{ rotate: "-1.5deg" }],
  },
  scriptBrushImg: {
    resizeMode: "stretch",
  },
  scriptText: {
    color: "#FFFFFF",
    letterSpacing: fx(0.35),
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },

  ctaPress: {
    width: "100%",
    height: fx(54),
    borderRadius: fx(36),
    overflow: "hidden",
  },
  ctaBtn: {
    flex: 1,
    borderRadius: fx(36),
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: fx(20),
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
    letterSpacing: fx(0.4),
  },

  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: fx(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#010103",
    zIndex: 50,
  },
  skipHit: { minWidth: fx(56), paddingVertical: 8 },
  skip: {
    fontSize: fx(14.2),
    fontFamily: VibeFonts.semiBold,
    color: "#FFFFFF",
    letterSpacing: fx(0.42),
  },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: fx(8) },
  dot: {
    width: fx(10),
    height: fx(10),
    borderRadius: fx(5),
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  dotOn: { backgroundColor: "#0166FF" },
  nextHit: { width: fx(65), height: fx(65), alignItems: "center", justifyContent: "center" },
  nextRing: {
    width: fx(65),
    height: fx(65),
    borderRadius: fx(32.5),
    borderWidth: Math.max(1.5, fx(1.5)),
    borderColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextInner: {
    width: fx(48),
    height: fx(48),
    borderRadius: fx(24),
    alignItems: "center",
    justifyContent: "center",
  },
});
