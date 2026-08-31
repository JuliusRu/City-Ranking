"use client";

import { useState, useRef, useEffect } from "react";
import { useDistrictSearch } from "@/hooks/useDistrictSearch";
import { ratingToColor, ratingToDisplay, ratingTextColor } from "@/lib/rating";
import { DISTRICT_FREQUENCIES } from "@/config/constants";
import type { DistrictFrequency } from "@/types";

// Form-local shape for a district on the visit being edited. Mirrors the API's
// visitDistrictInputSchema (catalog data + the two dimensions).
export interface DistrictEntry {
  name: string;
  latitude: number;
  longitude: number;
  externalId?: string | null;
  rating: number;
  frequency: DistrictFrequency;
}

interface DistrictPickerProps {
  city: { latitude: number; longitude: number } | null;
  value: DistrictEntry[];
  onChange: (districts: DistrictEntry[]) => void;
}

export function DistrictPicker({ city, value, onChange }: DistrictPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading } = useDistrictSearch(query, city);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addDistrict(d: {
    name: string;
    latitude: number;
    longitude: number;
    externalId: string;
  }) {
    // Skip if already added (case-insensitive name match).
    if (value.some((v) => v.name.toLowerCase() === d.name.toLowerCase())) {
      setQuery("");
      setIsOpen(false);
      return;
    }
    onChange([
      ...value,
      {
        name: d.name,
        latitude: d.latitude,
        longitude: d.longitude,
        externalId: d.externalId,
        rating: 50,
        frequency: "FEW_TIMES",
      },
    ]);
    setQuery("");
    setIsOpen(false);
  }

  function updateAt(index: number, patch: Partial<DistrictEntry>) {
    onChange(value.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-foreground">
          Districts <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          In big cities, rate the neighbourhoods separately — how much you were
          there vs. how much you liked them.
        </p>
      </div>

      {!city ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
          Select a city first to add its districts.
        </p>
      ) : (
        <div ref={containerRef} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder="Search a district / neighbourhood..."
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {isOpen && (results.length > 0 || isLoading) && (
            <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
              {isLoading ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : (
                <ul className="max-h-60 overflow-y-auto py-1">
                  {results.map((d, i) => (
                    <li key={`${d.externalId}-${i}`}>
                      <button
                        type="button"
                        onClick={() => addDistrict(d)}
                        className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {d.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {d.displayName}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {value.length > 0 && (
        <ul className="space-y-3">
          {value.map((d, i) => (
            <li
              key={`${d.name}-${i}`}
              className="rounded-lg border border-border bg-background p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {d.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Remove ${d.name}`}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive"
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={d.rating}
                  onChange={(e) => updateAt(i, { rating: Number(e.target.value) })}
                  aria-label={`${d.name} rating`}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted sm:flex-1"
                  style={{ accentColor: ratingToColor(d.rating) }}
                />
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-12 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{
                      backgroundColor: ratingToColor(d.rating),
                      color: ratingTextColor(d.rating),
                    }}
                  >
                    {ratingToDisplay(d.rating)}
                  </div>
                  <select
                    value={d.frequency}
                    onChange={(e) =>
                      updateAt(i, { frequency: e.target.value as DistrictFrequency })
                    }
                    aria-label={`${d.name} frequency`}
                    className="h-9 flex-1 rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:flex-shrink-0"
                  >
                    {DISTRICT_FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
