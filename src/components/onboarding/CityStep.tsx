"use client";

import { useState, useRef, useEffect } from "react";
import { useCitySearch } from "@/hooks/useCitySearch";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Rating } from "@/components/ui/Rating";
import { ratingToColor, ratingToDisplay, ratingTextColor } from "@/lib/rating";
import type { GeocodingResult } from "@/lib/geocoding";

// A geocoded city the user wants to log, plus the rating they'll give it.
interface DraftCity {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  externalId: string;
  population: number | null;
  rating: number;
}

const DEFAULT_RATING = 70;

// Resolve a picked city to its DB id. POST /api/cities is find-or-create: it
// returns 201 for a city we didn't have and 200 for one we already knew, so a
// re-geocode of a known city no longer produces a second row.
async function resolveCityId(c: DraftCity): Promise<string | null> {
  const res = await fetch("/api/cities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: c.name,
      country: c.country,
      state: c.state,
      latitude: c.latitude,
      longitude: c.longitude,
      externalId: c.externalId,
      population: c.population ?? undefined,
    }),
  });
  const data = await res.json();
  if (data.success) return data.data.id as string;
  return null;
}

export function CityStep({ onComplete }: { onComplete: () => void }) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"search" | "text">("search");
  const [cities, setCities] = useState<DraftCity[]>([]);
  const [saving, setSaving] = useState(false);

  // --- Search mode state ---
  const [query, setQuery] = useState("");
  const { results, isLoading } = useCitySearch(query);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // --- Text mode state ---
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function addCity(c: Omit<DraftCity, "rating">, rating = DEFAULT_RATING) {
    setCities((prev) => {
      if (prev.some((p) => p.externalId === c.externalId)) return prev;
      return [...prev, { ...c, rating }];
    });
  }

  function handleSearchSelect(city: GeocodingResult) {
    addCity({
      name: city.name,
      country: city.country,
      state: city.state,
      latitude: city.latitude,
      longitude: city.longitude,
      externalId: city.externalId,
      population: city.population,
    });
    setQuery("");
    setOpen(false);
  }

  function setRating(externalId: string, rating: number) {
    setCities((prev) =>
      prev.map((c) => (c.externalId === externalId ? { ...c, rating } : c))
    );
  }

  function remove(externalId: string) {
    setCities((prev) => prev.filter((c) => c.externalId !== externalId));
  }

  async function parseFromText() {
    if (!text.trim() || parsing) return;
    setParsing(true);
    try {
      const res = await fetch("/api/cities/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.success) {
        toast(data.error ?? "Could not read your note.", "error");
        return;
      }
      const parsed = data.data as {
        city: Omit<DraftCity, "rating">;
        rating: number | null;
      }[];
      if (parsed.length === 0) {
        toast("No cities found in that note — try naming them directly.", "info");
        return;
      }
      // Merge in one pass, deduping against what's already in the list.
      setCities((prev) => {
        const seen = new Set(prev.map((c) => c.externalId));
        const fresh = parsed
          .filter((p) => !seen.has(p.city.externalId))
          .map((p) => ({ ...p.city, rating: p.rating ?? DEFAULT_RATING }));
        return [...prev, ...fresh];
      });
      setText("");
      setMode("search");
      toast(`Added ${parsed.length} ${parsed.length === 1 ? "city" : "cities"}.`, "success");
    } catch {
      toast("Could not reach the server. Check your connection.", "error");
    } finally {
      setParsing(false);
    }
  }

  async function handleContinue() {
    if (cities.length === 0 || saving) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    let created = 0;
    try {
      for (const c of cities) {
        const cityId = await resolveCityId(c);
        if (!cityId) continue;
        const res = await fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cityId, rating: c.rating, startDate: today }),
        });
        // 409 = a visit for this city/date already exists — treat as success.
        if (res.ok || res.status === 409) created++;
      }
      if (created === 0) {
        toast("Couldn't save your cities — please try again.", "error");
        setSaving(false);
        return;
      }
      onComplete();
    } catch {
      toast("Couldn't save your cities — please try again.", "error");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Put your first cities on the map
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a few places you&apos;ve been and how you rated them — search for
          them, or just type them out and we&apos;ll do the rest.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-xl border border-border p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition-colors ${
            mode === "search"
              ? "bg-gradient-brand text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition-colors ${
            mode === "text"
              ? "bg-gradient-brand text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ✨ From text
        </button>
      </div>

      {mode === "search" ? (
        <div ref={searchRef} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder="Search for a city…"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {open && (results.length > 0 || isLoading) && (
            <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
              {isLoading ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Searching…
                </div>
              ) : (
                <ul className="max-h-60 overflow-y-auto py-1">
                  {results.map((city, i) => (
                    <li key={`${city.externalId}-${i}`}>
                      <button
                        type="button"
                        onClick={() => handleSearchSelect(city)}
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
      ) : (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="e.g. Tokyo and Osaka last spring, both amazing. Berlin was okay, Lisbon I loved."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.length}/4000</span>
            <Button onClick={parseFromText} disabled={!text.trim() || parsing} size="sm">
              {parsing ? "Reading…" : "✨ Add these cities"}
            </Button>
          </div>
        </div>
      )}

      {/* Draft list */}
      {cities.length > 0 && (
        <ul className="flex flex-col gap-3">
          {cities.map((c) => (
            <li
              key={c.externalId}
              className="rounded-xl border border-border bg-card p-3"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[c.state, c.country].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-11 items-center justify-center rounded-md text-xs font-bold"
                    style={{
                      backgroundColor: ratingToColor(c.rating),
                      color: ratingTextColor(c.rating),
                    }}
                  >
                    {ratingToDisplay(c.rating)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(c.externalId)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${c.name}`}
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
              </div>
              <Rating value={c.rating} onChange={(v) => setRating(c.externalId, v)} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onComplete}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
        <Button onClick={handleContinue} disabled={cities.length === 0 || saving}>
          {saving
            ? "Saving…"
            : cities.length > 0
              ? `Continue with ${cities.length} ${cities.length === 1 ? "city" : "cities"}`
              : "Continue"}
        </Button>
      </div>
    </div>
  );
}
