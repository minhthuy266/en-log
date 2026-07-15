"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/query-keys";
import { scheduleNextReview, todayAsCalendarDate, type ReviewOutcome } from "@/lib/review-scheduler";
import { createClient } from "@/lib/supabase/client";
import type { Question, QuestionRule, Rule } from "@/types/app";

export type DueRule = Rule & { questions: Question[] };

export function useDueRules() {
  return useQuery<DueRule[], Error>({ queryKey: queryKeys.reviews, queryFn: async () => {
    const supabase = createClient();
    const today = todayAsCalendarDate();
    const rulesResult = await supabase.from("rules").select("*").not("next_review_on", "is", null).lte("next_review_on", today).order("next_review_on");
    if (rulesResult.error) throw rulesResult.error;
    const rules = rulesResult.data as Rule[];
    if (!rules.length) return [];
    const linksResult = await supabase.from("question_rules").select("*").in("rule_id", rules.map((rule) => rule.id));
    if (linksResult.error) throw linksResult.error;
    const links = linksResult.data as QuestionRule[];
    const ids = [...new Set(links.map((link) => link.question_id))];
    const questionsResult = ids.length ? await supabase.from("questions").select("*").in("id", ids) : { data: [], error: null };
    if (questionsResult.error) throw questionsResult.error;
    const questions = questionsResult.data as Question[];
    return rules.map((rule) => ({ ...rule, questions: questions.filter((q) => links.some((link) => link.rule_id === rule.id && link.question_id === q.id)) }));
  }});
}

export function useRecordReview() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ rule, outcome }: { rule: DueRule; outcome: ReviewOutcome }) => {
    const reviewedOn = todayAsCalendarDate();
    const schedule = scheduleNextReview({ currentStep: rule.review_step, outcome, reviewedOn });
    const { error } = await createClient().rpc("record_rule_review", {
      p_rule_id: rule.id,
      p_outcome: outcome,
      p_step_before: rule.review_step,
      p_step_after: schedule.nextStep,
      p_next_review_on: schedule.nextReviewOn,
    });
    if (error) throw error;
  }, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: queryKeys.reviews }), client.invalidateQueries({ queryKey: queryKeys.rules }), client.invalidateQueries({ queryKey: queryKeys.analytics })]); }});
}
