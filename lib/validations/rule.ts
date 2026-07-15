import { z } from "zod";

export const ruleSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  rule_text: z.string().trim().min(1, "Rule is required"),
  keywords: z.string().trim().optional().transform((value) => value ? value.split(",").map((item) => item.trim()).filter(Boolean) : []),
});

export type RuleFormValues = z.input<typeof ruleSchema>;
