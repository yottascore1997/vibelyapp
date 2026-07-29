export interface DiscoverProfile {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  jobTitle?: string;
  company?: string;
  education?: string;
  city?: string;
  distance: number;
  isVerified?: boolean;
  isOnline?: boolean;
  vibeMatch?: number;
  avatarUrl: string;
  photos?: string[];
  interests?: { name: string; color?: string | null; icon?: string | null }[];
  socialStatus?: {
    energy?: string;
    freeNow?: boolean;
    activityName?: string | null;
    timeLabel?: string | null;
  } | null;
  energy?: string;
}

export interface MatchProfile extends DiscoverProfile {
  matchedAt?: string;
}

export type SwipeAction = "LIKE" | "PASS" | "SUPER_LIKE";
