import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "Type something to search").max(80),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
