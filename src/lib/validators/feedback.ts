import { z } from "zod";

export const createFeedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(3, "Please write a little more")
    .max(4000, "Keep it under 4000 characters"),
  // Optional contact address if the sender wants a reply.
  email: z.string().email().max(200).optional().or(z.literal("")),
  // The page the widget was opened from, for context.
  path: z.string().max(500).optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
