import { z } from "zod";

export const createCitySchema = z.object({
  name: z.string().min(1).max(200),
  country: z.string().min(1).max(200),
  state: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().max(100).optional(),
  population: z.number().int().min(0).optional(),
  externalId: z.string().max(200).optional(),
});

export const updateCitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  country: z.string().min(1).max(200).optional(),
  state: z.string().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timezone: z.string().max(100).optional().nullable(),
  population: z.number().int().min(0).optional().nullable(),
  externalId: z.string().max(200).optional().nullable(),
});

export const citySearchSchema = z.object({
  q: z.string().min(1).max(200),
});

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
