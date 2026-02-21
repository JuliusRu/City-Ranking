import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { apiSuccess, apiError, apiNotFound, apiValidationError } from "@/lib/api-response";
import { updateUserSchema } from "@/lib/validators/user";
import { ZodError } from "zod";

export async function GET() {
  try {
    const userId = getCurrentUserId();

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
    const userId = getCurrentUserId();
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: { settings: true },
    });

    return apiSuccess(user);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError(error);
    }
    console.error("PATCH /api/user error:", error);
    return apiError("Failed to update user");
  }
}
