"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCalendarDays, todayAsCalendarDate } from "@/lib/review-scheduler";
import { queryKeys } from "@/lib/queries/query-keys";
import { getCurrentUserId } from "@/lib/queries/user";
import { createClient } from "@/lib/supabase/client";
import { ruleSchema, type RuleFormValues } from "@/lib/validations/rule";
import type { Question, QuestionRule, Review, Rule, RuleWithStats } from "@/types/app";

export function useRules() {
  return useQuery<RuleWithStats[], Error>({ queryKey: queryKeys.rules, queryFn: async () => {
    const supabase = createClient();
    const [rulesResult, linksResult, questionsResult, reviewsResult] = await Promise.all([
      supabase.from("rules").select("*").order("created_at", { ascending: false }),
      supabase.from("question_rules").select("*"),
      supabase.from("questions").select("*"),
      supabase.from("reviews").select("*").order("reviewed_at", { ascending: false }),
    ]);
    const error = rulesResult.error ?? linksResult.error ?? questionsResult.error ?? reviewsResult.error;
    if (error) throw error;
    const rules = rulesResult.data as Rule[];
    const links = linksResult.data as QuestionRule[];
    const questions = questionsResult.data as Question[];
    const reviews = reviewsResult.data as Review[];
    return rules.map((rule) => {
      const ids = new Set(links.filter((link) => link.rule_id === rule.id).map((link) => link.question_id));
      const linked = questions.filter((question) => ids.has(question.id));
      const ruleReviews = reviews.filter((review) => review.rule_id === rule.id);
      const firstReviewAt = ruleReviews.at(-1)?.reviewed_at;
      return {
        ...rule,
        questions: linked,
        reviewCount: ruleReviews.length,
        repeatedAfterReview: Boolean(firstReviewAt && linked.some((question) => {
          const reviewDate = firstReviewAt.slice(0, 10);
          return question.occurred_on > reviewDate || (question.occurred_on === reviewDate && question.created_at > firstReviewAt);
        })),
      };
    });
  }});
}

export function useCreateRule() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (values: RuleFormValues) => {
    const userId = await getCurrentUserId();
    const parsed = ruleSchema.parse(values);
    const today = todayAsCalendarDate();
    const { data, error } = await createClient().from("rules").insert({
      ...parsed, user_id: userId, review_step: 0, next_review_on: addCalendarDays(today, 1),
    }).select().single();
    if (error) throw error;
    return data as Rule;
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: queryKeys.rules }); }});
}

export function useUpdateRule() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ id, values }: { id: string; values: RuleFormValues }) => {
    const parsed = ruleSchema.parse(values);
    const { error } = await createClient().from("rules").update(parsed).eq("id", id);
    if (error) throw error;
  }, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: queryKeys.rules }), client.invalidateQueries({ queryKey: queryKeys.questions })]); }});
}

export function useDeleteRule() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => {
    const { error } = await createClient().from("rules").delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: queryKeys.rules }), client.invalidateQueries({ queryKey: queryKeys.questions })]); }});
}
