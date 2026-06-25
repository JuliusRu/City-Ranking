"use client";

import { useState } from "react";
import Link from "next/link";
import { useCityOverviews } from "@/hooks/useCities";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";
import { Container } from "@/components/layout/Container";

type SortBy = "ranking" | "name" | "visitCount" | "lastVisited";

export default function CitiesPage() {
  const { cities, isLoading, error } = useCityOverviews();
  const [sortBy, setSortBy] = useState<SortBy>("ranking");

  const sortedCities = [...cities].sort((a, b) => {
    switch (sortBy) {
      case "ranking":
        return b.avgRating - a.avgRating;
      case "name":
        return a.name.localeCompare(b.name);
      case "visitCount":
        return b.visitCount - a.visitCount;
      case "lastVisited":
        return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime();
    }
  });

  if (error) {
    return (
      <Container className="py-8 lg:py-10">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Cities</h1>
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-sm text-destructive">
            Could not load cities. Please try refreshing.
          </p>
        </div>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-8 lg:py-10">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Cities</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      </Container>
    );
  }

  if (cities.length === 0) {
    return (
      <Container className="py-8 lg:py-10">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Cities</h1>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-medium text-foreground">No cities yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add some visits to see your cities here!
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 lg:py-10">
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Cities</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {cities.length} {cities.length === 1 ? "city" : "cities"}, ranked by your rating
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {([
            ["ranking", "Ranking"],
            ["name", "Name"],
            ["visitCount", "Visits"],
            ["lastVisited", "Recent"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSortBy(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedCities.map((city, index) => (
          <Link
            key={city.id}
            href={`/cities/${city.id}`}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-muted"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {sortBy === "ranking" && (
                  <span className="text-sm font-bold text-muted-foreground">
                    {index + 1}.
                  </span>
                )}
                <div>
                <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {city.name}
                </h2>
                <p className="text-sm text-muted-foreground">{city.country}</p>
                </div>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
                style={{
                  backgroundColor: `${ratingToColor(city.avgRating)}20`,
                  color: ratingToColor(city.avgRating),
                }}
              >
                {ratingToDisplay(city.avgRating)}
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{city.visitCount}</span>{" "}
                {city.visitCount === 1 ? "visit" : "visits"}
              </span>
              <span>
                <span className="font-medium text-foreground">{city.totalDays}</span>{" "}
                {city.totalDays === 1 ? "day" : "days"}
              </span>
              <span>
                Last{" "}
                {new Date(city.lastVisited).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
