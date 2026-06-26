import { z } from "zod";
import { RESERVED_USERNAMES, ACCENT_COLORS } from "@/config/constants";

// 3–20 chars, lowercase letters/digits/underscore. Lowercased before validation
// so the unique index (case-sensitive in Postgres) never collides on case and
// the /@handle URL is always canonical.
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-z0-9_]+$/,
    "Use only lowercase letters, numbers, and underscores"
  )
  .refine((u) => !RESERVED_USERNAMES.has(u), "That username is reserved");

export const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
  username: usernameSchema.optional(),
  bio: z.string().max(280).nullable().optional(),
  publicProfile: z.boolean().optional(),
  avatarUrl: z.string().url().max(2000).nullable().optional(),
  // Pro-only cosmetic. Constrained to the preset palette (or null to reset) so a
  // client can never store an arbitrary value; the API additionally enforces
  // that only Pro users may set a non-null colour.
  accentColor: z.enum(ACCENT_COLORS).nullable().optional(),
  // Onboarding sentinel: the client sends `onboarded: true` when finishing or
  // skipping the first-run flow. The route translates it to onboardedAt = now;
  // the column itself is never set directly by the client.
  onboarded: z.literal(true).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
