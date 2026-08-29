import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiRateLimited,
  apiUnauthorized,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { createCitySchema } from "@/lib/validators/city";
import { RATE_LIMITS } from "@/config/constants";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/cities"),
    RATE_LIMITS.READ
  );
  if (!allowed) return apiRateLimited();

  try {
    const withStats = request.nextUrl.searchParams.get("withStats") === "true";

    if (withStats) {
      const userId = await getCurrentUserId();
      if (!userId) return apiUnauthorized();
      const cities = await prisma.city.findMany({
        where: { visits: { some: { userId } } },
        include: {
          visits: {
            where: { userId },
            select: { rating: true, startDate: true, endDate: true },
          },
        },
        orderBy: { name: "asc" },
      });

      const overviews = cities.map((city) => {
        const visits = city.visits;
        const avgRating = visits.length > 0
          ? Math.round(visits.reduce((sum, v) => sum + v.rating, 0) / visits.length)
          : 0;
        const totalDays = visits.reduce((sum, v) => {
          if (!v.endDate) return sum + 1;
          const diff = Math.ceil(
            (v.endDate.getTime() - v.startDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + Math.max(diff, 1);
        }, 0);
        const lastVisited = visits.length > 0
          ? visits.reduce((latest, v) =>
              v.startDate > latest ? v.startDate : latest,
            visits[0].startDate
          ).toISOString()
          : "";

        return {
          id: city.id,
          name: city.name,
          country: city.country,
          visitCount: visits.length,
          avgRating,
          totalDays,
          lastVisited,
        };
      });

      return apiSuccess(overviews);
    }

    const cities = await prisma.city.findMany({
      include: {
        _count: { select: { visits: true } },
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess(cities);
  } catch (error) {
    console.error("GET /api/cities error:", error);
    return apiError("Failed to fetch cities");
  }
}

// Rough great-circle distance in km. Used only to tell "the same city, geocoded
// twice" apart from "two different places that share a name".
function distanceKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Two geocodes of the same city differ in coordinate precision (Dubai came back
// as 25.2/55.27 once and 25.0742823/55.1885624 another time). Anything within
// this radius of an existing same-named city in the same country is treated as
// that city rather than a new one; genuinely distinct places sharing a name
// (the many US Springfields) sit far outside it.
const SAME_CITY_RADIUS_KM = 100;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/cities:POST"),
    RATE_LIMITS.CREATE
  );
  if (!allowed) return apiRateLimited();

  try {
    const body = await request.json();
    const parsed = createCitySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    // Writing to the shared city catalogue requires a session, like every other
    // write endpoint. Without this, anyone could add rows anonymously.
    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const { name, country, latitude, longitude, externalId, population } =
      parsed.data;

    // Find-or-create. The unique key is [name, country, latitude, longitude], so
    // matching on it alone lets a re-geocode of a known city create a duplicate
    // row — which then splits that city's stats, community rating and (when the
    // new row has no population) its million-city status.
    const candidates = await prisma.city.findMany({
      where: {
        OR: [
          ...(externalId ? [{ externalId }] : []),
          {
            name: { equals: name, mode: "insensitive" as const },
            country: { equals: country, mode: "insensitive" as const },
          },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    const existing =
      candidates.find((c) => externalId && c.externalId === externalId) ??
      candidates.find(
        (c) =>
          distanceKm(c.latitude, c.longitude, latitude, longitude) <=
          SAME_CITY_RADIUS_KM
      );

    if (existing) {
      // Fill in what this geocode knows and the stored row doesn't. Population
      // drives the million-city badge; externalId makes the next match exact.
      const patch: { population?: number; externalId?: string } = {};
      if (existing.population == null && population != null) {
        patch.population = population;
      }
      if (!existing.externalId && externalId) {
        patch.externalId = externalId;
      }
      const city =
        Object.keys(patch).length > 0
          ? await prisma.city.update({ where: { id: existing.id }, data: patch })
          : existing;
      return apiSuccess(city, 200);
    }

    const city = await prisma.city.create({
      data: parsed.data,
    });

    return apiSuccess(city, 201);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return apiError("This city already exists", 409);
    }
    console.error("POST /api/cities error:", error);
    return apiError("Failed to create city");
  }
}
