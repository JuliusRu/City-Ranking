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
  userId: string;
  cityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitWithCity extends VisitData {
  city: CityData;
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
  avatarUrl: string | null;
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
