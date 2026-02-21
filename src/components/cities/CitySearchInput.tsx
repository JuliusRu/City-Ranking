"use client";

import { useState, useRef, useEffect } from "react";
import { useCitySearch } from "@/hooks/useCitySearch";
import type { GeocodingResult } from "@/lib/geocoding";

interface CitySearchInputProps {
  onSelect: (city: GeocodingResult) => void;
  selectedCity?: { name: string; country: string } | null;
  error?: string;
}

export function CitySearchInput({
  onSelect,
  selectedCity,
  error,
}: CitySearchInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading } = useCitySearch(query);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(city: GeocodingResult) {
    onSelect(city);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <label className="block text-sm font-medium text-foreground">City</label>

      {selectedCity ? (
        <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-background px-3">
          <span className="text-sm text-foreground">
            {selectedCity.name}, {selectedCity.country}
          </span>
          <button
            type="button"
            onClick={() => onSelect(null as unknown as GeocodingResult)}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search for a city..."
          className={`h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
            error ? "border-destructive" : "border-border"
          }`}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
          {isLoading ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {results.map((city, i) => (
                <li key={`${city.externalId}-${i}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(city)}
                    className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {city.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {[city.state, city.country].filter(Boolean).join(", ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
