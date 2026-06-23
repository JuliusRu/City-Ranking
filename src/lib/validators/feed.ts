import { z } from "zod";
import { usernameSchema } from "@/lib/validators/user";

export const feedQuerySchema = z.object({
  scope: z.enum(["global", "following"]).default("global"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

// Follow/unfollow target. Reuses the username rules so casing/format is
// validated identically to where usernames are created.
export const followSchema = z.object({
  username: usernameSchema,
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;
