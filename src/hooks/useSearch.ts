import { useState, useEffect, useRef } from "react";
import type { ApiResponse, SearchResults } from "@/types";

const EMPTY: SearchResults = { users: [], cities: [] };

// Debounced unified search (people + cities). Cancels in-flight requests when
// the query changes so results never arrive out of order.
export function useSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults(EMPTY);
      setError(null);
      setIsLoading(false);
      return;
    }

    const timeout = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data: ApiResponse<SearchResults> = await res.json();
        if (data.success && data.data) {
          setResults(data.data);
        } else {
          setError(data.error ?? "Search failed");
          setResults(EMPTY);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Search failed");
          setResults(EMPTY);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [query, debounceMs]);

  return { results, isLoading, error };
}
