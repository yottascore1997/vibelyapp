import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Star {
  id: number;
  top: number; // percentage
  left: number; // percentage
  size: number;
  opacity: number;
  color: string;
  char?: string;
  isSparkle?: boolean;
}

export default function StarrySkyBackground({ children }: { children?: React.ReactNode }) {
  // Rich starry night sky generator
  const stars = useMemo(() => {
    const list: Star[] = [];
    const colors = ["#FFFFFF", "#FFFFFF", "#E0E7FF", "#BAE6FD", "#FEF08A", "#F472B6"];
    const sparkles = ["✦", "✧", "★", "•", "✦"];

    let seed = 77;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const count = 110;
    for (let i = 0; i < count; i++) {
      const isSparkle = i % 10 === 0;
      list.push({
        id: i,
        top: random() * 100,
        left: random() * 100,
        size: isSparkle ? Math.floor(random() * 4) + 9 : Math.floor(random() * 3) + 1.5,
        opacity: Math.max(0.4, random() * 0.98),
        color: colors[Math.floor(random() * colors.length)],
        char: sparkles[Math.floor(random() * sparkles.length)],
        isSparkle,
      });
    }
    return list;
  }, []);

  return (
    <View style={styles.container}>
      {/* Rich Vibrant Midnight Navy Blue Sky Base Gradient */}
      <LinearGradient
        colors={["#0A1333", "#12204E", "#1B2C6C", "#0E1A45"]}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient Cosmic Radial Glows */}
      <LinearGradient
        colors={["rgba(99, 102, 241, 0.35)", "rgba(59, 130, 246, 0.2)", "transparent"]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.6 }}
        style={styles.topOrb}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(236, 72, 153, 0.22)", "rgba(139, 92, 246, 0.15)", "transparent"]}
        start={{ x: 0.9, y: 0.7 }}
        end={{ x: 0.1, y: 0.2 }}
        style={styles.bottomOrb}
        pointerEvents="none"
      />

      {/* Starry Night Sky Dots & Sparkling Stars (Filled Sky!) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {stars.map((star) => {
          if (star.isSparkle) {
            return (
              <Text
                key={star.id}
                style={[
                  styles.sparkleStar,
                  {
                    top: `${star.top}%`,
                    left: `${star.left}%`,
                    opacity: star.opacity,
                    color: star.color,
                    fontSize: star.size,
                  },
                ]}
              >
                {star.char}
              </Text>
            );
          }

          return (
            <View
              key={star.id}
              style={[
                styles.starDot,
                {
                  top: `${star.top}%`,
                  left: `${star.left}%`,
                  width: star.size,
                  height: star.size,
                  borderRadius: star.size / 2,
                  backgroundColor: star.color,
                  opacity: star.opacity,
                  shadowColor: star.color,
                  shadowRadius: star.size > 2.5 ? 5 : 0,
                  shadowOpacity: 0.9,
                },
              ]}
            />
          );
        })}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1333",
  },
  topOrb: {
    position: "absolute",
    top: -60,
    left: -40,
    width: SCREEN_WIDTH * 1.3,
    height: SCREEN_HEIGHT * 0.5,
  },
  bottomOrb: {
    position: "absolute",
    bottom: 0,
    right: -40,
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_HEIGHT * 0.55,
  },
  starDot: {
    position: "absolute",
  },
  sparkleStar: {
    position: "absolute",
    lineHeight: 12,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 6,
  },
});
