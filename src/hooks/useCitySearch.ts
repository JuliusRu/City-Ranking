import { useState, useEffect, useRef } from "react";
import type { GeocodingResult } from "@/lib/geocoding";
import type { ApiResponse } from "@/types";

export function useCitySearch(query: string, debounceMs = 350) {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      // Cancel previous request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/cities/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const data: ApiResponse<GeocodingResult[]> = await res.json();

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
  }, [query, debounceMs]);

  return { results, isLoading, error };
}
