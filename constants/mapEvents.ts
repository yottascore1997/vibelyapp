/** Multi-city Events Map — city-aware hangout pins (not people) */

import type { Plan } from "./plans";
import { PLAN_ACTIVITIES } from "./plans";

export type MapEventCategory =
  | "All"
  | "Coffee"
  | "Food"
  | "Movie"
  | "Sports"
  | "Chill"
  | "Music";

export type CityId =
  | "nagpur"
  | "mumbai"
  | "pune"
  | "delhi"
  | "bangalore"
  | "hyderabad";

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface MapDistrict {
  label: string;
  top: string;
  left: string;
}

export interface MapStreet {
  top: string;
  left: string;
  width: number | string;
  height: number | string;
  rotate: string;
}

export interface CityConfig {
  id: CityId;
  name: string;
  state: string;
  emoji: string;
  bounds: MapBounds;
  /** Approx user "you are here" on stylized canvas */
  youHere: { top: string; left: string };
  districts: MapDistrict[];
  streets: MapStreet[];
  gradient: readonly [string, string, string, string];
}

export interface MapEvent {
  id: string;
  cityId: CityId;
  title: string;
  category: MapEventCategory;
  emoji: string;
  location: string;
  timeLabel: string;
  goingCount: number;
  totalSlots: number;
  distanceKm: number;
  creatorName: string;
  imageUrl: string;
  description: string;
  latitude: number;
  longitude: number;
  pinColor: string;
  planId?: string;
  isLivePlan?: boolean;
  area?: string;
}

export const MAP_CATEGORIES: { key: MapEventCategory; label: string; emoji: string }[] = [
  { key: "All", label: "All", emoji: "✨" },
  { key: "Coffee", label: "Coffee", emoji: "☕" },
  { key: "Food", label: "Food", emoji: "🍕" },
  { key: "Movie", label: "Movie", emoji: "🎬" },
  { key: "Sports", label: "Sports", emoji: "⚽" },
  { key: "Chill", label: "Chill", emoji: "🌅" },
  { key: "Music", label: "Music", emoji: "🎤" },
];

const DEFAULT_STREETS: MapStreet[] = [
  { top: "18%", left: "0%", width: "100%", height: 2, rotate: "0deg" },
  { top: "34%", left: "0%", width: "100%", height: 2, rotate: "0deg" },
  { top: "52%", left: "0%", width: "100%", height: 3, rotate: "0deg" },
  { top: "68%", left: "0%", width: "100%", height: 2, rotate: "0deg" },
  { top: "82%", left: "0%", width: "100%", height: 2, rotate: "0deg" },
  { top: "0%", left: "22%", width: 2, height: "100%", rotate: "0deg" },
  { top: "0%", left: "48%", width: 3, height: "100%", rotate: "0deg" },
  { top: "0%", left: "72%", width: 2, height: "100%", rotate: "0deg" },
  { top: "40%", left: "-10%", width: "120%", height: 2, rotate: "12deg" },
  { top: "60%", left: "-10%", width: "120%", height: 2, rotate: "-8deg" },
];

