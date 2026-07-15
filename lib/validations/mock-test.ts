import { z } from "zod";

export const mockTestSchema = z.object({
  name: z.string().trim().min(1, "Test name is required"),
  taken_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  listening_score: z.coerce.number().int().min(5).max(495),
  reading_score: z.coerce.number().int().min(5).max(495),
  notes: z.string().trim().optional().transform((value) => value || null),
});

export type MockTestFormValues = z.input<typeof mockTestSchema>;
