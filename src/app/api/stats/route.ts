import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { apiSuccess, apiError, apiRateLimited } from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { RATE_LIMITS } from "@/config/constants";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/stats"),
    RATE_LIMITS.READ
  );
  if (!allowed) return apiRateLimited();

  try {
    const userId = getCurrentUserId();

    const visits = await prisma.visit.findMany({
      where: { userId },
      include: { city: true },
    });

    if (visits.length === 0) {
      return apiSuccess({
        totalCities: 0,
        totalCountries: 0,
        totalTrips: 0,
        totalDays: 0,
        avgRating: 0,
        ratingDistribution: [],
        topRatedCities: [],
        visitsByYear: [],
        tripTypeBreakdown: [],
        budgetBreakdown: [],
        mostVisitedCities: [],
      });
    }

    // Unique cities and countries
    const citySet = new Set(visits.map((v) => v.cityId));
    const countrySet = new Set(visits.map((v) => v.city.country));

    // Total days
    const totalDays = visits.reduce((sum, v) => {
      if (!v.endDate) return sum + 1;
      const diff = Math.ceil(
        (v.endDate.getTime() - v.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + Math.max(diff, 1);
    }, 0);

    // Average rating
    const avgRating =
      Math.round(
        (visits.reduce((sum, v) => sum + v.rating, 0) / visits.length) * 10
      ) / 10;

    // Rating distribution (5 buckets: 0-20, 21-40, 41-60, 61-80, 81-100)
    const buckets = ["0-20", "21-40", "41-60", "61-80", "81-100"];
    const ratingDistribution = buckets.map((bucket) => {
      const [min, max] = bucket.split("-").map(Number);
      const count = visits.filter(
        (v) => v.rating >= min && v.rating <= max
      ).length;
      return { bucket, count };
    });

    // Top rated cities (aggregate by city)
    const cityRatings = new Map<
      string,
      { name: string; country: string; ratings: number[] }
    >();
    for (const v of visits) {
      const existing = cityRatings.get(v.cityId);
      if (existing) {
        existing.ratings.push(v.rating);
      } else {
        cityRatings.set(v.cityId, {
          name: v.city.name,
          country: v.city.country,
          ratings: [v.rating],
        });
      }
    }
    const topRatedCities = Array.from(cityRatings.values())
      .map((c) => ({
        name: c.name,
        country: c.country,
        avgRating:
          Math.round(
            (c.ratings.reduce((s, r) => s + r, 0) / c.ratings.length) * 10
          ) / 10,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);

    // Visits by year
    const yearCounts = new Map<number, number>();
    for (const v of visits) {
      const year = v.startDate.getFullYear();
      yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
    }
    const visitsByYear = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    // Trip type breakdown
    const typeCounts = new Map<string, number>();
    for (const v of visits) {
      if (v.tripType) {
        typeCounts.set(v.tripType, (typeCounts.get(v.tripType) ?? 0) + 1);
      }
    }
    const tripTypeBreakdown = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Budget breakdown
    const budgetCounts = new Map<string, number>();
    for (const v of visits) {
      if (v.budgetLevel) {
        budgetCounts.set(
          v.budgetLevel,
          (budgetCounts.get(v.budgetLevel) ?? 0) + 1
        );
      }
    }
    const budgetBreakdown = Array.from(budgetCounts.entries())
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count);

    // Most visited cities
    const cityCounts = new Map<
      string,
      { name: string; country: string; count: number }
    >();
    for (const v of visits) {
      const existing = cityCounts.get(v.cityId);
      if (existing) {
        existing.count++;
      } else {
        cityCounts.set(v.cityId, {
          name: v.city.name,
          country: v.city.country,
          count: 1,
        });
      }
    }
    const mostVisitedCities = Array.from(cityCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return apiSuccess({
      totalCities: citySet.size,
      totalCountries: countrySet.size,
      totalTrips: visits.length,
      totalDays,
      avgRating,
      ratingDistribution,
      topRatedCities,
      visitsByYear,
      tripTypeBreakdown,
      budgetBreakdown,
      mostVisitedCities,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return apiError("Failed to fetch stats");
  }
}
