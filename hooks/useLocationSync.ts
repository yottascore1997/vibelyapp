import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { getCurrentUserLocation } from "../services/location";

const MIN_SYNC_MS = 5 * 60 * 1000; // refresh at most every 5 min

/**
 * Keeps the logged-in user's GPS on the server so Discover distance is real.
 */
export function useLocationSync() {
  const { token, user } = useAuth();
  const lastSync = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!token || !user?.onboardingDone) return;

    const sync = async () => {
      if (inFlight.current) return;
      const now = Date.now();
      if (now - lastSync.current < MIN_SYNC_MS) return;

      inFlight.current = true;
      try {
        const result = await getCurrentUserLocation({ highAccuracy: false });
        if (!result.ok) return;
        await api.updateLocation({
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          city: result.location.city,
        });
        lastSync.current = Date.now();
      } catch (e) {
        console.warn("Location sync failed:", e);
      } finally {
        inFlight.current = false;
      }
    };

    sync();

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") sync();
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => sub.remove();
  }, [token, user?.onboardingDone, user?.id]);
}
