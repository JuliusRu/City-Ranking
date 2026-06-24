import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiRateLimited,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { searchQuerySchema } from "@/lib/validators/search";
import { RATE_LIMITS } from "@/config/constants";
import type { SearchResults } from "@/types";

// Unified search over public people and rated cities. Public data only — the
// user select is an explicit whitelist (no email/authId), and cities are limited
// to those with at least one public visit.
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/search"), RATE_LIMITS.SEARCH);
  if (!allowed) return apiRateLimited();

  try {
    const parsed = searchQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    if (!parsed.success) return apiValidationError(parsed.error);

    const q = parsed.data.q;

    const [users, cityRows] = await Promise.all([
      prisma.user.findMany({
        where: {
          publicProfile: true,
          username: { not: null },
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        orderBy: { username: "asc" },
        select: { username: true, name: true, avatarUrl: true },
      }),
      prisma.city.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
          visits: { some: { user: { publicProfile: true } } },
        },
        take: 8,
        select: {
          id: true,
          name: true,
          country: true,
          // Only public visits feed the community rating.
          visits: {
            where: { user: { publicProfile: true } },
            select: { rating: true, userId: true },
          },
        },
      }),
    ]);

    const cities = cityRows
      .map((c) => {
        const ratings = c.visits.map((v) => v.rating);
        const raters = new Set(c.visits.map((v) => v.userId)).size;
        const avgRating = ratings.length
          ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
          : 0;
        return { id: c.id, name: c.name, country: c.country, avgRating, raters };
      })
      // Most-rated cities first — the more relevant discovery targets.
      .sort((a, b) => b.raters - a.raters || b.avgRating - a.avgRating);

    const results: SearchResults = {
      users: users
        .filter((u) => u.username)
        .map((u) => ({
          username: u.username as string,
          name: u.name,
          avatarUrl: u.avatarUrl,
        })),
      cities,
    };

    return apiSuccess(results);
  } catch (error) {
    console.error("GET /api/search error:", error);
    return apiError("Search failed");
  }
}
