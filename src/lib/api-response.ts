import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function apiValidationError(error: ZodError) {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return NextResponse.json(
    { success: false, error: "Validation failed", issues },
    { status: 400 }
  );
}

export function apiNotFound(entity = "Resource") {
  return apiError(`${entity} not found`, 404);
}

export function apiRateLimited() {
  return apiError("Too many requests", 429);
}
