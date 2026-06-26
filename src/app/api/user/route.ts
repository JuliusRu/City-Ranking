import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { apiSuccess, apiError, apiNotFound, apiValidationError, apiUnauthorized } from "@/lib/api-response";
import { updateUserSchema } from "@/lib/validators/user";
import { ZodError } from "zod";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user) {
      return apiNotFound("User");
    }

    return apiSuccess(user);
  } catch (error) {
    console.error("GET /api/user error:", error);
    return apiError("Failed to fetch user");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();
    const body = await request.json();
    const { onboarded, ...data } = updateUserSchema.parse(body);

    // Accent colour is a Pro perk — never let a non-Pro account persist one
    // (the UI hides the picker, but the API is the real trust boundary).
    if (data.accentColor != null) {
      const me = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true },
      });
      if (!me?.isPro) {
        return apiError("Accent colour is a Pro feature", 403);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      // `onboarded: true` is a sentinel — stamp the completion time server-side
      // rather than trusting a client-supplied timestamp.
      data: onboarded ? { ...data, onboardedAt: new Date() } : data,
      include: { settings: true },
    });

    return apiSuccess(user);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError(error);
    }
    // P2002 = unique-constraint violation. The only user-settable unique field
    // here is `username`, so surface a friendly 409 instead of a generic 500.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("That username is already taken", 409);
    }
    console.error("PATCH /api/user error:", error);
    return apiError("Failed to update user");
  }
}
