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
import { createCommentSchema } from "@/lib/validators/comment";
import { RATE_LIMITS } from "@/config/constants";
import type { CommentData } from "@/types";

// Only comments on a public visit are readable/writable — same gate as likes.
async function getPublicVisit(visitId: string) {
  return prisma.visit.findFirst({
    where: { id: visitId, user: { publicProfile: true } },
    select: { id: true },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/comments"), RATE_LIMITS.READ);
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await params;
    if (!(await getPublicVisit(id))) return apiNotFound("Visit");

    // Viewer is optional — used only to flag which comments they can delete.
    const viewerId = await getCurrentUserId();

    const rows = await prisma.visitComment.findMany({
      where: { visitId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true, avatarUrl: true } },
      },
    });

    const comments: CommentData[] = rows
      .filter((c) => c.user.username)
      .map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: {
          username: c.user.username as string,
          name: c.user.name,
          avatarUrl: c.user.avatarUrl,
        },
        isOwn: viewerId === c.userId,
      }));

    return apiSuccess(comments);
  } catch (error) {
    console.error("GET /api/visits/[id]/comments error:", error);
    return apiError("Failed to load comments");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/comments:POST"), RATE_LIMITS.CREATE);
  if (!allowed) return apiRateLimited();

  try {
    const { id } = await params;
    const parsed = createCommentSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const viewerId = await getCurrentUserId();
    if (!viewerId) return apiUnauthorized();

    if (!(await getPublicVisit(id))) return apiNotFound("Visit");

    const created = await prisma.visitComment.create({
      data: { visitId: id, userId: viewerId, body: parsed.data.body },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: { select: { username: true, name: true, avatarUrl: true } },
      },
    });

    const comment: CommentData = {
      id: created.id,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      author: {
        username: created.user.username as string,
        name: created.user.name,
        avatarUrl: created.user.avatarUrl,
      },
      isOwn: true,
    };

    return apiSuccess(comment, 201);
  } catch (error) {
    console.error("POST /api/visits/[id]/comments error:", error);
    return apiError("Failed to post comment");
  }
}
