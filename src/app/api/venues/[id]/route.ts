import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
  apiUnauthorized,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { updateVenueSchema } from "@/lib/validators/venue";
import { RATE_LIMITS } from "@/config/constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/venues/[id]"), RATE_LIMITS.READ);
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const venue = await prisma.venue.findFirst({ where: { id, userId } });
    if (!venue) return apiNotFound("Venue");
    return apiSuccess(venue);
  } catch (error) {
    console.error("GET /api/venues/[id] error:", error);
    return apiError("Failed to fetch venue");
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/venues/[id]:PUT"), RATE_LIMITS.UPDATE);
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const parsed = updateVenueSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const existing = await prisma.venue.findFirst({ where: { id, userId } });
    if (!existing) return apiNotFound("Venue");

    const venue = await prisma.venue.update({ where: { id }, data: parsed.data });
    return apiSuccess(venue);
  } catch (error) {
    console.error("PUT /api/venues/[id] error:", error);
    return apiError("Failed to update venue");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/venues/[id]:DELETE"), RATE_LIMITS.DELETE);
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const existing = await prisma.venue.findFirst({ where: { id, userId } });
    if (!existing) return apiNotFound("Venue");

    await prisma.venue.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/venues/[id] error:", error);
    return apiError("Failed to delete venue");
  }
}
