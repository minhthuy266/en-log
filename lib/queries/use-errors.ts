"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { addCalendarDays, todayAsCalendarDate } from "@/lib/review-scheduler";
import { queryKeys } from "@/lib/queries/query-keys";
import { getCurrentUserId } from "@/lib/queries/user";
import { createClient } from "@/lib/supabase/client";
import { errorSchema, type ErrorFormValues } from "@/lib/validations/error";
import { ruleSchema, type RuleFormValues } from "@/lib/validations/rule";
import type { MockTest, Question, QuestionRule, QuestionWithRules, Rule } from "@/types/app";

async function attachData(questions: Question[]): Promise<QuestionWithRules[]> {
  if (!questions.length) return [];
  const supabase = createClient();
  const [linksResult, rulesResult, testsResult] = await Promise.all([
    supabase.from("question_rules").select("*").in("question_id", questions.map((q) => q.id)),
    supabase.from("rules").select("*"),
    supabase.from("mock_tests").select("*"),
  ]);
  const error = linksResult.error ?? rulesResult.error ?? testsResult.error;
  if (error) throw error;
  const links = linksResult.data as QuestionRule[];
  const rules = rulesResult.data as Rule[];
  const tests = testsResult.data as MockTest[];
  return questions.map((question) => {
    const ruleIds = new Set(links.filter((link) => link.question_id === question.id).map((link) => link.rule_id));
    return { ...question, rules: rules.filter((rule) => ruleIds.has(rule.id)), mockTest: tests.find((test) => test.id === question.mock_test_id) ?? null };
  });
}

export function useErrors() {
  return useQuery<QuestionWithRules[], Error>({ queryKey: queryKeys.questions, queryFn: async () => {
    const { data, error } = await createClient().from("questions").select("*").order("occurred_on", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw error;
    return attachData(data as Question[]);
  }});
}

export function useError(id: string) {
  return useQuery<QuestionWithRules, Error>({ queryKey: queryKeys.question(id), enabled: Boolean(id), queryFn: async () => {
    const { data, error } = await createClient().from("questions").select("*").eq("id", id).single();
    if (error) throw error;
    const [question] = await attachData([data as Question]);
    return question;
  }});
}

export function useCreateError() {
  const client = useQueryClient();
  const router = useRouter();
  return useMutation({ mutationFn: async ({ values, ruleIds, newRule }: { values: ErrorFormValues; ruleIds: string[]; newRule?: RuleFormValues | null; stayOnPage?: boolean }) => {
    const userId = await getCurrentUserId();
    const supabase = createClient();
    const parsed = errorSchema.parse(values);
    if (!ruleIds.length && !newRule?.rule_text.trim()) throw new Error("Link an existing rule or create a new rule.");
    const { data: question, error: questionError } = await supabase.from("questions").insert({ ...parsed, user_id: userId }).select().single();
    if (questionError) throw questionError;
    const linkedRuleIds = [...new Set(ruleIds)];
    if (newRule?.rule_text.trim()) {
      const normalized = { ...newRule, title: newRule.title.trim() || newRule.rule_text.trim().slice(0, 72) };
      const parsedRule = ruleSchema.parse(normalized);
      const today = todayAsCalendarDate();
      const { data: createdRule, error: ruleError } = await supabase.from("rules").insert({ ...parsedRule, user_id: userId, review_step: 0, next_review_on: addCalendarDays(today, 1) }).select().single();
      if (ruleError) throw ruleError;
      linkedRuleIds.push(createdRule.id);
    }
    const { error: linkError } = await supabase.from("question_rules").insert([...new Set(linkedRuleIds)].map((ruleId) => ({ user_id: userId, question_id: question.id, rule_id: ruleId })));
    if (linkError) throw linkError;
    return question as Question;
  }, onSuccess: async (question, variables) => {
    await Promise.all([client.invalidateQueries({ queryKey: queryKeys.questions }), client.invalidateQueries({ queryKey: queryKeys.rules }), client.invalidateQueries({ queryKey: queryKeys.analytics })]);
    if (!variables.stayOnPage) router.push(`/errors/${question.id}`);
  }});
}

export function useUpdateError() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ id, values, ruleIds }: { id: string; values: ErrorFormValues; ruleIds: string[] }) => {
    if (!ruleIds.length) throw new Error("Keep at least one linked rule.");
    const userId = await getCurrentUserId();
    const supabase = createClient();
    const parsed = errorSchema.parse(values);
    const { error } = await supabase.from("questions").update(parsed).eq("id", id);
    if (error) throw error;
    const linksResult = await supabase.from("question_rules").select("*").eq("question_id", id);
    if (linksResult.error) throw linksResult.error;
    const currentIds = new Set((linksResult.data as QuestionRule[]).map((link) => link.rule_id));
    const nextIds = new Set(ruleIds);
    const added = [...nextIds].filter((ruleId) => !currentIds.has(ruleId));
    const removed = [...currentIds].filter((ruleId) => !nextIds.has(ruleId));
    if (added.length) {
      const { error: linkError } = await supabase.from("question_rules").insert(added.map((ruleId) => ({ user_id: userId, question_id: id, rule_id: ruleId })));
      if (linkError) throw linkError;
    }
    if (removed.length) {
      const { error: deleteError } = await supabase.from("question_rules").delete().eq("question_id", id).in("rule_id", removed);
      if (deleteError) throw deleteError;
    }
  }, onSuccess: async (_, { id }) => { await Promise.all([client.invalidateQueries({ queryKey: queryKeys.questions }), client.invalidateQueries({ queryKey: queryKeys.question(id) }), client.invalidateQueries({ queryKey: queryKeys.rules }), client.invalidateQueries({ queryKey: queryKeys.analytics })]); }});
}

export function useDeleteError() {
  const client = useQueryClient();
  const router = useRouter();
  return useMutation({ mutationFn: async (id: string) => {
    const { error } = await createClient().from("questions").delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: queryKeys.questions }), client.invalidateQueries({ queryKey: queryKeys.rules }), client.invalidateQueries({ queryKey: queryKeys.analytics })]); router.push("/errors"); }});
}
