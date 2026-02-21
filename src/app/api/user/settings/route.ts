import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { apiSuccess, apiError, apiValidationError } from "@/lib/api-response";
import { updateSettingsSchema } from "@/lib/validators/settings";
import { ZodError } from "zod";

export async function GET() {
  try {
    const userId = getCurrentUserId();

    // Upsert: return existing or create defaults
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return apiSuccess(settings);
  } catch (error) {
    console.error("GET /api/user/settings error:", error);
    return apiError("Failed to fetch settings");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json();
    const data = updateSettingsSchema.parse(body);

    // Upsert: update existing or create with provided values
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return apiSuccess(settings);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError(error);
    }
    console.error("PATCH /api/user/settings error:", error);
    return apiError("Failed to update settings");
  }
}
