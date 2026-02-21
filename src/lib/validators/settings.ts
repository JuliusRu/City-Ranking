import { z } from "zod";

export const updateSettingsSchema = z.object({
  theme: z.enum(["dark", "light"]).optional(),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
  defaultSortBy: z.enum(["createdAt", "startDate", "rating"]).optional(),
  defaultSortOrder: z.enum(["asc", "desc"]).optional(),
  homeCurrency: z.enum(["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF"]).optional(),
  distanceUnit: z.enum(["km", "mi"]).optional(),
  defaultTripType: z
    .enum(["solo", "couple", "family", "friends", "business"])
    .optional()
    .nullable(),
  defaultBudget: z
    .enum(["budget", "moderate", "expensive", "luxury"])
    .optional()
    .nullable(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
