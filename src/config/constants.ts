export const APP_NAME = "City Ranking";

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

export const RATE_LIMITS = {
  READ: 60,
  CREATE: 20,
  UPDATE: 20,
  DELETE: 10,
  SEARCH: 30,
} as const;
