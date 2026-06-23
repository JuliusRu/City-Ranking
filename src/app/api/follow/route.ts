import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiRateLimited,
  apiUnauthorized,
  apiNotFound,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { followSchema } from "@/lib/validators/feed";
import { RATE_LIMITS } from "@/config/constants";

// Resolve the followee's user id from a username, guarding the self-follow and
// "no such public user" cases. Returns the target id or an error Response.
async function resolveTarget(username: string, viewerId: string) {
  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true, publicProfile: true },
  });
  if (!target || !target.publicProfile) return { error: apiNotFound("User") };
  if (target.id === viewerId)
    return { error: apiError("You can't follow yourself", 400) };
  return { id: target.id };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/follow"), RATE_LIMITS.CREATE);
  if (!allowed) return apiRateLimited();

  try {
    const parsed = followSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const viewerId = await getCurrentUserId();
    if (!viewerId) return apiUnauthorized();

    const target = await resolveTarget(parsed.data.username, viewerId);
    if ("error" in target) return target.error;

    // Idempotent: upsert means double-follow is a no-op, not a 500.
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: target.id,
        },
      },
      update: {},
      create: { followerId: viewerId, followingId: target.id },
    });

    return apiSuccess({ following: true });
  } catch (error) {
    console.error("POST /api/follow error:", error);
    return apiError("Failed to follow");
  }
}

export async function DELETE(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/follow:DELETE"), RATE_LIMITS.DELETE);
  if (!allowed) return apiRateLimited();

  try {
    const parsed = followSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const viewerId = await getCurrentUserId();
    if (!viewerId) return apiUnauthorized();

    const target = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: { id: true },
    });
    if (!target) return apiNotFound("User");

    // deleteMany (not delete) so unfollowing when not following is a no-op.
    await prisma.follow.deleteMany({
      where: { followerId: viewerId, followingId: target.id },
    });

    return apiSuccess({ following: false });
  } catch (error) {
    console.error("DELETE /api/follow error:", error);
    return apiError("Failed to unfollow");
  }
}
