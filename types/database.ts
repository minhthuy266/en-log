export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Section = "section_1" | "section_2" | "section_3" | "section_4" | "section_5" | "section_6" | "section_7";
type CaptureReason = "wrong" | "guessed_correct" | "too_slow";
type ErrorType = "grammar" | "vocabulary" | "collocation" | "listening_detail" | "listening_inference" | "distractor" | "reading_detail" | "reading_inference" | "paraphrase" | "careless" | "time_management" | "other";

type QuestionRow = {
  id: string; user_id: string; mock_test_id: string | null; section: Section;
  capture_reason: CaptureReason; error_types: ErrorType[]; question_text: string;
  context_excerpt: string | null; question_number: number | null; option_a: string | null;
  option_b: string | null; option_c: string | null; option_d: string | null;
  my_answer: string | null; correct_answer: string | null; explanation: string | null;
  time_spent_seconds: number | null; source_name: string | null; source_reference: string | null;
  occurred_on: string; created_at: string; updated_at: string;
};
type QuestionInsert = {
  id?: string; user_id?: string; mock_test_id?: string | null; section: Section;
  capture_reason: CaptureReason; error_types: ErrorType[]; question_text: string;
  context_excerpt?: string | null; question_number?: number | null; option_a?: string | null;
  option_b?: string | null; option_c?: string | null; option_d?: string | null;
  my_answer?: string | null; correct_answer?: string | null; explanation?: string | null;
  time_spent_seconds?: number | null; source_name?: string | null; source_reference?: string | null;
  occurred_on?: string; created_at?: string; updated_at?: string;
};

type RuleRow = { id: string; user_id: string; title: string; rule_text: string; keywords: string[]; review_step: number; next_review_on: string | null; created_at: string; updated_at: string };
type RuleInsert = { id?: string; user_id?: string; title: string; rule_text: string; keywords?: string[]; review_step?: number; next_review_on?: string | null; created_at?: string; updated_at?: string };
type QuestionRuleRow = { user_id: string; question_id: string; rule_id: string; created_at: string };
type QuestionRuleInsert = { user_id?: string; question_id: string; rule_id: string; created_at?: string };
type ReviewRow = { id: string; user_id: string; rule_id: string; outcome: "remembered" | "forgotten"; step_before: number; step_after: number; next_review_on: string | null; reviewed_at: string };
type ReviewInsert = { id?: string; user_id?: string; rule_id: string; outcome: "remembered" | "forgotten"; step_before: number; step_after: number; next_review_on?: string | null; reviewed_at?: string };
type MockTestRow = { id: string; user_id: string; name: string; taken_on: string; listening_score: number; reading_score: number; total_score: number; notes: string | null; created_at: string; updated_at: string };
type MockTestInsert = { id?: string; user_id?: string; name: string; taken_on?: string; listening_score: number; reading_score: number; notes?: string | null; created_at?: string; updated_at?: string };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "13.0.4" };
  public: {
    Tables: {
      questions: { Row: QuestionRow; Insert: QuestionInsert; Update: Partial<QuestionInsert>; Relationships: [] };
      rules: { Row: RuleRow; Insert: RuleInsert; Update: Partial<RuleInsert>; Relationships: [] };
      question_rules: { Row: QuestionRuleRow; Insert: QuestionRuleInsert; Update: Partial<QuestionRuleInsert>; Relationships: [] };
      reviews: { Row: ReviewRow; Insert: ReviewInsert; Update: Partial<ReviewInsert>; Relationships: [] };
      mock_tests: { Row: MockTestRow; Insert: MockTestInsert; Update: Partial<MockTestInsert>; Relationships: [] };
    };
    Views: { [_ in never]: never };
    Functions: {
      record_rule_review: {
        Args: { p_rule_id: string; p_outcome: string; p_step_before: number; p_step_after: number; p_next_review_on: string | null };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
