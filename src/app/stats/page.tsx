"use client";

import { useStats } from "@/hooks/useStats";
import { StatCard } from "@/components/stats/StatCard";
import { BarChart } from "@/components/stats/BarChart";
import { DonutChart } from "@/components/stats/DonutChart";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";

export default function StatsPage() {
  const { stats, isLoading, error } = useStats();

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Statistics</h1>
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-sm text-destructive">
            Could not load statistics. Please try refreshing.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Statistics</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (stats.totalTrips === 0) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Statistics</h1>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-medium text-foreground">No data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add some visits to see your travel statistics!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Statistics</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard label="Cities" value={stats.totalCities} />
        <StatCard label="Countries" value={stats.totalCountries} />
        <StatCard label="Trips" value={stats.totalTrips} />
        <StatCard label="Days Traveled" value={stats.totalDays} />
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Avg Rating</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="text-3xl font-bold"
              style={{ color: ratingToColor(stats.avgRating) }}
            >
              {ratingToDisplay(stats.avgRating)}
            </span>
            <span className="text-xs text-muted-foreground">/ 10</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rating distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold text-foreground">Rating Distribution</h2>
          <BarChart
            data={stats.ratingDistribution.map((d) => ({
              label: d.bucket,
              value: d.count,
            }))}
          />
        </div>

        {/* Top rated cities */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold text-foreground">Top Rated Cities</h2>
          <div className="space-y-2">
            {stats.topRatedCities.map((city, i) => (
              <div key={city.name} className="flex items-center gap-3">
                <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
                <span className="flex-1 text-sm text-foreground">
                  {city.name}
                  <span className="ml-1 text-xs text-muted-foreground">
                    {city.country}
                  </span>
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: `${ratingToColor(city.avgRating)}20`,
                    color: ratingToColor(city.avgRating),
                  }}
                >
                  {ratingToDisplay(city.avgRating)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Visits timeline */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold text-foreground">Visits by Year</h2>
          <BarChart
            data={stats.visitsByYear.map((d) => ({
              label: String(d.year),
              value: d.count,
            }))}
            color="#8b5cf6"
          />
        </div>

        {/* Most visited cities */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold text-foreground">Most Visited Cities</h2>
          <BarChart
            data={stats.mostVisitedCities.map((d) => ({
              label: d.name,
              value: d.count,
            }))}
            color="#10b981"
          />
        </div>

        {/* Trip type breakdown */}
        {stats.tripTypeBreakdown.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold text-foreground">Trip Type Breakdown</h2>
            <DonutChart
              data={stats.tripTypeBreakdown.map((d) => ({
                label: d.type,
                value: d.count,
              }))}
            />
          </div>
        )}

        {/* Budget breakdown */}
        {stats.budgetBreakdown.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold text-foreground">Budget Breakdown</h2>
            <DonutChart
              data={stats.budgetBreakdown.map((d) => ({
                label: d.level,
                value: d.count,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
