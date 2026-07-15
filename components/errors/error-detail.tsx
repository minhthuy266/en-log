"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ErrorForm } from "@/components/errors/error-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { captureReasonLabels, errorTypeLabels, sectionLabels } from "@/lib/constants";
import { useDeleteError, useError } from "@/lib/queries/use-errors";
import { cn } from "@/lib/utils";
import type { QuestionWithRules } from "@/types/app";

const optionKeys = ["A", "B", "C", "D"] as const;

function getOptions(question: QuestionWithRules) {
  return optionKeys.map((key) => ({
    key,
    text: question[`option_${key.toLowerCase() as "a" | "b" | "c" | "d"}`]?.trim() ?? "",
  })).filter((option) => option.text);
}

function answerKey(answer: string | null, options: ReturnType<typeof getOptions>) {
  const normalized = answer?.trim() ?? "";
  const leadingKey = normalized.match(/^\(?([A-D])\)?(?:[.\s:–—-]|$)/i)?.[1];
  if (leadingKey) return leadingKey.toUpperCase();
  return options.find((option) => option.text.toLowerCase() === normalized.toLowerCase())?.key ?? "";
}

function QuickReview({ question }: { question: QuestionWithRules }) {
  const options = getOptions(question);
  const selectedKey = answerKey(question.my_answer, options);
  const correctKey = answerKey(question.correct_answer, options);
  const isCorrect = Boolean(selectedKey && correctKey && selectedKey === correctKey);
  const hasAnswerComparison = Boolean(question.my_answer || question.correct_answer);

  return <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
    <article className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-secondary text-primary">{sectionLabels[question.section]}</Badge>
          {question.question_number && <Badge>Question {question.question_number}</Badge>}
          <Badge className={cn(
            question.capture_reason === "wrong" && "bg-red-100 text-red-700",
            question.capture_reason === "guessed_correct" && "bg-amber-100 text-amber-800",
            question.capture_reason === "too_slow" && "bg-violet-100 text-violet-700",
          )}>{captureReasonLabels[question.capture_reason]}</Badge>
        </div>
        <h1 className="mt-3 whitespace-pre-wrap text-lg font-semibold leading-7 md:text-xl">{question.question_text}</h1>
        {question.context_excerpt && <details className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium">Show context</summary>
          <p className="mt-2 whitespace-pre-wrap leading-6 text-muted-foreground">{question.context_excerpt}</p>
        </details>}
      </div>

      <div className="grid gap-4 p-4 md:p-5">
        {options.length > 0 && <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const correct = option.key === correctKey;
            const selected = option.key === selectedKey;
            const selectedWrong = selected && correctKey && !correct;
            return <div className={cn(
              "flex min-h-12 items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
              correct && "border-emerald-300 bg-emerald-50 text-emerald-950",
              selectedWrong && "border-red-300 bg-red-50 text-red-950",
            )} key={option.key}>
              <span className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold",
                correct && "bg-emerald-600 text-white",
                selectedWrong && "bg-red-600 text-white",
              )}>{option.key}</span>
              <span className="min-w-0 flex-1 leading-6">{option.text}</span>
              {correct && <span className="shrink-0 font-semibold text-emerald-700">Correct</span>}
              {selectedWrong && <span className="shrink-0 font-semibold text-red-700">Yours</span>}
            </div>;
          })}
        </div>}

        {hasAnswerComparison && (!options.length || !selectedKey || !correctKey) && <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-xs font-medium uppercase tracking-wide text-red-700">Your answer</p><p className="mt-1 font-semibold">{question.my_answer || "—"}</p></div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Correct answer</p><p className="mt-1 font-semibold">{question.correct_answer || "—"}</p></div>
        </div>}

        {selectedKey && correctKey && <div className={cn(
          "rounded-lg px-3 py-2 text-sm font-semibold",
          isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800",
        )}>{isCorrect ? `Correct — you chose ${selectedKey}` : `You chose ${selectedKey}; the correct answer is ${correctKey}`}</div>}

        <section className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Why it happened</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{question.explanation || "No explanation added yet."}</p>
        </section>
      </div>
    </article>

    <aside className="grid gap-3">
      <section className="rounded-xl border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Rules to remember</p>
        {question.rules.length ? <div className="mt-3 grid gap-3">{question.rules.map((rule) => <div className="rounded-lg bg-secondary/60 p-3" key={rule.id}>
          <p className="font-semibold">{rule.title}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{rule.rule_text}</p>
        </div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No linked rule.</p>}
      </section>

      <div className="flex flex-wrap gap-2">{question.error_types.map((type) => <Badge key={type}>{errorTypeLabels[type]}</Badge>)}</div>

      <details className="rounded-xl border bg-card p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Source & metadata</summary>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-muted-foreground">
          <dt>Date</dt><dd className="text-right text-foreground">{question.occurred_on}</dd>
          {question.source_name && <><dt>Source</dt><dd className="text-right text-foreground">{question.source_name}</dd></>}
          {question.source_reference && <><dt>Reference</dt><dd className="break-all text-right text-foreground">{question.source_reference}</dd></>}
          {question.mockTest && <><dt>Run</dt><dd className="text-right text-foreground">{question.mockTest.name}</dd></>}
          {question.time_spent_seconds && <><dt>Time</dt><dd className="text-right text-foreground">{question.time_spent_seconds}s</dd></>}
        </dl>
      </details>
    </aside>
  </div>;
}

export function ErrorDetail() {
  const { id } = useParams<{ id: string }>(); const query = useError(id); const remove = useDeleteError(); const [editing, setEditing] = useState(false);
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading error...</p>;
  if (query.isError || !query.data) return <EmptyState title="Error not found" description={query.error?.message ?? "It may have been deleted."} />;
  return <div className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Link className="text-sm font-medium text-muted-foreground hover:text-foreground" href="/errors">← Error log</Link><span className="text-border">/</span><p className="text-sm font-semibold">{editing ? "Edit error" : "Quick review"}</p></div>
      <div className="flex gap-2">
        {editing ? <Button onClick={() => setEditing(false)} variant="secondary">Cancel</Button> : <Button onClick={() => setEditing(true)}>Edit</Button>}
        <Button disabled={remove.isPending} onClick={() => { if (window.confirm("Delete this error?")) remove.mutate(id); }} variant="ghost">Delete</Button>
      </div>
    </div>
    {editing ? <ErrorForm question={query.data} /> : <QuickReview question={query.data} />}
  </div>;
}
