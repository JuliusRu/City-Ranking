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
import { createVisitSchema, visitQuerySchema } from "@/lib/validators/visit";
import { RATE_LIMITS } from "@/config/constants";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/visits"),
    RATE_LIMITS.READ
  );
  if (!allowed) return apiRateLimited();

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = visitQuerySchema.safeParse(searchParams);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { page, limit, sortBy, sortOrder, cityId } = parsed.data;
    const userId = getCurrentUserId();

    const where = {
      userId,
      ...(cityId ? { cityId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: { city: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.visit.count({ where }),
    ]);

    return apiSuccess({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/visits error:", error);
    return apiError("Failed to fetch visits");
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/visits:POST"),
    RATE_LIMITS.CREATE
  );
  if (!allowed) return apiRateLimited();

  try {
    const body = await request.json();
    const parsed = createVisitSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const userId = getCurrentUserId();
    const { cityId, rating, comment, startDate, endDate, tripType, budgetLevel, wouldReturn, highlights, transport } = parsed.data;

    // Verify city exists
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) return apiError("City not found", 404);

    const visit = await prisma.visit.create({
      data: {
        userId,
        cityId,
        rating,
        comment,
        startDate,
        endDate: endDate ?? null,
        tripType: tripType ?? null,
        budgetLevel: budgetLevel ?? null,
        wouldReturn: wouldReturn ?? null,
        highlights: highlights ?? null,
        transport: transport ?? null,
      },
      include: { city: true },
    });

    return apiSuccess(visit, 201);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return apiError("A visit for this city on this date already exists", 409);
    }
    console.error("POST /api/visits error:", error);
    return apiError("Failed to create visit");
  }
}
