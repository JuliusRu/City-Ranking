export const APP_NAME = "City Ranking";

// Absolute base URL — used for share links and OpenGraph metadata (which must be
// absolute since crawlers fetch them out of any page context). Overridable via
// env for preview deploys; defaults to the production domain.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ranking.place"
).replace(/\/$/, "");

// Usernames that can't be claimed — they'd collide with real routes (or read as
// official). The public profile route is /@<username>, but reserving these keeps
// share URLs unambiguous and prevents impersonation of system pages.
export const RESERVED_USERNAMES = new Set([
  "api",
  "login",
  "logout",
  "signup",
  "settings",
  "cities",
  "stats",
  "visits",
  "admin",
  "about",
  "pricing",
  "help",
  "support",
  "terms",
  "privacy",
  "home",
  "feed",
  "search",
  "explore",
  "discover",
  "me",
  "user",
  "users",
  "profile",
  "_next",
  "favicon",
  "robots",
  "sitemap",
  "ranking",
  "rankingplace",
]);

export const RATING_MIN = 0;
export const RATING_MAX = 100;

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const COMMENT_MAX_LENGTH = 5000;

export const GLOBE = {
  FLY_TO_DURATION: 2.5,
  FLY_TO_ALTITUDE: 50_000,
  FLY_TO_PITCH: -45,
  LABEL_NEAR_DISTANCE: 0,
  LABEL_FAR_DISTANCE: 5_000_000,
  MARKER_SIZE: 10,
} as const;

export const TRIP_TYPES = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "friends", label: "Friends" },
  { value: "business", label: "Business" },
] as const;

export const BUDGET_LEVELS = [
  { value: "budget", label: "Budget" },
  { value: "moderate", label: "Moderate" },
  { value: "expensive", label: "Expensive" },
  { value: "luxury", label: "Luxury" },
] as const;

export const TRANSPORT_METHODS = [
  { value: "flew", label: "Flew" },
  { value: "drove", label: "Drove" },
  { value: "train", label: "Train" },
  { value: "bus", label: "Bus" },
  { value: "cruise", label: "Cruise" },
  { value: "other", label: "Other" },
] as const;

export const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
] as const;

export const DATE_FORMATS = [
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "YYYY-MM-DD",
] as const;

export const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "CHF", label: "CHF — Swiss Franc" },
] as const;

export const DISTANCE_UNITS = [
  { value: "km", label: "Kilometers" },
  { value: "mi", label: "Miles" },
] as const;

// Venue types — value matches the VenueType enum.
export const VENUE_TYPES = [
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "CAFE", label: "Café" },
  { value: "BAR", label: "Bar" },
  { value: "BAKERY", label: "Bakery" },
  { value: "CLUB", label: "Club" },
  { value: "OTHER", label: "Other" },
] as const;

// District frequency — value matches the DistrictFrequency enum. `weight` orders
// "how much time spent" for the most-visited aggregation (higher = more).
export const DISTRICT_FREQUENCIES = [
  { value: "PASSED_THROUGH", label: "Passed through", weight: 1 },
  { value: "FEW_TIMES", label: "A few times", weight: 2 },
  { value: "A_LOT", label: "A lot", weight: 3 },
  { value: "BASED_HERE", label: "Based here", weight: 4 },
] as const;

export const RATE_LIMITS = {
  READ: 60,
  CREATE: 20,
  UPDATE: 20,
  DELETE: 10,
  SEARCH: 30,
} as const;

// ranking.place Pro — a one-time "supporter" unlock. The app stays free; Pro
// only adds cosmetic extras (a profile badge + a custom accent colour). isPro is
// set exclusively by the Stripe webhook, never by the client.
export const PRO = {
  priceDisplay: "€1",
  interval: "/mo",
  tagline: "€1/month · keeps ranking.place free for everyone, cancel anytime",
} as const;

// The accent palette a Pro user can pick for their profile + shared OG card.
// Constrained to a preset list so the value is always a safe, on-brand hex —
// the validator rejects anything not in here. First entry == the default brand
// blue, used as the fallback for free users.
export const ACCENT_COLORS = [
  "#5B9BB5", // brand blue (default)
  "#C08552", // terracotta
  "#7FA670", // sage
  "#A87FB5", // lilac
  "#B5705B", // rust
  "#D4A24E", // gold
] as const;

export const DEFAULT_ACCENT = ACCENT_COLORS[0];
