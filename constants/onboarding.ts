export const ONBOARDING_STEPS = [
  { key: "basic-info", title: "Basic Info", step: 1, total: 5 },
  { key: "about-you", title: "About You", step: 2, total: 5 },
  { key: "lifestyle", title: "Lifestyle", step: 3, total: 5 },
  { key: "interests", title: "Interests", step: 4, total: 5 },
  { key: "preferences", title: "Preferences", step: 5, total: 5 },
];

export const GENDER_OPTIONS = [
  { id: "MALE", label: "Man", icon: "male", emoji: "👨" },
  { id: "FEMALE", label: "Woman", icon: "female", emoji: "👩" },
  { id: "OTHER", label: "Other", icon: "sparkles", emoji: "✨" },
];

export const INTERESTED_IN_OPTIONS = [
  { id: "MEN", label: "Men", icon: "man", emoji: "👨" },
  { id: "WOMEN", label: "Women", icon: "woman", emoji: "👩" },
  { id: "EVERYONE", label: "Everyone", icon: "people", emoji: "🌈" },
];

export const PRONOUNS_OPTIONS = [
  { id: "He/Him", label: "He/Him", emoji: "🙋‍♂️" },
  { id: "She/Her", label: "She/Her", emoji: "🙋‍♀️" },
  { id: "They/Them", label: "They/Them", emoji: "🧑‍🤝‍🧑" },
  { id: "Prefer not to say", label: "Skip", emoji: "🔒" },
];

export const SMOKING_OPTIONS = [
  { id: "Never", label: "Never", icon: "close-circle", emoji: "🚭" },
  { id: "Sometimes", label: "Socially", icon: "cloudy", emoji: "🚬" },
  { id: "Regularly", label: "Regularly", icon: "flame", emoji: "💨" },
  { id: "Trying to quit", label: "Quitting", icon: "leaf", emoji: "🌱" },
];

export const DRINKING_OPTIONS = [
  { id: "Never", label: "Never", icon: "close-circle", emoji: "🚫" },
  { id: "Socially", label: "Socially", icon: "wine", emoji: "🥂" },
  { id: "Regularly", label: "Regularly", icon: "beer", emoji: "🍺" },
  { id: "Sober", label: "Sober", icon: "water", emoji: "💧" },
];

export const WORKOUT_OPTIONS = [
  { id: "Never", label: "Never", icon: "bed", emoji: "🛌" },
  { id: "Sometimes", label: "Sometimes", icon: "walk", emoji: "🏃" },
  { id: "Often", label: "Often", icon: "fitness", emoji: "🏋️" },
  { id: "Daily", label: "Daily Gym", icon: "barbell", emoji: "⚡" },
];

export const DIET_OPTIONS = [
  { id: "Veg", label: "Veg", icon: "nutrition", emoji: "🥗" },
  { id: "Non-Veg", label: "Non-Veg", icon: "restaurant", emoji: "🍗" },
  { id: "Vegan", label: "Vegan", icon: "leaf", emoji: "🌱" },
  { id: "Eggetarian", label: "Eggitarian", icon: "egg", emoji: "🥚" },
];

export const PETS_OPTIONS = [
  { id: "No pets", label: "No pets", icon: "close-circle", emoji: "🚫" },
  { id: "Dog", label: "Dogs", icon: "paw", emoji: "🐶" },
  { id: "Cat", label: "Cats", icon: "paw", emoji: "🐱" },
  { id: "Both", label: "Both", icon: "heart", emoji: "🐾" },
];

export const ZODIAC_OPTIONS = [
  { id: "Aries", label: "Aries", emoji: "♈" },
  { id: "Taurus", label: "Taurus", emoji: "♉" },
  { id: "Gemini", label: "Gemini", emoji: "♊" },
  { id: "Cancer", label: "Cancer", emoji: "♋" },
  { id: "Leo", label: "Leo", emoji: "♌" },
  { id: "Virgo", label: "Virgo", emoji: "♍" },
  { id: "Libra", label: "Libra", emoji: "♎" },
  { id: "Scorpio", label: "Scorpio", emoji: "♏" },
  { id: "Sagittarius", label: "Sagittarius", emoji: "♐" },
  { id: "Capricorn", label: "Capricorn", emoji: "♑" },
  { id: "Aquarius", label: "Aquarius", emoji: "♒" },
  { id: "Pisces", label: "Pisces", emoji: "♓" },
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
  { id: "LONG_TERM", label: "Long-term Relationship", subtitle: "Building something real & meaningful", icon: "heart", emoji: "💖", color: "#EC4899" },
  { id: "CASUAL", label: "Casual Dating", subtitle: "Fun, spontaneous & open vibes", icon: "flame", emoji: "🔥", color: "#F97316" },
  { id: "FRIENDSHIP", label: "New Friends", subtitle: "Hangouts & social connections", icon: "people", emoji: "🤝", color: "#10B981" },
  { id: "MARRIAGE", label: "Marriage / Life Partner", subtitle: "Ready to settle down together", icon: "diamond", emoji: "💍", color: "#7C3AED" },
  { id: "NETWORKING", label: "Networking", subtitle: "Professional & creative minds", icon: "briefcase", emoji: "🚀", color: "#3B82F6" },
];

export const GENDER_PREF_OPTIONS = [
  { id: "MEN", label: "Men", icon: "man", emoji: "👨" },
  { id: "WOMEN", label: "Women", icon: "woman", emoji: "👩" },
  { id: "EVERYONE", label: "Everyone", icon: "people", emoji: "🌈" },
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