export const CITIES: CityConfig[] = [
  {
    id: "nagpur",
    name: "Nagpur",
    state: "MH",
    emoji: "🟠",
    bounds: { minLat: 21.1, maxLat: 21.172, minLng: 79.04, maxLng: 79.1 },
    youHere: { top: "46%", left: "44%" },
    gradient: ["#E8F5E9", "#E3F2FD", "#EEE9F8", "#FCE4EC"],
    streets: DEFAULT_STREETS,
    districts: [
      { label: "Sitabuldi", top: "38%", left: "48%" },
      { label: "Civil Lines", top: "22%", left: "58%" },
      { label: "Dharampeth", top: "48%", left: "22%" },
      { label: "Futala", top: "14%", left: "12%" },
      { label: "Empress City", top: "72%", left: "52%" },
    ],
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "MH",
    emoji: "🌊",
    bounds: { minLat: 18.9, maxLat: 19.22, minLng: 72.77, maxLng: 72.98 },
    youHere: { top: "52%", left: "48%" },
    gradient: ["#E0F2FE", "#DBEAFE", "#EEF2FF", "#FCE7F3"],
    streets: DEFAULT_STREETS,
    districts: [
      { label: "Bandra", top: "28%", left: "42%" },
      { label: "Andheri", top: "18%", left: "55%" },
      { label: "Powai", top: "22%", left: "72%" },
      { label: "BKC", top: "38%", left: "48%" },
      { label: "Colaba", top: "78%", left: "52%" },
      { label: "Dadar", top: "48%", left: "40%" },
      { label: "Juhu", top: "24%", left: "28%" },
    ],
  },
  {
    id: "pune",
    name: "Pune",
    state: "MH",
    emoji: "🎓",
    bounds: { minLat: 18.45, maxLat: 18.62, minLng: 73.75, maxLng: 73.95 },
    youHere: { top: "48%", left: "50%" },
    gradient: ["#FEF3C7", "#FFEDD5", "#EEE9F8", "#E0E7FF"],
    streets: DEFAULT_STREETS,
    districts: [
      { label: "Koregaon Park", top: "35%", left: "62%" },
      { label: "FC Road", top: "48%", left: "42%" },
      { label: "Baner", top: "22%", left: "28%" },
      { label: "Hinjewadi", top: "18%", left: "12%" },
      { label: "Viman Nagar", top: "28%", left: "78%" },
    ],
  },
  {
    id: "delhi",
    name: "Delhi",
    state: "DL",
    emoji: "🏛️",
    bounds: { minLat: 28.48, maxLat: 28.72, minLng: 77.1, maxLng: 77.3 },
    youHere: { top: "45%", left: "50%" },
    gradient: ["#FEE2E2", "#FFEDD5", "#EEE9F8", "#E0E7FF"],
    streets: DEFAULT_STREETS,
    districts: [
      { label: "CP", top: "42%", left: "52%" },
      { label: "Hauz Khas", top: "58%", left: "45%" },
      { label: "Saket", top: "72%", left: "48%" },
      { label: "Dwarka", top: "68%", left: "18%" },
      { label: "Nehru Place", top: "62%", left: "68%" },
    ],
  },
  {
    id: "bangalore",
    name: "Bangalore",
    state: "KA",
    emoji: "🌳",
    bounds: { minLat: 12.9, maxLat: 13.08, minLng: 77.55, maxLng: 77.75 },
    youHere: { top: "50%", left: "48%" },
    gradient: ["#DCFCE7", "#E0F2FE", "#EEE9F8", "#FEF3C7"],
    streets: DEFAULT_STREETS,
    districts: [
      { label: "Koramangala", top: "55%", left: "58%" },
      { label: "Indiranagar", top: "42%", left: "62%" },
      { label: "MG Road", top: "48%", left: "48%" },
      { label: "Whitefield", top: "38%", left: "82%" },
      { label: "Jayanagar", top: "68%", left: "45%" },
    ],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "TS",
    emoji: "💎",
    bounds: { minLat: 17.35, maxLat: 17.5, minLng: 78.35, maxLng: 78.55 },
    youHere: { top: "48%", left: "46%" },
    gradient: ["#FCE7F3", "#EDE9FE", "#EEE9F8", "#DBEAFE"],
    streets: DEFAULT_STREETS,
    districts: [
      { label: "Hitech City", top: "35%", left: "28%" },
      { label: "Gachibowli", top: "42%", left: "22%" },
      { label: "Banjara Hills", top: "48%", left: "48%" },
      { label: "Jubilee Hills", top: "40%", left: "42%" },
      { label: "Madhapur", top: "32%", left: "35%" },
    ],
  },
];

export const CITY_BY_ID = Object.fromEntries(CITIES.map((c) => [c.id, c])) as Record<
  CityId,
  CityConfig
>;

