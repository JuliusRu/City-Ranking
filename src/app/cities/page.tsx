"use client";

import Link from "next/link";
import { useCityOverviews } from "@/hooks/useCities";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";

export default function CitiesPage() {
  const { cities, isLoading, error } = useCityOverviews();

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Cities</h1>
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-sm text-destructive">
            Could not load cities. Please try refreshing.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Cities</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Cities</h1>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-medium text-foreground">No cities yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add some visits to see your cities here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Cities</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.id}
            href={`/cities/${city.id}`}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-muted"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {city.name}
                </h2>
                <p className="text-sm text-muted-foreground">{city.country}</p>
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
    </div>
  );
}
