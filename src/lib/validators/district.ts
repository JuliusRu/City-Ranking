import { z } from "zod";

export const DISTRICT_FREQUENCIES = [
  "PASSED_THROUGH",
  "FEW_TIMES",
  "A_LOT",
  "BASED_HERE",
] as const;

// One district entry on a visit: its catalog data (upserted server-side into the
// city's district catalog) plus the two independent dimensions — rating (appeal)
// and frequency (how much time was spent there).
export const visitDistrictInputSchema = z.object({
  name: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  externalId: z.string().max(200).optional().nullable(),
  rating: z.number().int().min(0).max(100),
  frequency: z.enum(DISTRICT_FREQUENCIES).default("FEW_TIMES"),
});

export const districtSearchSchema = z.object({
  q: z.string().min(1).max(200),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type VisitDistrictInput = z.infer<typeof visitDistrictInputSchema>;
export type DistrictSearchQuery = z.infer<typeof districtSearchSchema>;
