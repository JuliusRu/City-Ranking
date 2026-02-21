import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { updateVisitSchema } from "@/lib/validators/visit";
import { RATE_LIMITS } from "@/config/constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/visits/[id]"),
    RATE_LIMITS.READ
  );
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await context.params;
    const userId = getCurrentUserId();

    const visit = await prisma.visit.findFirst({
      where: { id, userId },
      include: { city: true },
    });

    if (!visit) return apiNotFound("Visit");
    return apiSuccess(visit);
  } catch (error) {
    console.error("GET /api/visits/[id] error:", error);
    return apiError("Failed to fetch visit");
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/visits/[id]:PUT"),
    RATE_LIMITS.UPDATE
  );
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await context.params;
    const userId = getCurrentUserId();
    const body = await request.json();

    const parsed = updateVisitSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const existing = await prisma.visit.findFirst({
      where: { id, userId },
    });
    if (!existing) return apiNotFound("Visit");

    const visit = await prisma.visit.update({
      where: { id },
      data: parsed.data,
      include: { city: true },
    });

    return apiSuccess(visit);
  } catch (error) {
    console.error("PUT /api/visits/[id] error:", error);
    return apiError("Failed to update visit");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/visits/[id]:DELETE"),
    RATE_LIMITS.DELETE
  );
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await context.params;
    const userId = getCurrentUserId();

    const existing = await prisma.visit.findFirst({
      where: { id, userId },
    });
    if (!existing) return apiNotFound("Visit");

    await prisma.visit.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/visits/[id] error:", error);
    return apiError("Failed to delete visit");
  }
}
