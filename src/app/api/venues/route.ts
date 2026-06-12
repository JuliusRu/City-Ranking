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
import { createVenueSchema, venueQuerySchema } from "@/lib/validators/venue";
import { RATE_LIMITS } from "@/config/constants";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/venues"), RATE_LIMITS.READ);
  if (!allowed) return apiRateLimited();

  try {
    const parsed = venueQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    if (!parsed.success) return apiValidationError(parsed.error);

    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const { type, sortBy, sortOrder } = parsed.data;
    const venues = await prisma.venue.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { [sortBy]: sortOrder },
    });

    return apiSuccess(venues);
  } catch (error) {
    console.error("GET /api/venues error:", error);
    return apiError("Failed to fetch venues");
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/venues:POST"), RATE_LIMITS.CREATE);
  if (!allowed) return apiRateLimited();

  try {
    const parsed = createVenueSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const venue = await prisma.venue.create({
      data: { userId, ...parsed.data },
    });

    return apiSuccess(venue, 201);
  } catch (error) {
    console.error("POST /api/venues error:", error);
    return apiError("Failed to create venue");
  }
}
