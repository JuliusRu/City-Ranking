import { NextRequest } from "next/server";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiRateLimited,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { citySearchSchema } from "@/lib/validators/city";
import { searchCities } from "@/lib/geocoding";
import { RATE_LIMITS } from "@/config/constants";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/cities/search"),
    RATE_LIMITS.SEARCH
  );
  if (!allowed) return apiRateLimited();

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = citySearchSchema.safeParse(searchParams);
    if (!parsed.success) return apiValidationError(parsed.error);

    const results = await searchCities(parsed.data.q);

    return apiSuccess(results);
  } catch (error) {
    console.error("GET /api/cities/search error:", error);
    return apiError("Failed to search cities");
  }
}
