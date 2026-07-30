import { View, StyleSheet } from "react-native";
import { Slot, usePathname } from "expo-router";
import TabBar from "../../components/TabBar";
import { useTabBarVisibility } from "../../context/TabBarVisibilityContext";

export default function TabsLayout() {
  const pathname = usePathname();
  const { hidden } = useTabBarVisibility();
  const lightChrome =
    pathname === "/" ||
    pathname === "/(tabs)" ||
    pathname.endsWith("/(tabs)/") ||
    pathname.includes("index") ||
    pathname.includes("profile") ||
    pathname.includes("hangout") ||
    pathname.includes("discover") ||
    pathname.includes("chats");

  return (
    <View style={[styles.container, lightChrome && styles.containerLight]}>
      <View style={[styles.content, lightChrome && styles.contentLight]}>
        <Slot />
      </View>
      {!hidden ? <TabBar dark={!lightChrome} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050508" },
  containerLight: { backgroundColor: "#EEE9F8" },
  content: { flex: 1, backgroundColor: "#050508" },
  contentLight: { backgroundColor: "#EEE9F8" },
});
