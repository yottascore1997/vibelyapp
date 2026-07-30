import { useEffect } from "react";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

/**
 * Hides Android system nav buttons (Back / Home / Recent).
 * Edge swipe can temporarily reveal them; they auto-hide again (sticky immersive).
 */
export function useImmersiveNavigationBar() {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    let alive = true;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const hide = async () => {
      try {
        // These may no-op when edge-to-edge is enabled — visibility still works.
        await NavigationBar.setPositionAsync("absolute").catch(() => undefined);
        await NavigationBar.setBehaviorAsync("overlay-swipe").catch(() => undefined);
        await NavigationBar.setVisibilityAsync("hidden");
      } catch {
        // Expo Go / unsupported devices — safe no-op
      }
    };

    hide();

    const sub = NavigationBar.addVisibilityListener(({ visibility }) => {
      if (!alive || visibility !== "visible") return;
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        hide();
      }, 2500);
    });

    return () => {
      alive = false;
      if (resetTimer) clearTimeout(resetTimer);
      sub?.remove?.();
    };
  }, []);
}
