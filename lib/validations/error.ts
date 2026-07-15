import { z } from "zod";
import { captureReasons, errorTypes, sections } from "@/lib/constants";

const optionalText = z.string().trim().optional().transform((value) => value || null);
const optionalPositiveInteger = z.union([z.coerce.number().int().positive(), z.literal("")]).optional().transform((value) => value === "" || value === undefined ? null : value);

export const errorSchema = z.object({
  section: z.enum(sections),
  capture_reason: z.enum(captureReasons),
  error_types: z.array(z.enum(errorTypes)).min(1, "Choose at least one error type"),
  question_text: z.string().trim().min(1, "Question or cue is required"),
  context_excerpt: optionalText,
  question_number: optionalPositiveInteger.refine((value) => value === null || value <= 200, "Question number must be at most 200"),
  option_a: optionalText,
  option_b: optionalText,
  option_c: optionalText,
  option_d: optionalText,
  my_answer: optionalText,
  correct_answer: optionalText,
  explanation: optionalText,
  time_spent_seconds: optionalPositiveInteger,
  source_name: optionalText,
  source_reference: optionalText,
  mock_test_id: optionalText,
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ErrorFormValues = z.input<typeof errorSchema>;
export type ParsedErrorFormValues = z.output<typeof errorSchema>;
