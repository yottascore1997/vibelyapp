import { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { height: SCREEN_H } = Dimensions.get("window");

/** Deterministic tiny star positions — no images / assets */
function buildStars(count: number) {
  const stars: { key: number; top: string; left: string; size: number; opacity: number }[] = [];
  let seed = 41;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      key: i,
      top: `${rand() * 92}%`,
      left: `${rand() * 96}%`,
      size: rand() > 0.82 ? 2 : 1,
      opacity: 0.08 + rand() * 0.14,
    });
  }
  return stars;
}

/**
 * Premium dark-navy cinematic hangout backdrop.
 * Gradients + soft orbs + low-opacity dots only — no images / SVG / canvas.
 */
export default function HangoutCinematicBackground() {
  const stars = useMemo(() => buildStars(42), []);

  return (
    <View
      pointerEvents="none"
      style={[styles.root, { minHeight: SCREEN_H }]}
    >
      {/* Base: top #171D33 → mid #0D1223 → bottom #070A14 */}
      <LinearGradient
        colors={["#171D33", "#0D1223", "#070A14"]}
        locations={[0, 0.48, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft purple wash — premium accent, not mono-green */}
      <LinearGradient
        colors={[
          "rgba(124, 58, 237, 0.1)",
          "rgba(167, 139, 250, 0.04)",
          "transparent",
        ]}
        locations={[0, 0.4, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 0.6 }}
        style={styles.glowUpperCenter}
      />

      {/* Soft blue ambient glow — upper center */}
      <LinearGradient
        colors={[
          "rgba(90, 120, 180, 0.12)",
          "rgba(55, 80, 140, 0.05)",
          "transparent",
        ]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.glowUpperCenter, { top: SCREEN_H * 0.02 }]}
      />

      {/* Subtle purple/blue edge glow — left */}
      <LinearGradient
        colors={[
          "rgba(70, 60, 120, 0.14)",
          "rgba(40, 55, 100, 0.05)",
          "transparent",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.glowLeft}
      />

      {/* Subtle purple/blue edge glow — right */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(40, 55, 100, 0.05)",
          "rgba(65, 55, 115, 0.12)",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.glowRight}
      />

      {/* Soft mid-depth navy wash (keeps look cinematic, not flat) */}
      <LinearGradient
        colors={["transparent", "rgba(7, 10, 20, 0.35)", "rgba(7, 10, 20, 0.55)"]}
        locations={[0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Tiny star-like particles */}
      <View style={StyleSheet.absoluteFill}>
        {stars.map((s) => (
          <View
            key={s.key}
            style={{
              position: "absolute",
              top: s.top as any,
              left: s.left as any,
              width: s.size,
              height: s.size,
              borderRadius: s.size,
              backgroundColor: "#C8D0E8",
              opacity: s.opacity,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: "hidden",
    backgroundColor: "#070A14",
  },
  glowUpperCenter: {
    position: "absolute",
    top: -SCREEN_H * 0.06,
    left: "8%",
    right: "8%",
    height: SCREEN_H * 0.42,
    borderRadius: SCREEN_H,
  },
  glowLeft: {
    position: "absolute",
    top: "18%",
    left: -40,
    width: 140,
    height: "55%",
    borderRadius: 80,
  },
  glowRight: {
    position: "absolute",
    top: "22%",
    right: -40,
    width: 140,
    height: "50%",
    borderRadius: 80,
  },
});
