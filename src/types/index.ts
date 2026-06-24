export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  issues?: { path: string; message: string }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CityWithVisits {
  id: string;
  name: string;
  country: string;
  state: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  population: number | null;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
  visits: VisitData[];
}

export interface CityData {
  id: string;
  name: string;
  country: string;
  state: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  population: number | null;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitData {
  id: string;
  rating: number;
  comment: string | null;
  startDate: string;
  endDate: string | null;
  tripType: string | null;
  budgetLevel: string | null;
  wouldReturn: boolean | null;
  highlights: string | null;
  transport: string | null;
  photoUrl: string | null;
  userId: string;
  cityId: string;
  createdAt: string;
  updatedAt: string;
}

export type DistrictFrequency =
  | "PASSED_THROUGH"
  | "FEW_TIMES"
  | "A_LOT"
  | "BASED_HERE";

export interface DistrictData {
  id: string;
  cityId: string;
  name: string;
  latitude: number;
  longitude: number;
  externalId: string | null;
}

export interface VisitDistrictData {
  id: string;
  visitId: string;
  districtId: string;
  rating: number;
  frequency: DistrictFrequency;
  district: DistrictData;
}

export interface VisitWithCity extends VisitData {
  city: CityData;
  districts?: VisitDistrictData[];
}

export interface GlobeMarker {
  id: string;
  cityId: string;
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  startDate: string;
  endDate: string | null;
  comment: string | null;
}

export type VenueType =
  | "RESTAURANT"
  | "CAFE"
  | "BAR"
  | "BAKERY"
  | "CLUB"
  | "OTHER";

export interface VenueData {
  id: string;
  name: string;
  type: VenueType;
  rating: number;
  location: string | null;
  priceLevel: string | null;
  note: string | null;
  wouldReturn: boolean | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CityOverview {
  id: string;
  name: string;
  country: string;
  visitCount: number;
  avgRating: number;
  totalDays: number;
  lastVisited: string;
}

export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  publicProfile: boolean;
}

// Public-safe shape served on /@username — deliberately excludes email/authId.
export interface PublicProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  markers: GlobeMarker[];
  stats: { cities: number; countries: number };
  social: { followers: number; following: number; likes: number };
}

// Public-safe author shape embedded in feed items — no email/authId.
export interface FeedAuthor {
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

// One shared city rating as it appears in the feed.
export interface FeedItem {
  id: string; // the visit id
  createdAt: string;
  rating: number;
  comment: string | null;
  startDate: string;
  endDate: string | null;
  photoUrl: string | null;
  city: { id: string; name: string; country: string };
  districts: string[]; // district names covered on this visit
  author: FeedAuthor;
  likeCount: number;
  likedByViewer: boolean;
  commentCount: number;
  followedByViewer: boolean; // does the viewer follow this author
  isOwn: boolean; // the viewer authored this
}

// A comment on a shared visit, as returned to the client.
export interface CommentData {
  id: string;
  body: string;
  createdAt: string;
  author: FeedAuthor;
  isOwn: boolean; // the viewer wrote it (controls the delete affordance)
}

export interface UserSearchResult {
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface CitySearchResult {
  id: string;
  name: string;
  country: string;
  avgRating: number; // community average across public visits (0–100)
  raters: number; // distinct public users who rated it
}

export interface SearchResults {
  users: UserSearchResult[];
  cities: CitySearchResult[];
}

// AI-extracted visit fields returned by /api/visits/parse. The city is already
// geocoded (or null if it couldn't be resolved); cityQuery is what the model
// read so the UI can show "couldn't find <X>".
export interface ParsedVisit {
  city: GeocodingResultLite | null;
  cityQuery: string | null;
  rating: number | null;
  startDate: string | null;
  endDate: string | null;
  comment: string | null;
  tripType: string | null;
  budgetLevel: string | null;
  transport: string | null;
  wouldReturn: boolean | null;
  districts: { name: string; rating: number; frequency: DistrictFrequency }[];
}

export interface GeocodingResultLite {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  externalId: string;
}

export type FeedScope = "global" | "following";

export interface FeedPage {
  items: FeedItem[];
  nextCursor: string | null;
}

export interface UserSettingsData {
  id: string;
  userId: string;
  theme: string;
  dateFormat: string;
  defaultSortBy: string;
  defaultSortOrder: string;
  homeCurrency: string;
  distanceUnit: string;
  defaultTripType: string | null;
  defaultBudget: string | null;
}

export interface UserWithSettings extends UserData {
  settings: UserSettingsData | null;
}

export interface StatsData {
  totalCities: number;
  totalCountries: number;
  totalTrips: number;
  totalDays: number;
  avgRating: number;
  ratingDistribution: { bucket: string; count: number }[];
  topRatedCities: { name: string; country: string; avgRating: number }[];
  visitsByYear: { year: number; count: number }[];
  tripTypeBreakdown: { type: string; count: number }[];
  budgetBreakdown: { level: string; count: number }[];
  mostVisitedCities: { name: string; country: string; count: number }[];
}
