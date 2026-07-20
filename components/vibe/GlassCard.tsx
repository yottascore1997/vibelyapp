import { View, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { VibeColors } from "../../constants/vibeTheme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  lightMode?: boolean;
}

export default function GlassCard({ children, style, intensity = 30, lightMode = false }: Props) {
  return (
    <View style={[
      styles.wrap,
      lightMode && { backgroundColor: "rgba(255,255,255,0.75)", borderColor: "rgba(138, 86, 255, 0.12)" },
      style
    ]}>
      <BlurView intensity={intensity} tint={lightMode ? "light" : "dark"} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={lightMode ? ["rgba(255,255,255,0.4)", "rgba(255,255,255,0.1)", "transparent"] : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)", "transparent"]}
        style={styles.shine}
      />
      <View style={[styles.border, lightMode && { borderColor: "rgba(255,255,255,0.4)" }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: VibeColors.bgGlass,
    borderWidth: 1,
    borderColor: VibeColors.bgGlassBorder,
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
});
