export const ONBOARDING_STEPS = [
  { key: "basic-info", title: "Basic Info", step: 1, total: 5 },
  { key: "about-you", title: "About You", step: 2, total: 5 },
  { key: "lifestyle", title: "Lifestyle", step: 3, total: 5 },
  { key: "interests", title: "Interests", step: 4, total: 5 },
  { key: "preferences", title: "Preferences", step: 5, total: 5 },
];

export const GENDER_OPTIONS = [
  { id: "MALE", label: "Man", icon: "male" },
  { id: "FEMALE", label: "Woman", icon: "female" },
  { id: "OTHER", label: "Other", icon: "person" },
];

export const INTERESTED_IN_OPTIONS = [
  { id: "MEN", label: "Men", icon: "man" },
  { id: "WOMEN", label: "Women", icon: "woman" },
  { id: "EVERYONE", label: "Everyone", icon: "people" },
];

export const PRONOUNS_OPTIONS = ["He/Him", "She/Her", "They/Them", "Prefer not to say"];

export const SMOKING_OPTIONS = ["Never", "Sometimes", "Regularly", "Trying to quit"];
export const DRINKING_OPTIONS = ["Never", "Socially", "Regularly", "Sober"];
export const WORKOUT_OPTIONS = ["Never", "Sometimes", "Often", "Daily"];
export const DIET_OPTIONS = ["Veg", "Non-Veg", "Vegan", "Eggetarian", "Jain"];
export const PETS_OPTIONS = ["No pets", "Dog", "Cat", "Both", "Other"];

export const ZODIAC_OPTIONS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const LANGUAGE_OPTIONS = [
  "Hindi", "English", "Marathi", "Gujarati", "Tamil", "Telugu",
  "Bengali", "Punjabi", "Kannada", "Malayalam", "Urdu",
];

export const INTEREST_OPTIONS = [
  { name: "Travel", icon: "airplane", color: "#3B82F6" },
  { name: "Movies", icon: "film", color: "#6366F1" },
  { name: "Music", icon: "musical-notes", color: "#8B5CF6" },
  { name: "Gym", icon: "barbell", color: "#EF4444" },
  { name: "Photography", icon: "camera", color: "#10B981" },
  { name: "Reading", icon: "book", color: "#F97316" },
  { name: "Gaming", icon: "game-controller", color: "#EC4899" },
  { name: "Cricket", icon: "baseball", color: "#22C55E" },
  { name: "Football", icon: "football", color: "#16A34A" },
  { name: "Anime", icon: "sparkles", color: "#A855F7" },
  { name: "Cooking", icon: "restaurant", color: "#F59E0B" },
  { name: "Dancing", icon: "body", color: "#FF4B81" },
  { name: "Startups", icon: "rocket", color: "#8A56FF" },
  { name: "Coding", icon: "code-slash", color: "#0EA5E9" },
  { name: "Fashion", icon: "shirt", color: "#F472B6" },
  { name: "Coffee", icon: "cafe", color: "#8B5E3C" },
  { name: "Pets", icon: "paw", color: "#FB923C" },
  { name: "Hiking", icon: "trail-sign", color: "#84CC16" },
  { name: "Swimming", icon: "water", color: "#06B6D4" },
  { name: "Art", icon: "color-palette", color: "#E879F9" },
  { name: "Cars", icon: "car", color: "#64748B" },
  { name: "Bikes", icon: "bicycle", color: "#14B8A6" },
];

export const LOOKING_FOR_OPTIONS = [
  { id: "LONG_TERM", label: "Long-term Relationship", icon: "heart", color: "#FF4B81" },
  { id: "CASUAL", label: "Casual Dating", icon: "flame", color: "#F97316" },
  { id: "FRIENDSHIP", label: "Friendship", icon: "people", color: "#22C55E" },
  { id: "MARRIAGE", label: "Marriage", icon: "diamond", color: "#8A56FF" },
  { id: "NETWORKING", label: "Networking", icon: "briefcase", color: "#3B82F6" },
];

export const GENDER_PREF_OPTIONS = [
  { id: "MEN", label: "Men" },
  { id: "WOMEN", label: "Women" },
  { id: "EVERYONE", label: "Everyone" },
];

export interface OnboardingData {
  firstName: string;
  dateOfBirth: string;
  gender: string;
  interestedIn: string;
  pronouns: string;
  bio: string;
  occupation: string;
  company: string;
  education: string;
  college: string;
  height: string;
  languages: string[];
  religion: string;
  smoking: string;
  drinking: string;
  workout: string;
  diet: string;
  pets: string;
  zodiac: string;
  interests: string[];
  minAge: number;
  maxAge: number;
  maxDistance: number;
  genderPreference: string;
  lookingFor: string[];
}

export const defaultOnboardingData: OnboardingData = {
  firstName: "",
  dateOfBirth: "",
  gender: "",
  interestedIn: "",
  pronouns: "",
  bio: "",
  occupation: "",
  company: "",
  education: "",
  college: "",
  height: "",
  languages: [],
  religion: "",
  smoking: "",
  drinking: "",
  workout: "",
  diet: "",
  pets: "",
  zodiac: "",
  interests: [],
  minAge: 18,
  maxAge: 35,
  maxDistance: 25,
  genderPreference: "",
  lookingFor: [],
};
