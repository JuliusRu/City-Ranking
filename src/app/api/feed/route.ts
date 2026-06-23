import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getFeed } from "@/lib/feed";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiRateLimited,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { feedQuerySchema } from "@/lib/validators/feed";
import { RATE_LIMITS } from "@/config/constants";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/feed"), RATE_LIMITS.READ);
  if (!allowed) return apiRateLimited();

  try {
    const parsed = feedQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    if (!parsed.success) return apiValidationError(parsed.error);

    // Viewer may be null — the global feed is readable logged-out; "following"
    // simply returns empty without a viewer.
    const viewerId = await getCurrentUserId();

    const page = await getFeed({
      viewerId,
      scope: parsed.data.scope,
      cursor: parsed.data.cursor ?? null,
      limit: parsed.data.limit,
    });

    return apiSuccess(page);
  } catch (error) {
    console.error("GET /api/feed error:", error);
    return apiError("Failed to load feed");
  }
}
