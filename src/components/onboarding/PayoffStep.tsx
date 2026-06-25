"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { EarnedBadge } from "@/lib/badges";

interface Summary {
  cityCount: number;
  countries: number;
  millionCities: number;
  badges: EarnedBadge[];
}

// Step 3: the payoff. Shows the achievements just earned from the cities added in
// step 1 — the million-city hero number, country count, and any unlocked badges —
// then drops the user onto their now-populated globe.
export function PayoffStep({
  onFinish,
  finishing,
}: {
  onFinish: () => void;
  finishing: boolean;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/onboarding/summary")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSummary(json.data as Summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 text-center">
      <div>
        <h2 className="text-xl font-bold text-foreground">You&apos;re on the map 🌍</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what you&apos;ve unlocked already — keep logging to climb.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat value={summary.cityCount} label={summary.cityCount === 1 ? "city" : "cities"} />
            <Stat value={summary.countries} label={summary.countries === 1 ? "country" : "countries"} />
            <Stat value={summary.millionCities} label="million-cities" hero />
          </div>

          {summary.badges.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Badges unlocked
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {summary.badges.map((b) => (
                  <span
                    key={b.id}
                    title={b.description}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-foreground"
                  >
                    <span aria-hidden>{b.emoji}</span> {b.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add a few more cities and you&apos;ll start unlocking badges like
              the 🌆 Million Club.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Your map is ready — let&apos;s take a look.
        </p>
      )}

      <Button onClick={onFinish} disabled={finishing} size="lg" className="w-full">
        {finishing ? "Loading your globe…" : "Explore my globe"}
      </Button>
    </div>
  );
}

function Stat({
  value,
  label,
  hero,
}: {
  value: number;
  label: string;
  hero?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className={`text-2xl font-bold ${hero ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
