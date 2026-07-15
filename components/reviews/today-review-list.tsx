"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDueRules, useRecordReview, type DueRule } from "@/lib/queries/use-reviews";
import { REVIEW_INTERVALS } from "@/lib/review-scheduler";
import { getErrorMessage } from "@/lib/utils";

export function TodayReviewList() {
  const query = useDueRules();
  const record = useRecordReview();
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading review queue...</p>;
  if (query.isError) return <p className="text-sm text-destructive">{query.error.message}</p>;
  const rules = query.data ?? [];
  if (!rules.length) return <EmptyState title="Review queue is clear" description="New rules first appear tomorrow. Do a timed set or inspect recurring errors next." />;

  async function answer(rule: DueRule, outcome: "remembered" | "forgotten") {
    setError(null);
    try { await record.mutateAsync({ rule, outcome }); }
    catch (cause) { setError(getErrorMessage(cause)); }
  }

  return <div className="grid gap-4">
    <div className="rounded-xl border bg-card p-4"><p className="font-medium">{rules.length} rule{rules.length === 1 ? "" : "s"} due</p><p className="mt-1 text-sm text-muted-foreground">Recall the rule before revealing it. Recognition is not retrieval.</p></div>
    {error && <p className="text-sm text-destructive">{error}</p>}
    {rules.map((rule) => <article className="grid gap-4 rounded-xl border bg-card p-4 md:p-5" key={rule.id}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-primary">Recall prompt</p><h2 className="mt-1 text-xl font-semibold">{rule.title}</h2></div><Badge>Step {rule.review_step + 1}/5 · {REVIEW_INTERVALS[rule.review_step]}d</Badge></div>
      {rule.keywords.length > 0 && <div className="flex flex-wrap gap-2">{rule.keywords.map((keyword) => <Badge key={keyword}>{keyword}</Badge>)}</div>}
      {rule.questions[0] && <details className="rounded-lg border bg-muted/40 p-3"><summary className="cursor-pointer text-sm font-medium">Show a question cue</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{rule.questions[0].question_text}</p></details>}
      {!revealed.has(rule.id) ? <Button className="w-full md:w-fit" onClick={() => setRevealed((current) => new Set(current).add(rule.id))}>Reveal rule</Button> : <>
        <div className="rounded-lg border border-primary/20 bg-secondary p-4"><p className="whitespace-pre-wrap text-sm leading-6">{rule.rule_text}</p></div>
        <p className="text-sm text-muted-foreground">Could you produce the rule before seeing it—not merely recognize it?</p>
        <div className="grid grid-cols-2 gap-2 md:flex md:justify-end"><Button disabled={record.isPending} onClick={() => answer(rule, "forgotten")} variant="secondary">Forgot</Button><Button disabled={record.isPending} onClick={() => answer(rule, "remembered")}>Remembered</Button></div>
      </>}
    </article>)}
  </div>;
}
