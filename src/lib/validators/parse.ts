import { z } from "zod";

export const parseVisitInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(3, "Please write a bit more")
    .max(4000, "That's a lot — keep it under 4000 characters"),
});

export type ParseVisitInput = z.infer<typeof parseVisitInputSchema>;
