import * as Location from "expo-location";
import { Linking, Platform } from "react-native";

export type UserLocation = {
  latitude: number;
  longitude: number;
  city?: string;
  accuracy?: number | null;
};

export type LocationResult =
  | { ok: true; location: UserLocation }
  | { ok: false; reason: "denied" | "disabled" | "unavailable"; message: string };

export async function ensureLocationPermission(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return { granted: true, canAskAgain: true };

  const asked = await Location.requestForegroundPermissionsAsync();
  return {
    granted: asked.granted,
    canAskAgain: asked.canAskAgain !== false,
  };
}

async function resolveCity(latitude: number, longitude: number): Promise<string | undefined> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];
    if (!place) return undefined;
    return (
      place.city ||
      place.subregion ||
      place.district ||
      place.region ||
      undefined
    );
  } catch {
    return undefined;
  }
}

export async function getCurrentUserLocation(
  opts?: { highAccuracy?: boolean }
): Promise<LocationResult> {
  try {
    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) {
      return {
        ok: false,
        reason: "disabled",
        message: "Location services are turned off. Please enable GPS.",
      };
    }

    const { granted } = await ensureLocationPermission();
    if (!granted) {
      return {
        ok: false,
        reason: "denied",
        message: "Location permission is required to show people near you.",
      };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: opts?.highAccuracy
        ? Location.Accuracy.High
        : Location.Accuracy.Balanced,
    });

    const { latitude, longitude, accuracy } = pos.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        ok: false,
        reason: "unavailable",
        message: "Could not read your GPS coordinates.",
      };
    }

    const city = await resolveCity(latitude, longitude);
    return {
      ok: true,
      location: { latitude, longitude, city, accuracy },
    };
  } catch (e) {
    return {
      ok: false,
      reason: "unavailable",
      message: e instanceof Error ? e.message : "Failed to get location",
    };
  }
}

export function openAppLocationSettings() {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    Linking.openSettings();
  }
}

/** Rough distance in km (client-side preview). */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
