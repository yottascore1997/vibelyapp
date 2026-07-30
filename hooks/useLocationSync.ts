import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { getCurrentUserLocation } from "../services/location";

const MIN_SYNC_MS = 5 * 60 * 1000;
const START_DELAY_MS = 2500;

/**
 * Keeps the logged-in user's GPS on the server so Discover distance is real.
 * Soft-fails — never blocks login / home.
 */
export function useLocationSync() {
  const { token, user } = useAuth();
  const lastSync = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!token || !user?.onboardingDone) return;

    const pushLocation = async (attempt = 1): Promise<boolean> => {
      const result = await getCurrentUserLocation({ highAccuracy: false });
      if (!result.ok) return false;
      try {
        await api.updateLocation({
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          city: result.location.city,
        });
        return true;
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500));
          return pushLocation(attempt + 1);
        }
        return false;
      }
    };

    const sync = async () => {
      if (inFlight.current) return;
      const now = Date.now();
      if (now - lastSync.current < MIN_SYNC_MS) return;

      inFlight.current = true;
      try {
        const ok = await pushLocation();
        if (ok) lastSync.current = Date.now();
      } catch {
        // ignore — location is best-effort
      } finally {
        inFlight.current = false;
      }
    };

    const boot = setTimeout(sync, START_DELAY_MS);

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") sync();
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => {
      clearTimeout(boot);
      sub.remove();
    };
  }, [token, user?.onboardingDone, user?.id]);
}
