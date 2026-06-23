import { z } from "zod";

export const VENUE_TYPE_VALUES = [
  "RESTAURANT",
  "CAFE",
  "BAR",
  "BAKERY",
  "CLUB",
  "OTHER",
] as const;

export const createVenueSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(VENUE_TYPE_VALUES).default("RESTAURANT"),
  rating: z.number().int().min(0).max(100),
  location: z.string().max(200).optional().nullable(),
  priceLevel: z.enum(["budget", "moderate", "expensive", "luxury"]).optional().nullable(),
  note: z.string().max(5000).optional().nullable(),
  wouldReturn: z.boolean().optional().nullable(),
  photoUrl: z.string().url().max(2000).optional().nullable(),
});

export const updateVenueSchema = createVenueSchema.partial();

export const venueQuerySchema = z.object({
  type: z.enum(VENUE_TYPE_VALUES).optional(),
  sortBy: z.enum(["rating", "name", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type VenueQuery = z.infer<typeof venueQuerySchema>;
