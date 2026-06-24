"use client";

import dynamic from "next/dynamic";
import type { GlobeMarker } from "@/types";

// Just the map (no sidebar/tour/info-panel) as a showcase on the landing.
const GlobeViewer = dynamic(
  () => import("@/components/globe/GlobeViewer").then((m) => m.GlobeViewer),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-card" />,
  }
);

// A teaser set of famous million-cities, varied ratings for colour variety.
const city = (
  cityName: string,
  country: string,
  latitude: number,
  longitude: number,
  rating: number
): GlobeMarker => ({
  id: cityName,
  cityId: cityName,
  cityName,
  country,
  latitude,
  longitude,
  rating,
  startDate: "2024-01-01",
  endDate: null,
  comment: null,
});

const DEMO: GlobeMarker[] = [
  city("Tokyo", "Japan", 35.6762, 139.6503, 96),
  city("New York", "United States", 40.7128, -74.006, 92),
  city("London", "United Kingdom", 51.5074, -0.1278, 90),
  city("Barcelona", "Spain", 41.3851, 2.1734, 93),
  city("Berlin", "Germany", 52.52, 13.405, 86),
  city("Singapore", "Singapore", 1.3521, 103.8198, 89),
  city("Sydney", "Australia", -33.8688, 151.2093, 88),
  city("Cape Town", "South Africa", -33.9249, 18.4241, 87),
  city("Rio de Janeiro", "Brazil", -22.9068, -43.1729, 85),
  city("Mexico City", "Mexico", 19.4326, -99.1332, 84),
  city("Istanbul", "Türkiye", 41.0082, 28.9784, 82),
  city("Bangkok", "Thailand", 13.7563, 100.5018, 80),
  city("Mumbai", "India", 19.076, 72.8777, 74),
  city("Cairo", "Egypt", 30.0444, 31.2357, 69),
];

export function LandingGlobe() {
  return (
    <div className="relative h-[340px] w-full overflow-hidden rounded-2xl border border-border shadow-2xl sm:h-[440px]">
      <GlobeViewer markers={DEMO} onMarkerClick={() => {}} />
    </div>
  );
}
