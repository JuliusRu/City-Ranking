import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import {
  apiSuccess,
  apiError,
  apiRateLimited,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { RATE_LIMITS } from "@/config/constants";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/comments:DELETE"), RATE_LIMITS.DELETE);
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await params;
    const viewerId = await getCurrentUserId();
    if (!viewerId) return apiUnauthorized();

    // Author-only: scope the delete to (id, userId) so one user can't delete
    // another's comment. deleteMany returns a count, so a miss is a clean 404.
    const result = await prisma.visitComment.deleteMany({
      where: { id, userId: viewerId },
    });
    if (result.count === 0) return apiNotFound("Comment");

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/comments/[id] error:", error);
    return apiError("Failed to delete comment");
  }
}
