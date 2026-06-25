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
import { createFeedbackSchema } from "@/lib/validators/feedback";
import { RATE_LIMITS } from "@/config/constants";

// Beta feedback intake. Anonymous-friendly (works even if somehow logged out),
// but when a session exists we snapshot username/email so we know who wrote it.
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/feedback"), RATE_LIMITS.CREATE);
  if (!allowed) return apiRateLimited();

  try {
    const parsed = createFeedbackSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const userId = await getCurrentUserId();
    let username: string | null = null;
    let email: string | null = parsed.data.email?.trim() || null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, email: true },
      });
      username = user?.username ?? null;
      // Fall back to the account email if the sender didn't type one.
      email = email ?? user?.email ?? null;
    }

    await prisma.feedback.create({
      data: {
        userId: userId ?? null,
        username,
        email,
        message: parsed.data.message,
        path: parsed.data.path ?? null,
      },
    });

    return apiSuccess({ ok: true }, 201);
  } catch (error) {
    console.error("POST /api/feedback error:", error);
    return apiError("Failed to send feedback");
  }
}
