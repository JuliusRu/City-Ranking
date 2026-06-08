import { NextRequest } from "next/server";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiRateLimited,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { districtSearchSchema } from "@/lib/validators/district";
import { searchDistricts } from "@/lib/geocoding";
import { RATE_LIMITS } from "@/config/constants";

// GET /api/districts/search?q=...&lat=...&lng=...
// Geocode districts/neighbourhoods near a city (lat/lng bias the search). Returns
// candidates only — they're persisted into the catalog when the visit is saved.
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(
    getRateLimitKey(ip, "/api/districts/search"),
    RATE_LIMITS.SEARCH
  );
  if (!allowed) return apiRateLimited();

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = districtSearchSchema.safeParse(searchParams);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { q, lat, lng } = parsed.data;
    const results = await searchDistricts(q, { latitude: lat, longitude: lng });
    return apiSuccess(results);
  } catch (error) {
    console.error("GET /api/districts/search error:", error);
    return apiError("Failed to search districts");
  }
}
