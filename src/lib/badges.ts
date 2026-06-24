// Achievement badges — fun, status-worthy stats computed entirely from a user's
// own visits (no cross-user data needed yet). Each badge has a `check(stats)`.
// Keep the set small + iconic ("does it fit in a bio?"); add sparingly.

export interface EarnedBadge {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

// One raw visit, in the minimal shape the badge engine needs.
export interface BadgeVisit {
  rating: number; // 0–100
  startDate: Date;
  cityId: string;
  country: string;
  population: number | null;
  latitude: number;
  longitude: number;
  districtCount: number; // districts logged on this visit
}

const MILLION = 1_000_000;

// Rough lat/lng → continent. Approximate (boxes overlap at edges) but fine for a
// fun badge. Ordered most-specific first.
function continentOf(lat: number, lng: number): string | null {
  if (lat < -60) return "Antarctica";
  if (lng >= 110 && lat <= 0 && lat > -50) return "Oceania";
  if (lat >= 7 && lat <= 84 && lng >= -168 && lng <= -52) return "North America";
  if (lat < 13 && lng >= -82 && lng <= -34) return "South America";
  if (lat >= 34 && lng >= -25 && lng <= 45) return "Europe";
  if (lat >= -35 && lat <= 37 && lng >= -20 && lng <= 52) return "Africa";
  if (lng >= 26 && lat >= -10) return "Asia";
  return null;
}

export interface BadgeStats {
  millionCities: number;
  countries: number;
  continents: number;
  cityCount: number;
  avgRating: number; // 0–100, over best-rated visit per city
  maxNewCitiesInMonth: number;
  maxVisitsOneCity: number;
  hasPerfect: boolean;
  hasWildcard: boolean; // a city rated ≥30 from the user's own average
  districtCities: number; // distinct cities with ≥1 district
  totalDistricts: number;
}

export function computeBadgeStats(visits: BadgeVisit[]): BadgeStats {
  // Group by city → best rating, visit count, first-visit month, etc.
  const byCity = new Map<
    string,
    {
      country: string;
      population: number | null;
      lat: number;
      lng: number;
      bestRating: number;
      visits: number;
      firstDate: Date;
      districts: number;
    }
  >();

  for (const v of visits) {
    const c = byCity.get(v.cityId);
    if (!c) {
      byCity.set(v.cityId, {
        country: v.country,
        population: v.population,
        lat: v.latitude,
        lng: v.longitude,
        bestRating: v.rating,
        visits: 1,
        firstDate: v.startDate,
        districts: v.districtCount,
      });
    } else {
      c.bestRating = Math.max(c.bestRating, v.rating);
      c.visits += 1;
      if (v.startDate < c.firstDate) c.firstDate = v.startDate;
      c.districts += v.districtCount;
    }
  }

  const cities = [...byCity.values()];
  const cityCount = cities.length;

  const millionCities = cities.filter(
    (c) => (c.population ?? 0) >= MILLION
  ).length;
  const countries = new Set(cities.map((c) => c.country).filter(Boolean)).size;
  const continents = new Set(
    cities.map((c) => continentOf(c.lat, c.lng)).filter(Boolean) as string[]
  ).size;

  const ratings = cities.map((c) => c.bestRating);
  const avgRating = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;
  const hasPerfect = ratings.some((r) => r >= 100);
  const hasWildcard =
    cities.length >= 3 && ratings.some((r) => Math.abs(r - avgRating) >= 30);

  const maxVisitsOneCity = cities.reduce((m, c) => Math.max(m, c.visits), 0);

  // New cities per calendar month (by first visit).
  const perMonth = new Map<string, number>();
  for (const c of cities) {
    const key = `${c.firstDate.getUTCFullYear()}-${c.firstDate.getUTCMonth()}`;
    perMonth.set(key, (perMonth.get(key) ?? 0) + 1);
  }
  const maxNewCitiesInMonth = [...perMonth.values()].reduce(
    (m, n) => Math.max(m, n),
    0
  );

  const districtCities = cities.filter((c) => c.districts > 0).length;
  const totalDistricts = cities.reduce((sum, c) => sum + c.districts, 0);

  return {
    millionCities,
    countries,
    continents,
    cityCount,
    avgRating,
    maxNewCitiesInMonth,
    maxVisitsOneCity,
    hasPerfect,
    hasWildcard,
    districtCities,
    totalDistricts,
  };
}

interface BadgeDef extends Omit<EarnedBadge, never> {
  check: (s: BadgeStats) => boolean;
}

const BADGES: BadgeDef[] = [
  {
    id: "million-club",
    name: "Million Club",
    emoji: "🌆",
    description: "Slept in 10+ million-cities",
    check: (s) => s.millionCities >= 10,
  },
  {
    id: "megalopolis",
    name: "Megalopolis",
    emoji: "🌃",
    description: "Slept in 25+ million-cities",
    check: (s) => s.millionCities >= 25,
  },
  {
    id: "globetrotter",
    name: "Globetrotter",
    emoji: "🗺️",
    description: "Visited 10+ countries",
    check: (s) => s.countries >= 10,
  },
  {
    id: "continental",
    name: "Continental",
    emoji: "🌍",
    description: "Cities on 4+ continents",
    check: (s) => s.continents >= 4,
  },
  {
    id: "all-seven",
    name: "All Seven",
    emoji: "🪐",
    description: "Set foot on all 7 continents",
    check: (s) => s.continents >= 7,
  },
  {
    id: "whirlwind",
    name: "Whirlwind",
    emoji: "⚡",
    description: "3+ new cities in a single month",
    check: (s) => s.maxNewCitiesInMonth >= 3,
  },
  {
    id: "loyalist",
    name: "Loyalist",
    emoji: "🔁",
    description: "Visited one city 3+ times",
    check: (s) => s.maxVisitsOneCity >= 3,
  },
  {
    id: "perfect-ten",
    name: "Perfect Ten",
    emoji: "💯",
    description: "Gave a city a perfect 10.0",
    check: (s) => s.hasPerfect,
  },
  {
    id: "wildcard",
    name: "Wildcard",
    emoji: "🃏",
    description: "A rating 3+ points off your own average",
    check: (s) => s.hasWildcard,
  },
  {
    id: "tough-critic",
    name: "Tough Critic",
    emoji: "🖤",
    description: "Average under 5.0 across 10+ cities",
    check: (s) => s.cityCount >= 10 && s.avgRating < 50,
  },
  {
    id: "local",
    name: "Local",
    emoji: "🏘️",
    description: "Logged districts in 5+ cities",
    check: (s) => s.districtCities >= 5,
  },
  {
    id: "neighbourhood-nerd",
    name: "Neighbourhood Nerd",
    emoji: "🧭",
    description: "Logged 15+ districts",
    check: (s) => s.totalDistricts >= 15,
  },
];

export function evaluateBadges(stats: BadgeStats): EarnedBadge[] {
  return BADGES.filter((b) => b.check(stats)).map(
    ({ id, name, emoji, description }) => ({ id, name, emoji, description })
  );
}

// Convenience: stats + earned badges in one call from raw visits.
export function badgesForVisits(visits: BadgeVisit[]): {
  stats: BadgeStats;
  badges: EarnedBadge[];
} {
  const stats = computeBadgeStats(visits);
  return { stats, badges: evaluateBadges(stats) };
}
