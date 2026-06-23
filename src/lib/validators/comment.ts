import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment can't be empty").max(500),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
