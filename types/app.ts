import type { Database } from "@/types/database";

export type Question = Database["public"]["Tables"]["questions"]["Row"];
export type Rule = Database["public"]["Tables"]["rules"]["Row"];
export type QuestionRule = Database["public"]["Tables"]["question_rules"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type MockTest = Database["public"]["Tables"]["mock_tests"]["Row"];

export type QuestionWithRules = Question & { rules: Rule[]; mockTest?: MockTest | null };
export type RuleWithStats = Rule & {
  questions: Question[];
  reviewCount: number;
  repeatedAfterReview: boolean;
};