/** Venue keywords → coords inside each city */
const VENUE_COORDS: Record<CityId, { match: string; lat: number; lng: number; area: string }[]> = {
  nagpur: [
    { match: "sitabuldi", lat: 21.1492, lng: 79.0888, area: "Sitabuldi" },
    { match: "civil", lat: 21.1548, lng: 79.0782, area: "Civil Lines" },
    { match: "dharampeth", lat: 21.1412, lng: 79.0618, area: "Dharampeth" },
    { match: "futala", lat: 21.1618, lng: 79.0455, area: "Futala" },
    { match: "empress", lat: 21.1268, lng: 79.0822, area: "Empress City" },
    { match: "pvr", lat: 21.1285, lng: 79.0795, area: "Empress Mall" },
    { match: "vca", lat: 21.1095, lng: 79.0688, area: "VCA" },
    { match: "haldiram", lat: 21.1478, lng: 79.0912, area: "Sitabuldi" },
    { match: "tryst", lat: 21.1548, lng: 79.0782, area: "Civil Lines" },
  ],
  mumbai: [
    { match: "bandra", lat: 19.0596, lng: 72.8295, area: "Bandra" },
    { match: "andheri", lat: 19.1136, lng: 72.8697, area: "Andheri" },
    { match: "powai", lat: 19.1197, lng: 72.905, area: "Powai" },
    { match: "bkc", lat: 19.066, lng: 72.8697, area: "BKC" },
    { match: "colaba", lat: 18.9067, lng: 72.8147, area: "Colaba" },
    { match: "juhu", lat: 19.1075, lng: 72.8263, area: "Juhu" },
    { match: "dadar", lat: 19.0178, lng: 72.8478, area: "Dadar" },
    { match: "worli", lat: 19.0, lng: 72.816, area: "Worli" },
    { match: "linking", lat: 19.055, lng: 72.833, area: "Bandra" },
    { match: "phoenix", lat: 19.086, lng: 72.889, area: "Kurla" },
  ],
  pune: [
    { match: "koregaon", lat: 18.5362, lng: 73.8937, area: "Koregaon Park" },
    { match: "fc road", lat: 18.52, lng: 73.84, area: "FC Road" },
    { match: "baner", lat: 18.559, lng: 73.7868, area: "Baner" },
    { match: "hinjewadi", lat: 18.5912, lng: 73.7389, area: "Hinjewadi" },
    { match: "viman", lat: 18.5679, lng: 73.9143, area: "Viman Nagar" },
    { match: "kothrud", lat: 18.5074, lng: 73.8077, area: "Kothrud" },
  ],
  delhi: [
    { match: "connaught", lat: 28.6315, lng: 77.2167, area: "CP" },
    { match: "cp", lat: 28.6315, lng: 77.2167, area: "CP" },
    { match: "hauz", lat: 28.5494, lng: 77.2001, area: "Hauz Khas" },
    { match: "saket", lat: 28.5244, lng: 77.2066, area: "Saket" },
    { match: "dwarka", lat: 28.5921, lng: 77.046, area: "Dwarka" },
    { match: "nehru", lat: 28.5492, lng: 77.2507, area: "Nehru Place" },
    { match: "khan", lat: 28.6002, lng: 77.227, area: "Khan Market" },
  ],
  bangalore: [
    { match: "koramangala", lat: 12.9352, lng: 77.6245, area: "Koramangala" },
    { match: "indiranagar", lat: 12.9784, lng: 77.6408, area: "Indiranagar" },
    { match: "mg road", lat: 12.975, lng: 77.6063, area: "MG Road" },
    { match: "whitefield", lat: 12.9698, lng: 77.75, area: "Whitefield" },
    { match: "jayanagar", lat: 12.9308, lng: 77.5838, area: "Jayanagar" },
    { match: "ubl", lat: 12.9716, lng: 77.5946, area: "Cubbon" },
  ],
  hyderabad: [
    { match: "hitech", lat: 17.4435, lng: 78.3772, area: "Hitech City" },
    { match: "gachibowli", lat: 17.4401, lng: 78.3489, area: "Gachibowli" },
    { match: "banjara", lat: 17.4156, lng: 78.4347, area: "Banjara Hills" },
    { match: "jubilee", lat: 17.4326, lng: 78.4071, area: "Jubilee Hills" },
    { match: "madhapur", lat: 17.4483, lng: 78.3915, area: "Madhapur" },
  ],
};

const CITY_ALIASES: { id: CityId; keys: string[] }[] = [
  { id: "nagpur", keys: ["nagpur", "nagpur city", "orange city"] },
  { id: "mumbai", keys: ["mumbai", "bombay", "bom", "thane", "navi mumbai"] },
  { id: "pune", keys: ["pune", "poona", "pimpri"] },
  { id: "delhi", keys: ["delhi", "new delhi", "ncr", "gurgaon", "gurugram", "noida"] },
  { id: "bangalore", keys: ["bangalore", "bengaluru", "blr"] },
  { id: "hyderabad", keys: ["hyderabad", "hyd", "secunderabad"] },
];

export function resolveCityId(input?: string | null): CityId | null {
  if (!input) return null;
  const q = input.toLowerCase().trim();
  for (const city of CITY_ALIASES) {
    if (city.keys.some((k) => q.includes(k))) return city.id;
  }
  // Also match area names back to city
  for (const [cityId, venues] of Object.entries(VENUE_COORDS) as [CityId, (typeof VENUE_COORDS)[CityId]][]) {
    if (venues.some((v) => q.includes(v.match) || q.includes(v.area.toLowerCase()))) {
      return cityId;
    }
  }
  return null;
}

export function getCityCenter(cityId: CityId) {
  const b = CITY_BY_ID[cityId].bounds;
  return {
    latitude: (b.minLat + b.maxLat) / 2,
    longitude: (b.minLng + b.maxLng) / 2,
  };
}

export function getCityZoom(cityId: CityId) {
  // City-level zoom — pinch to zoom in/out like Bumpy
  const zooms: Record<CityId, number> = {
    nagpur: 12,
    mumbai: 11.5,
    pune: 12,
    delhi: 11.5,
    bangalore: 12,
    hyderabad: 12,
  };
  return zooms[cityId] ?? 12;
}

export interface MapPerson {
  id: string;
  cityId: CityId;
  name: string;
  age: number;
  avatarUrl: string;
  latitude: number;
  longitude: number;
  isVerified?: boolean;
  isOnline?: boolean;
  vibeTag?: string;
  distanceKm: number;
}

