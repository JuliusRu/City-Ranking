import { z } from "zod";

// Free-text input for the onboarding "from text" mode — a traveller lists the
// cities they've been to in one breath ("Tokyo, Berlin and Lisbon, all great").
// Same shape/limits as the single-visit parser, just a separate name so the two
// routes can evolve independently.
export const parseCitiesInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(3, "Please write a bit more")
    .max(4000, "That's a lot — keep it under 4000 characters"),
});

export type ParseCitiesInput = z.infer<typeof parseCitiesInputSchema>;
