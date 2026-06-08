import { z } from "zod";
import { RESERVED_USERNAMES } from "@/config/constants";

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
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
