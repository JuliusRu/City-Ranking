import { useState, useEffect, useRef } from "react";
import type { DistrictGeocodingResult } from "@/lib/geocoding";
import type { ApiResponse } from "@/types";

// Debounced district search, biased to a city via lat/lng. Mirrors useCitySearch
// but stays idle until a city (coordinates) is available.
export function useDistrictSearch(
  query: string,
  city: { latitude: number; longitude: number } | null,
  debounceMs = 350
) {
  const [results, setResults] = useState<DistrictGeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!city || query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: query,
          lat: String(city.latitude),
          lng: String(city.longitude),
        });
        const res = await fetch(`/api/districts/search?${params}`, {
          signal: controller.signal,
        });
        const data: ApiResponse<DistrictGeocodingResult[]> = await res.json();

        if (data.success && data.data) {
          setResults(data.data);
        } else {
          setError(data.error ?? "Search failed");
          setResults([]);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Search failed");
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [query, city, debounceMs]);

  return { results, isLoading, error };
}
