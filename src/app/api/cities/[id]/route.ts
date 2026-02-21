import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { updateCitySchema } from "@/lib/validators/city";
import { RATE_LIMITS } from "@/config/constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/cities/[id]"),
    RATE_LIMITS.READ
  );
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await context.params;

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!city) return apiNotFound("City");
    return apiSuccess(city);
  } catch (error) {
    console.error("GET /api/cities/[id] error:", error);
    return apiError("Failed to fetch city");
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/cities/[id]:PUT"),
    RATE_LIMITS.UPDATE
  );
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await context.params;
    const body = await request.json();

    const parsed = updateCitySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const existing = await prisma.city.findUnique({ where: { id } });
    if (!existing) return apiNotFound("City");

    const city = await prisma.city.update({
      where: { id },
      data: parsed.data,
    });

    return apiSuccess(city);
  } catch (error) {
    console.error("PUT /api/cities/[id] error:", error);
    return apiError("Failed to update city");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/cities/[id]:DELETE"),
    RATE_LIMITS.DELETE
  );
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await context.params;

    const existing = await prisma.city.findUnique({ where: { id } });
    if (!existing) return apiNotFound("City");

    await prisma.city.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/cities/[id] error:", error);
    return apiError("Failed to delete city");
  }
}