/** People scattered across city areas (Bumpy-style map faces) */
export const CITY_MAP_PEOPLE: MapPerson[] = [
  // Nagpur
  { id: "p-ng-1", cityId: "nagpur", name: "Riya", age: 24, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", latitude: 21.1492, longitude: 79.0888, isVerified: true, isOnline: true, vibeTag: "Coffee", distanceKm: 1.1 },
  { id: "p-ng-2", cityId: "nagpur", name: "Aman", age: 26, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", latitude: 21.1412, longitude: 79.0618, isOnline: true, vibeTag: "Sports", distanceKm: 2.0 },
  { id: "p-ng-3", cityId: "nagpur", name: "Sneha", age: 23, avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop", latitude: 21.1548, longitude: 79.0782, isVerified: true, vibeTag: "Chill", distanceKm: 1.6 },
  { id: "p-ng-4", cityId: "nagpur", name: "Karan", age: 27, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", latitude: 21.1268, longitude: 79.0822, isOnline: true, vibeTag: "Movie", distanceKm: 3.5 },
  { id: "p-ng-5", cityId: "nagpur", name: "Meera", age: 25, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", latitude: 21.1618, longitude: 79.0455, isVerified: true, isOnline: true, vibeTag: "Walk", distanceKm: 4.8 },
  // Mumbai
  { id: "p-mb-1", cityId: "mumbai", name: "Ananya", age: 24, avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop", latitude: 19.0596, longitude: 72.8295, isVerified: true, isOnline: true, vibeTag: "Bandra", distanceKm: 2.2 },
  { id: "p-mb-2", cityId: "mumbai", name: "Dev", age: 28, avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop", latitude: 19.1197, longitude: 72.905, isOnline: true, vibeTag: "Powai", distanceKm: 4.0 },
  { id: "p-mb-3", cityId: "mumbai", name: "Sara", age: 22, avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop", latitude: 19.1136, longitude: 72.8697, isVerified: true, vibeTag: "Andheri", distanceKm: 3.1 },
  { id: "p-mb-4", cityId: "mumbai", name: "Arjun", age: 27, avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop", latitude: 19.1075, longitude: 72.8263, isOnline: true, vibeTag: "Juhu", distanceKm: 5.2 },
  { id: "p-mb-5", cityId: "mumbai", name: "Neha", age: 25, avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop", latitude: 19.066, longitude: 72.8697, isVerified: true, isOnline: true, vibeTag: "BKC", distanceKm: 2.7 },
  { id: "p-mb-6", cityId: "mumbai", name: "Ishaan", age: 26, avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop", latitude: 18.9067, longitude: 72.8147, vibeTag: "Colaba", distanceKm: 8.0 },
  // Pune
  { id: "p-pn-1", cityId: "pune", name: "Aditi", age: 23, avatarUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop", latitude: 18.5362, longitude: 73.8937, isVerified: true, isOnline: true, vibeTag: "KP", distanceKm: 1.7 },
  { id: "p-pn-2", cityId: "pune", name: "Rahul", age: 29, avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop", latitude: 18.559, longitude: 73.7868, isOnline: true, vibeTag: "Baner", distanceKm: 3.4 },
  { id: "p-pn-3", cityId: "pune", name: "Sneha", age: 24, avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop", latitude: 18.52, longitude: 73.84, isVerified: true, vibeTag: "FC Road", distanceKm: 1.9 },
  // Delhi
  { id: "p-dl-1", cityId: "delhi", name: "Kabir", age: 27, avatarUrl: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop", latitude: 28.5494, longitude: 77.2001, isVerified: true, isOnline: true, vibeTag: "HK", distanceKm: 3.0 },
  { id: "p-dl-2", cityId: "delhi", name: "Pooja", age: 24, avatarUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop", latitude: 28.6315, longitude: 77.2167, isOnline: true, vibeTag: "CP", distanceKm: 1.4 },
  { id: "p-dl-3", cityId: "delhi", name: "Vihaan", age: 26, avatarUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop", latitude: 28.5244, longitude: 77.2066, isVerified: true, vibeTag: "Saket", distanceKm: 4.6 },
  // Bangalore
  { id: "p-bl-1", cityId: "bangalore", name: "Nisha", age: 25, avatarUrl: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop", latitude: 12.9352, longitude: 77.6245, isVerified: true, isOnline: true, vibeTag: "Koramangala", distanceKm: 2.1 },
  { id: "p-bl-2", cityId: "bangalore", name: "Rohan", age: 28, avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop", latitude: 12.9784, longitude: 77.6408, isOnline: true, vibeTag: "Indiranagar", distanceKm: 2.9 },
  { id: "p-bl-3", cityId: "bangalore", name: "Aisha", age: 23, avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop", latitude: 12.975, longitude: 77.6063, isVerified: true, vibeTag: "MG Road", distanceKm: 1.3 },
  // Hyderabad
  { id: "p-hy-1", cityId: "hyderabad", name: "Varun", age: 27, avatarUrl: "https://images.unsplash.com/photo-1504257432389-52343af06d22?w=200&h=200&fit=crop", latitude: 17.4435, longitude: 78.3772, isVerified: true, isOnline: true, vibeTag: "Hitech", distanceKm: 2.5 },
  { id: "p-hy-2", cityId: "hyderabad", name: "Fatima", age: 24, avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop", latitude: 17.4156, longitude: 78.4347, isOnline: true, vibeTag: "Banjara", distanceKm: 3.2 },
  { id: "p-hy-3", cityId: "hyderabad", name: "Sidd", age: 26, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", latitude: 17.4401, longitude: 78.3489, isVerified: true, vibeTag: "Gachibowli", distanceKm: 3.9 },
];

export function getPeopleForCity(cityId: CityId) {
  return CITY_MAP_PEOPLE.filter((p) => p.cityId === cityId);
}

export function toMapPos(cityId: CityId, lat: number, lng: number) {
  const b = CITY_BY_ID[cityId].bounds;
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * 100;
  const y = ((b.maxLat - lat) / (b.maxLat - b.minLat)) * 100;
  return {
    left: `${Math.min(92, Math.max(6, x))}%`,
    top: `${Math.min(88, Math.max(10, y))}%`,
  };
}

export function geocodeInCity(
  cityId: CityId,
  location?: string | null
): { lat: number; lng: number; area: string } {
  const center = getCityCenter(cityId);
  if (!location) {
    return { lat: center.latitude, lng: center.longitude, area: CITY_BY_ID[cityId].name };
  }
  const q = location.toLowerCase();
  const hit = VENUE_COORDS[cityId].find((v) => q.includes(v.match));
  if (hit) return { lat: hit.lat, lng: hit.lng, area: hit.area };

  // Slight jitter so unknown venues don't stack on center
  const hash = Array.from(q).reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitterLat = ((hash % 17) - 8) * 0.002;
  const jitterLng = ((hash % 13) - 6) * 0.002;
  return {
    lat: center.latitude + jitterLat,
    lng: center.longitude + jitterLng,
    area: CITY_BY_ID[cityId].name,
  };
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 10) / 10;
}

function activityToCategory(activity?: string | null, title?: string): MapEventCategory {
  const t = `${activity || ""} ${title || ""}`.toLowerCase();
  if (t.includes("coffee") || t.includes("cafe")) return "Coffee";
  if (t.includes("movie") || t.includes("film") || t.includes("cinema")) return "Movie";
  if (t.includes("sport") || t.includes("cricket") || t.includes("football") || t.includes("badminton"))
    return "Sports";
  if (t.includes("music") || t.includes("mic") || t.includes("concert")) return "Music";
  if (t.includes("food") || t.includes("biryani") || t.includes("pizza") || t.includes("dinner") || t.includes("lunch"))
    return "Food";
  if (t.includes("chill") || t.includes("walk") || t.includes("rooftop") || t.includes("sunset")) return "Chill";
  return "Chill";
}

function categoryMeta(cat: MapEventCategory) {
  const map: Record<Exclude<MapEventCategory, "All">, { emoji: string; color: string }> = {
    Coffee: { emoji: "☕", color: "#F97316" },
    Food: { emoji: "🍕", color: "#EF4444" },
    Movie: { emoji: "🎬", color: "#8B5CF6" },
    Sports: { emoji: "⚽", color: "#22C55E" },
    Chill: { emoji: "🌅", color: "#EC4899" },
    Music: { emoji: "🎤", color: "#A855F7" },
  };
  return map[cat === "All" ? "Chill" : cat];
}

/** Seeded demo hangouts per city */
export const CITY_MAP_EVENTS: MapEvent[] = [
  // —— Nagpur ——
  {
    id: "ng-1",
    cityId: "nagpur",
    title: "Coffee & Chill",
    category: "Coffee",
    emoji: "☕",
    location: "Cafe Coffee Day, Sitabuldi",
    timeLabel: "Today, 4:30 PM",
    goingCount: 6,
    totalSlots: 8,
    distanceKm: 1.2,
    creatorName: "Riya",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=320&fit=crop",
    description: "Grab coffee and good conversations downtown.",
    latitude: 21.1492,
    longitude: 79.0888,
    pinColor: "#F97316",
    area: "Sitabuldi",
  },
  {
    id: "ng-2",
    cityId: "nagpur",
    title: "Night Football",
    category: "Sports",
    emoji: "⚽",
    location: "Dharampeth Ground",
    timeLabel: "Today, 8:30 PM",
    goingCount: 18,
    totalSlots: 22,
    distanceKm: 2.1,
    creatorName: "Karan",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&h=320&fit=crop",
    description: "Friendly match — all skill levels welcome.",
    latitude: 21.1412,
    longitude: 79.0618,
    pinColor: "#22C55E",
    area: "Dharampeth",
  },
  {
    id: "ng-3",
    cityId: "nagpur",
    title: "Rooftop Sunset",
    category: "Chill",
    emoji: "🌅",
    location: "Empress City Rooftop",
    timeLabel: "Today, 6:00 PM",
    goingCount: 12,
    totalSlots: 20,
    distanceKm: 3.8,
    creatorName: "Rohan",
    imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&h=320&fit=crop",
    description: "Music, chill vibes & golden hour views.",
    latitude: 21.1268,
    longitude: 79.0822,
    pinColor: "#EC4899",
    area: "Empress City",
  },
  {
    id: "ng-4",
    cityId: "nagpur",
    title: "Movie Night",
    category: "Movie",
    emoji: "🎬",
    location: "PVR Cinemas, Empress Mall",
    timeLabel: "Tonight, 7:00 PM",
    goingCount: 4,
    totalSlots: 10,
    distanceKm: 3.4,
    creatorName: "Aman",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=320&fit=crop",
    description: "Latest blockbuster — seats filling fast.",
    latitude: 21.1285,
    longitude: 79.0795,
    pinColor: "#8B5CF6",
    area: "Empress Mall",
  },
  {
    id: "ng-5",
    cityId: "nagpur",
    title: "Lake Walk Chill",
    category: "Chill",
    emoji: "🚶",
    location: "Futala Lake",
    timeLabel: "Today, 5:30 PM",
    goingCount: 11,
    totalSlots: 16,
    distanceKm: 5.1,
    creatorName: "Meera",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=320&fit=crop",
    description: "Evening stroll, snacks & sunset photos.",
    latitude: 21.1618,
    longitude: 79.0455,
    pinColor: "#EC4899",
    area: "Futala",
  },

  // —— Mumbai ——
  {
    id: "mb-1",
    cityId: "mumbai",
    title: "Bandra Cafe Hop",
    category: "Coffee",
    emoji: "☕",
    location: "Linking Road, Bandra West",
    timeLabel: "Today, 5:00 PM",
    goingCount: 8,
    totalSlots: 12,
    distanceKm: 2.4,
    creatorName: "Ananya",
    imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&h=320&fit=crop",
    description: "Cafe crawl across Bandra — good music & chai.",
    latitude: 19.055,
    longitude: 72.833,
    pinColor: "#F97316",
    area: "Bandra",
  },
  {
    id: "mb-2",
    cityId: "mumbai",
    title: "Powai Lake Walk",
    category: "Chill",
    emoji: "🌅",
    location: "Powai Lake Promenade",
    timeLabel: "Today, 6:30 PM",
    goingCount: 14,
    totalSlots: 20,
    distanceKm: 4.1,
    creatorName: "Dev",
    imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&h=320&fit=crop",
    description: "Sunset walk + soft drinks by the lake.",
    latitude: 19.1197,
    longitude: 72.905,
    pinColor: "#EC4899",
    area: "Powai",
  },
  {
    id: "mb-3",
    cityId: "mumbai",
    title: "Andheri Movie Night",
    category: "Movie",
    emoji: "🎬",
    location: "PVR Phoenix, Andheri",
    timeLabel: "Tonight, 8:00 PM",
    goingCount: 6,
    totalSlots: 10,
    distanceKm: 3.2,
    creatorName: "Sara",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=320&fit=crop",
    description: "Blockbuster + post-movie dessert run.",
    latitude: 19.1136,
    longitude: 72.8697,
    pinColor: "#8B5CF6",
    area: "Andheri",
  },
  {
    id: "mb-4",
    cityId: "mumbai",
    title: "Juhu Beach Football",
    category: "Sports",
    emoji: "⚽",
    location: "Juhu Beach",
    timeLabel: "Tomorrow, 7:00 AM",
    goingCount: 10,
    totalSlots: 16,
    distanceKm: 5.5,
    creatorName: "Arjun",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&h=320&fit=crop",
    description: "Morning beach football — bring energy!",
    latitude: 19.1075,
    longitude: 72.8263,
    pinColor: "#22C55E",
    area: "Juhu",
  },
  {
    id: "mb-5",
    cityId: "mumbai",
    title: "BKC Food Trail",
    category: "Food",
    emoji: "🍕",
    location: "Bandra Kurla Complex",
    timeLabel: "Today, 1:00 PM",
    goingCount: 7,
    totalSlots: 10,
    distanceKm: 2.8,
    creatorName: "Neha",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=320&fit=crop",
    description: "Office-break food crawl around BKC.",
    latitude: 19.066,
    longitude: 72.8697,
    pinColor: "#EF4444",
    area: "BKC",
  },
  {
    id: "mb-6",
    cityId: "mumbai",
    title: "Colaba Open Mic",
    category: "Music",
    emoji: "🎤",
    location: "Colaba Causeway Cafe",
    timeLabel: "Sat, 8:00 PM",
    goingCount: 16,
    totalSlots: 30,
    distanceKm: 8.2,
    creatorName: "Ishaan",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=320&fit=crop",
    description: "Poetry, indie sets & South Bombay vibes.",
    latitude: 18.9067,
    longitude: 72.8147,
    pinColor: "#A855F7",
    area: "Colaba",
  },

  // —— Pune ——
  {
    id: "pn-1",
    cityId: "pune",
    title: "KP Coffee Meetup",
    category: "Coffee",
    emoji: "☕",
    location: "Koregaon Park Cafe Street",
    timeLabel: "Today, 4:00 PM",
    goingCount: 9,
    totalSlots: 12,
    distanceKm: 1.8,
    creatorName: "Aditi",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=320&fit=crop",
    description: "Student + startup coffee hangout in KP.",
    latitude: 18.5362,
    longitude: 73.8937,
    pinColor: "#F97316",
    area: "Koregaon Park",
  },
  {
    id: "pn-2",
    cityId: "pune",
    title: "Baner Cycling Squad",
    category: "Sports",
    emoji: "🚴",
    location: "Baner Hill Base",
    timeLabel: "Tomorrow, 6:30 AM",
    goingCount: 11,
    totalSlots: 15,
    distanceKm: 3.5,
    creatorName: "Rahul",
    imageUrl: "https://images.unsplash.com/photo-1531415075278-85f41f894b20?w=500&h=320&fit=crop",
    description: "Sunrise ride — intermediate pace.",
    latitude: 18.559,
    longitude: 73.7868,
    pinColor: "#22C55E",
    area: "Baner",
  },
  {
    id: "pn-3",
    cityId: "pune",
    title: "FC Road Food Night",
    category: "Food",
    emoji: "🍛",
    location: "FC Road",
    timeLabel: "Tonight, 8:30 PM",
    goingCount: 13,
    totalSlots: 18,
    distanceKm: 2.0,
    creatorName: "Sneha",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=320&fit=crop",
    description: "Misal, pizza & late-night chaos on FC.",
    latitude: 18.52,
    longitude: 73.84,
    pinColor: "#EF4444",
    area: "FC Road",
  },

  // —— Delhi ——
  {
    id: "dl-1",
    cityId: "delhi",
    title: "Hauz Khas Village Chill",
    category: "Chill",
    emoji: "🌅",
    location: "Hauz Khas Village",
    timeLabel: "Today, 7:00 PM",
    goingCount: 15,
    totalSlots: 25,
    distanceKm: 3.1,
    creatorName: "Kabir",
    imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&h=320&fit=crop",
    description: "Rooftops, music & lake views.",
    latitude: 28.5494,
    longitude: 77.2001,
    pinColor: "#EC4899",
    area: "Hauz Khas",
  },
  {
    id: "dl-2",
    cityId: "delhi",
    title: "CP Coffee Walk",
    category: "Coffee",
    emoji: "☕",
    location: "Connaught Place",
    timeLabel: "Tomorrow, 11:00 AM",
    goingCount: 8,
    totalSlots: 12,
    distanceKm: 1.5,
    creatorName: "Pooja",
    imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&h=320&fit=crop",
    description: "Inner circle cafe hop + window shopping.",
    latitude: 28.6315,
    longitude: 77.2167,
    pinColor: "#F97316",
    area: "CP",
  },
  {
    id: "dl-3",
    cityId: "delhi",
    title: "Saket Movie Plan",
    category: "Movie",
    emoji: "🎬",
    location: "Select Citywalk, Saket",
    timeLabel: "Tonight, 6:45 PM",
    goingCount: 5,
    totalSlots: 8,
    distanceKm: 4.8,
    creatorName: "Vihaan",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=320&fit=crop",
    description: "Evening show + mall hang after.",
    latitude: 28.5244,
    longitude: 77.2066,
    pinColor: "#8B5CF6",
    area: "Saket",
  },

  // —— Bangalore ——
  {
    id: "bl-1",
    cityId: "bangalore",
    title: "Koramangala Brew Meetup",
    category: "Coffee",
    emoji: "☕",
    location: "Koramangala 5th Block",
    timeLabel: "Today, 5:30 PM",
    goingCount: 10,
    totalSlots: 14,
    distanceKm: 2.2,
    creatorName: "Nisha",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=320&fit=crop",
    description: "Third-wave coffee + startup chatter.",
    latitude: 12.9352,
    longitude: 77.6245,
    pinColor: "#F97316",
    area: "Koramangala",
  },
  {
    id: "bl-2",
    cityId: "bangalore",
    title: "Indiranagar Pub Crawl Lite",
    category: "Music",
    emoji: "🎤",
    location: "100 Feet Road, Indiranagar",
    timeLabel: "Sat, 8:00 PM",
    goingCount: 12,
    totalSlots: 20,
    distanceKm: 3.0,
    creatorName: "Rohan",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=320&fit=crop",
    description: "2–3 spots max — chill, not chaotic.",
    latitude: 12.9784,
    longitude: 77.6408,
    pinColor: "#A855F7",
    area: "Indiranagar",
  },
  {
    id: "bl-3",
    cityId: "bangalore",
    title: "Cubbon Park Picnic",
    category: "Chill",
    emoji: "🧺",
    location: "Cubbon Park",
    timeLabel: "Sunday, 10:00 AM",
    goingCount: 18,
    totalSlots: 30,
    distanceKm: 1.4,
    creatorName: "Aisha",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=320&fit=crop",
    description: "Blanket, snacks, board games under trees.",
    latitude: 12.975,
    longitude: 77.6063,
    pinColor: "#EC4899",
    area: "MG Road",
  },

  // —— Hyderabad ——
  {
    id: "hy-1",
    cityId: "hyderabad",
    title: "Hitech City Coffee",
    category: "Coffee",
    emoji: "☕",
    location: "Hitech City Food Street",
    timeLabel: "Today, 6:00 PM",
    goingCount: 9,
    totalSlots: 12,
    distanceKm: 2.6,
    creatorName: "Varun",
    imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&h=320&fit=crop",
    description: "After-office coffee with IT crowd.",
    latitude: 17.4435,
    longitude: 78.3772,
    pinColor: "#F97316",
    area: "Hitech City",
  },
  {
    id: "hy-2",
    cityId: "hyderabad",
    title: "Biryani Squad",
    category: "Food",
    emoji: "🍛",
    location: "Banjara Hills",
    timeLabel: "Tonight, 8:00 PM",
    goingCount: 11,
    totalSlots: 14,
    distanceKm: 3.3,
    creatorName: "Fatima",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=320&fit=crop",
    description: "Proper Hyd biryani run — spice level high.",
    latitude: 17.4156,
    longitude: 78.4347,
    pinColor: "#EF4444",
    area: "Banjara Hills",
  },
  {
    id: "hy-3",
    cityId: "hyderabad",
    title: "Gachibowli Badminton",
    category: "Sports",
    emoji: "🏸",
    location: "Gachibowli Indoor Courts",
    timeLabel: "Tomorrow, 7:00 AM",
    goingCount: 6,
    totalSlots: 8,
    distanceKm: 4.0,
    creatorName: "Sidd",
    imageUrl: "https://images.unsplash.com/photo-1531415075278-85f41f894b20?w=500&h=320&fit=crop",
    description: "Doubles morning session — rackets available.",
    latitude: 17.4401,
    longitude: 78.3489,
    pinColor: "#22C55E",
    area: "Gachibowli",
  },
];

export function planToMapEvent(plan: Plan, fallbackCity?: CityId | null): MapEvent | null {
  const fromLoc = resolveCityId(plan.location || "");
  const cityId = fromLoc || fallbackCity || null;
  if (!cityId) return null;

  const geo = geocodeInCity(cityId, plan.location);
  const center = getCityCenter(cityId);
  const cat = activityToCategory(plan.activity, plan.title);
  const meta = categoryMeta(cat);
  const activityImg = PLAN_ACTIVITIES.find(
    (a) => a.id === plan.activity || a.name.toLowerCase() === (plan.activity || "").toLowerCase()
  )?.image;

  return {
    id: `plan-${plan.id}`,
    cityId,
    title: plan.title,
    category: cat,
    emoji: meta.emoji,
    location: plan.location || CITY_BY_ID[cityId].name,
    timeLabel: plan.timeLabel || plan.time || "Flexible",
    goingCount: plan.going ?? plan.participants?.length ?? 1,
    totalSlots: plan.maxParticipants || 10,
    distanceKm: haversineKm(center.latitude, center.longitude, geo.lat, geo.lng),
    creatorName: plan.creatorName || "Host",
    imageUrl: plan.imageUrl || activityImg || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=320&fit=crop",
    description: plan.description || `Join ${plan.title} in ${CITY_BY_ID[cityId].name}.`,
    latitude: geo.lat,
    longitude: geo.lng,
    pinColor: meta.color,
    planId: plan.id,
    isLivePlan: true,
    area: geo.area,
  };
}

export function buildCityEvents(
  cityId: CityId,
  plans: Plan[],
  opts?: { includeDemo?: boolean; fallbackCity?: CityId | null }
): MapEvent[] {
  const includeDemo = opts?.includeDemo !== false;
  const demo = includeDemo ? CITY_MAP_EVENTS.filter((e) => e.cityId === cityId) : [];
  // Only attach unresolved plans to explicit fallbackCity (e.g. profile city) — never to every city view
  const live = plans
    .map((p) => planToMapEvent(p, opts?.fallbackCity ?? null))
    .filter((e): e is MapEvent => !!e && e.cityId === cityId);

  const byId = new Map<string, MapEvent>();
  for (const e of [...demo, ...live]) byId.set(e.id, e);
  return Array.from(byId.values()).sort((a, b) => a.distanceKm - b.distanceKm);
}

/** @deprecated use CITY_BY_ID.nagpur / getCityCenter */
export const NAGPUR_REGION = {
  latitude: 21.1458,
  longitude: 79.0882,
  latitudeDelta: 0.085,
  longitudeDelta: 0.085,
};
