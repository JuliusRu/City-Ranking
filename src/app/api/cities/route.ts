import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiRateLimited,
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
      const userId = getCurrentUserId();
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
