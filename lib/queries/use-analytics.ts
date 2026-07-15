"use client";

import { useQuery } from "@tanstack/react-query";
import { errorTypeLabels, sectionLabels } from "@/lib/constants";
import { queryKeys } from "@/lib/queries/query-keys";
import { todayAsCalendarDate } from "@/lib/review-scheduler";
import { createClient } from "@/lib/supabase/client";
import type { MockTest, Question, QuestionRule, Review, Rule } from "@/types/app";

type CountMetric = { key: string; label: string; count: number };
type RuleMetric = { id: string; title: string; count: number; repeatedAfterReview: boolean };

export type AnalyticsMetrics = {
  totalErrors: number;
  dueRules: number;
  repeatedRules: number;
  latestScore: number | null;
  errorsLast7Days: number;
  errorsPrevious7Days: number;
  bySection: CountMetric[];
  byErrorType: CountMetric[];
  topRules: RuleMetric[];
  mockTests: MockTest[];
  focusNext: string[];
};

function startOfDayDaysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

export function useAnalytics() {
  return useQuery<AnalyticsMetrics, Error>({ queryKey: queryKeys.analytics, queryFn: async () => {
    const supabase = createClient();
    const [qResult, rResult, lResult, reviewResult, testResult] = await Promise.all([
      supabase.from("questions").select("*"),
      supabase.from("rules").select("*"),
      supabase.from("question_rules").select("*"),
      supabase.from("reviews").select("*"),
      supabase.from("mock_tests").select("*").order("taken_on", { ascending: true }),
    ]);
    const error = qResult.error ?? rResult.error ?? lResult.error ?? reviewResult.error ?? testResult.error;
    if (error) throw error;
    const questions = qResult.data as Question[];
    const rules = rResult.data as Rule[];
    const links = lResult.data as QuestionRule[];
    const reviews = reviewResult.data as Review[];
    const tests = testResult.data as MockTest[];
    const sevenDaysAgo = startOfDayDaysAgo(7);
    const fourteenDaysAgo = startOfDayDaysAgo(14);
    const inLast7 = questions.filter((q) => new Date(`${q.occurred_on}T00:00:00`) >= sevenDaysAgo);
    const inPrevious7 = questions.filter((q) => { const date = new Date(`${q.occurred_on}T00:00:00`); return date >= fourteenDaysAgo && date < sevenDaysAgo; });

    const bySection = Object.entries(sectionLabels).map(([key, label]) => ({ key, label, count: questions.filter((q) => q.section === key).length })).filter((item) => item.count);
    const byErrorType = Object.entries(errorTypeLabels).map(([key, label]) => ({ key, label, count: questions.filter((q) => q.error_types.includes(key as Question["error_types"][number])).length })).filter((item) => item.count).sort((a, b) => b.count - a.count);
    const ruleMetrics = rules.map((rule) => {
      const questionIds = new Set(links.filter((link) => link.rule_id === rule.id).map((link) => link.question_id));
      const linked = questions.filter((q) => questionIds.has(q.id));
      const firstReview = reviews.filter((review) => review.rule_id === rule.id).sort((a, b) => a.reviewed_at.localeCompare(b.reviewed_at))[0];
      return { id: rule.id, title: rule.title, count: linked.length, repeatedAfterReview: Boolean(firstReview && linked.some((q) => {
        const reviewDate = firstReview.reviewed_at.slice(0, 10);
        return q.occurred_on > reviewDate || (q.occurred_on === reviewDate && q.created_at > firstReview.reviewed_at);
      })) };
    }).filter((item) => item.count).sort((a, b) => b.count - a.count);
    const topRules = ruleMetrics.slice(0, 5);
    const latest = tests.at(-1) ?? null;
    const repeatedRules = ruleMetrics.filter((rule) => rule.repeatedAfterReview).length;
    const dueRules = rules.filter((rule) => rule.next_review_on && rule.next_review_on <= todayAsCalendarDate()).length;
    const focusNext: string[] = [];
    if (topRules[0]?.repeatedAfterReview) focusNext.push(`Re-drill “${topRules[0].title}” with unseen questions; it repeated after review.`);
    if (byErrorType[0]) focusNext.push(`${byErrorType[0].label} is your most logged error type (${byErrorType[0].count}).`);
    if (bySection.sort((a, b) => b.count - a.count)[0]) { const section = [...bySection].sort((a, b) => b.count - a.count)[0]; focusNext.push(`${section.label} has the most logged friction (${section.count}); schedule a focused timed set.`); }
    if (!focusNext.length && questions.length === 0) focusNext.push("Log your first wrong, guessed-right, or too-slow question after a timed set.");

    return {
      totalErrors: questions.length,
      dueRules,
      repeatedRules,
      latestScore: latest?.total_score ?? null,
      errorsLast7Days: inLast7.length,
      errorsPrevious7Days: inPrevious7.length,
      bySection,
      byErrorType,
      topRules,
      mockTests: tests,
      focusNext: focusNext.slice(0, 3),
    };
  }});
}
