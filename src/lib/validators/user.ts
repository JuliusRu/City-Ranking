import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
