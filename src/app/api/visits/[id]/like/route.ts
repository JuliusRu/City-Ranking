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

// Confirm the visit exists and its author is public — you can only like ratings
// that are actually shared in the feed. Returns the visit id or an error.
async function assertLikeable(visitId: string) {
  const visit = await prisma.visit.findFirst({
    where: { id: visitId, user: { publicProfile: true } },
    select: { id: true },
  });
  return visit?.id ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/like"), RATE_LIMITS.CREATE);
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await params;
    const viewerId = await getCurrentUserId();
    if (!viewerId) return apiUnauthorized();

    if (!(await assertLikeable(id))) return apiNotFound("Visit");

    await prisma.visitLike.upsert({
      where: { userId_visitId: { userId: viewerId, visitId: id } },
      update: {},
      create: { userId: viewerId, visitId: id },
    });

    const likeCount = await prisma.visitLike.count({ where: { visitId: id } });
    return apiSuccess({ liked: true, likeCount });
  } catch (error) {
    console.error("POST /api/visits/[id]/like error:", error);
    return apiError("Failed to like");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/like:DELETE"), RATE_LIMITS.DELETE);
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await params;
    const viewerId = await getCurrentUserId();
    if (!viewerId) return apiUnauthorized();

    await prisma.visitLike.deleteMany({
      where: { userId: viewerId, visitId: id },
    });

    const likeCount = await prisma.visitLike.count({ where: { visitId: id } });
    return apiSuccess({ liked: false, likeCount });
  } catch (error) {
    console.error("DELETE /api/visits/[id]/like error:", error);
    return apiError("Failed to unlike");
  }
}
