import { z } from "zod";

export const createVisitSchema = z
  .object({
    cityId: z.string().cuid(),
    rating: z.number().int().min(0).max(100),
    comment: z.string().max(5000).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    tripType: z.enum(["solo", "couple", "family", "friends", "business"]).optional().nullable(),
    budgetLevel: z.enum(["budget", "moderate", "expensive", "luxury"]).optional().nullable(),
    wouldReturn: z.boolean().optional().nullable(),
    highlights: z.string().max(5000).optional().nullable(),
    transport: z.enum(["flew", "drove", "train", "bus", "cruise", "other"]).optional().nullable(),
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.startDate,
    { message: "End date must be on or after start date", path: ["endDate"] }
  );

export const updateVisitSchema = z
  .object({
    rating: z.number().int().min(0).max(100).optional(),
    comment: z.string().max(5000).optional().nullable(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional().nullable(),
    tripType: z.enum(["solo", "couple", "family", "friends", "business"]).optional().nullable(),
    budgetLevel: z.enum(["budget", "moderate", "expensive", "luxury"]).optional().nullable(),
    wouldReturn: z.boolean().optional().nullable(),
    highlights: z.string().max(5000).optional().nullable(),
    transport: z.enum(["flew", "drove", "train", "bus", "cruise", "other"]).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    { message: "End date must be on or after start date", path: ["endDate"] }
  );

export const visitQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["rating", "startDate", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  cityId: z.string().cuid().optional(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type VisitQuery = z.infer<typeof visitQuerySchema>;
