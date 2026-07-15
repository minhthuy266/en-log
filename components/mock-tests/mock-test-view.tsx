"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateMockTest, useDeleteMockTest, useMockTests } from "@/lib/queries/use-mock-tests";
import { todayAsCalendarDate } from "@/lib/review-scheduler";
import { mockTestSchema, type MockTestFormValues } from "@/lib/validations/mock-test";
import { getErrorMessage } from "@/lib/utils";

export function MockTestView() {
  const query = useMockTests(); const create = useCreateMockTest(); const remove = useDeleteMockTest(); const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, watch, reset, setError, formState: { errors } } = useForm<MockTestFormValues>({ defaultValues: { name: "", taken_on: todayAsCalendarDate(), listening_score: 450, reading_score: 450, notes: "" } });
  const listening = Number(watch("listening_score")) || 0; const reading = Number(watch("reading_score")) || 0;
  async function submit(values: MockTestFormValues) { const parsed = mockTestSchema.safeParse(values); if (!parsed.success) { parsed.error.issues.forEach((issue) => { const key = issue.path[0]; if (typeof key === "string") setError(key as keyof MockTestFormValues, { message: issue.message }); }); return; } try { await create.mutateAsync(values); reset({ name: "", taken_on: todayAsCalendarDate(), listening_score: 450, reading_score: 450, notes: "" }); setShowForm(false); } catch (cause) { setError("root", { message: getErrorMessage(cause) }); } }
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading benchmarks...</p>;
  if (query.isError) return <p className="text-sm text-destructive">{query.error.message}</p>;
  return <div className="grid gap-5">
    <div><Button onClick={() => setShowForm(!showForm)}>{showForm ? "Close form" : "+ Add benchmark"}</Button></div>
    {showForm && <form className="grid gap-4 rounded-xl border bg-card p-4 md:p-5" onSubmit={handleSubmit(submit)}><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className="text-sm font-medium">Run name</span><Input placeholder="Set 3 · July" {...register("name")} /><FieldError message={errors.name?.message} /></label><label className="grid gap-2"><span className="text-sm font-medium">Date</span><Input type="date" {...register("taken_on")} /></label></div><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2"><span className="text-sm font-medium">Stream A</span><Input inputMode="numeric" {...register("listening_score")} /><FieldError message={errors.listening_score?.message} /></label><label className="grid gap-2"><span className="text-sm font-medium">Stream B</span><Input inputMode="numeric" {...register("reading_score")} /><FieldError message={errors.reading_score?.message} /></label><div className="rounded-lg bg-secondary p-3"><p className="text-xs text-muted-foreground">Total</p><p className="mt-1 text-2xl font-semibold text-primary">{listening + reading}</p></div></div><label className="grid gap-2"><span className="text-sm font-medium">Notes</span><Textarea placeholder="Timing, stamina, run conditions..." {...register("notes")} /></label><FieldError message={errors.root?.message} /><Button className="w-full sm:w-fit" disabled={create.isPending} type="submit">{create.isPending ? "Saving..." : "Save benchmark"}</Button></form>}
    {!query.data?.length ? <EmptyState title="No benchmark data yet" description="Add full timed-run totals. Progress is a trend, not one lucky run." /> : <div className="grid gap-3">{query.data.map((test) => <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4" key={test.id}><div><h2 className="font-semibold">{test.name}</h2><p className="mt-1 text-sm text-muted-foreground">{test.taken_on} · A {test.listening_score} · B {test.reading_score}</p>{test.notes && <p className="mt-2 text-sm">{test.notes}</p>}</div><div className="flex items-center gap-3"><p className="text-3xl font-semibold text-primary">{test.total_score}</p><Button onClick={() => { if (window.confirm("Delete this benchmark? Linked errors will remain but lose the run link.")) remove.mutate(test.id); }} size="sm" variant="ghost">Delete</Button></div></article>)}</div>}
  </div>;
}
