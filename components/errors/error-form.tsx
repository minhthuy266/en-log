"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { captureReasonLabels, captureReasons, errorTypeLabels, errorTypes, partLabels, toeicParts } from "@/lib/constants";
import { useCreateError, useUpdateError } from "@/lib/queries/use-errors";
import { useMockTests } from "@/lib/queries/use-mock-tests";
import { useRules } from "@/lib/queries/use-rules";
import { todayAsCalendarDate } from "@/lib/review-scheduler";
import { errorSchema, type ErrorFormValues } from "@/lib/validations/error";
import type { RuleFormValues } from "@/lib/validations/rule";
import { getErrorMessage } from "@/lib/utils";
import type { QuestionWithRules } from "@/types/app";

function defaults(question?: QuestionWithRules): ErrorFormValues {
  return {
    toeic_part: question?.toeic_part ?? "part_5",
    capture_reason: question?.capture_reason ?? "wrong",
    error_types: question?.error_types ?? ["grammar"],
    question_text: question?.question_text ?? "",
    context_excerpt: question?.context_excerpt ?? "",
    question_number: question?.question_number ?? "",
    option_a: question?.option_a ?? "", option_b: question?.option_b ?? "", option_c: question?.option_c ?? "", option_d: question?.option_d ?? "",
    my_answer: question?.my_answer ?? "", correct_answer: question?.correct_answer ?? "",
    explanation: question?.explanation ?? "", time_spent_seconds: question?.time_spent_seconds ?? "",
    source_name: question?.source_name ?? "", source_reference: question?.source_reference ?? "",
    mock_test_id: question?.mock_test_id ?? "", occurred_on: question?.occurred_on ?? todayAsCalendarDate(),
  };
}

export function ErrorForm({ question }: { question?: QuestionWithRules }) {
  const create = useCreateError(); const update = useUpdateError(); const rulesQuery = useRules(); const testsQuery = useMockTests();
  const [selectedRuleIds, setSelectedRuleIds] = useState(() => question?.rules.map((rule) => rule.id) ?? []);
  const [ruleSearch, setRuleSearch] = useState(""); const [showRule, setShowRule] = useState(false);
  const [newRule, setNewRule] = useState<RuleFormValues>({ title: "", rule_text: "", keywords: "" });
  const [formError, setFormError] = useState<string | null>(null); const [saved, setSaved] = useState(false); const saveAnother = useRef(false);
  const { register, handleSubmit, watch, setValue, reset, setError, formState: { errors } } = useForm<ErrorFormValues>({ defaultValues: defaults(question) });
  const selectedTypes = watch("error_types"); const selectedPart = watch("toeic_part"); const selectedReason = watch("capture_reason");
  const filteredRules = useMemo(() => (rulesQuery.data ?? []).filter((rule) => [rule.title, rule.rule_text, ...rule.keywords].join(" ").toLowerCase().includes(ruleSearch.toLowerCase())).slice(0, 12), [rulesQuery.data, ruleSearch]);
  const pending = create.isPending || update.isPending;

  function toggleType(type: (typeof errorTypes)[number]) { const current = selectedTypes ?? []; setValue("error_types", current.includes(type) ? current.filter((item) => item !== type) : [...current, type], { shouldValidate: true }); }
  function toggleRule(id: string) { setSelectedRuleIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }

  async function submit(values: ErrorFormValues) {
    setFormError(null); setSaved(false);
    const parsed = errorSchema.safeParse(values);
    if (!parsed.success) { parsed.error.issues.forEach((issue) => { const key = issue.path[0]; if (typeof key === "string") setError(key as keyof ErrorFormValues, { message: issue.message }); }); return; }
    if (!selectedRuleIds.length && !newRule.rule_text.trim()) return setFormError("Link an existing rule or write one new transferable rule.");
    try {
      if (question) await update.mutateAsync({ id: question.id, values, ruleIds: selectedRuleIds });
      else await create.mutateAsync({ values, ruleIds: selectedRuleIds, newRule: newRule.rule_text.trim() ? newRule : null, stayOnPage: saveAnother.current });
      if (saveAnother.current && !question) { reset(defaults()); setSelectedRuleIds([]); setNewRule({ title: "", rule_text: "", keywords: "" }); setShowRule(false); setSaved(true); saveAnother.current = false; }
      if (question) setSaved(true);
    } catch (cause) { setFormError(getErrorMessage(cause)); saveAnother.current = false; }
  }

  return <form className="grid gap-4" onSubmit={handleSubmit(submit)}>
    <section className="grid gap-5 rounded-xl border bg-card p-4 md:p-5">
      <div><h2 className="font-semibold">Quick capture</h2><p className="mt-1 text-sm text-muted-foreground">Capture the signal, not the entire test.</p></div>
      <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-medium">TOEIC part</legend><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{toeicParts.map((part) => <button className={`h-10 rounded-md border text-sm font-medium ${selectedPart === part ? "border-primary bg-secondary text-primary" : "bg-white"}`} key={part} onClick={() => setValue("toeic_part", part)} type="button">{partLabels[part].replace("Part ", "P")}</button>)}</div></fieldset>
      <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-medium">Why log it?</legend><div className="grid grid-cols-3 gap-2">{captureReasons.map((reason) => <button className={`min-h-10 rounded-md border px-2 text-xs font-medium sm:text-sm ${selectedReason === reason ? "border-primary bg-secondary text-primary" : "bg-white"}`} key={reason} onClick={() => setValue("capture_reason", reason)} type="button">{captureReasonLabels[reason]}</button>)}</div></fieldset>
      <fieldset><legend className="mb-2 text-sm font-medium">Error type <span className="font-normal text-muted-foreground">(one or more)</span></legend><div className="flex flex-wrap gap-2">{errorTypes.map((type) => <button className={`rounded-full border px-3 py-1.5 text-xs font-medium ${selectedTypes?.includes(type) ? "border-primary bg-secondary text-primary" : "bg-white"}`} key={type} onClick={() => toggleType(type)} type="button">{errorTypeLabels[type]}</button>)}</div><FieldError message={errors.error_types?.message} /></fieldset>
      <label className="grid gap-2"><span className="text-sm font-medium">Question or memory cue</span><Textarea className="min-h-24" placeholder="Paste the question, or write the smallest cue needed to reconstruct the mistake." {...register("question_text")} /><FieldError message={errors.question_text?.message} /></label>
    </section>

    <section className="grid gap-4 rounded-xl border bg-card p-4 md:p-5"><div><h2 className="font-semibold">Link the rule</h2><p className="mt-1 text-sm text-muted-foreground">A question can expose multiple rules. Reuse an existing one whenever possible.</p></div>
      <Input placeholder="Search existing rules" value={ruleSearch} onChange={(e) => setRuleSearch(e.target.value)} />
      {rulesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading rules...</p> : <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">{filteredRules.map((rule) => <button className={`rounded-lg border p-3 text-left text-sm ${selectedRuleIds.includes(rule.id) ? "border-primary bg-secondary" : ""}`} key={rule.id} onClick={() => toggleRule(rule.id)} type="button"><span className="font-medium">{rule.title}</span><span className="mt-1 line-clamp-2 block text-muted-foreground">{rule.rule_text}</span></button>)}</div>}
      <Button className="w-full sm:w-fit" onClick={() => setShowRule(!showRule)} variant="secondary">{showRule ? "Hide new rule" : "+ Create rule inline"}</Button>
      {showRule && <div className="grid gap-3 rounded-lg border bg-muted/30 p-3"><Input placeholder="Short title (optional; generated from rule if empty)" value={newRule.title} onChange={(e) => setNewRule({ ...newRule, title: e.target.value })} /><Textarea placeholder="Transferable rule, e.g. despite + noun/V-ing; although + clause." value={newRule.rule_text} onChange={(e) => setNewRule({ ...newRule, rule_text: e.target.value })} /><Input placeholder="Keywords, comma separated" value={newRule.keywords} onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })} /></div>}
    </section>

    <details className="rounded-xl border bg-card p-4 md:p-5" open={Boolean(question)}><summary className="cursor-pointer font-semibold">Context and details <span className="font-normal text-muted-foreground">(optional)</span></summary><div className="mt-5 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className="text-sm font-medium">Mock test</span><Select {...register("mock_test_id")}><option value="">None</option>{testsQuery.data?.map((test) => <option key={test.id} value={test.id}>{test.name} · {test.taken_on}</option>)}</Select></label><label className="grid gap-2"><span className="text-sm font-medium">Date</span><Input type="date" {...register("occurred_on")} /></label></div>
      <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2"><span className="text-sm font-medium">Source</span><Input placeholder="ETS 2025 Test 3" {...register("source_name")} /></label><label className="grid gap-2"><span className="text-sm font-medium">Reference</span><Input placeholder="Book/page/set" {...register("source_reference")} /></label><label className="grid gap-2"><span className="text-sm font-medium">Question #</span><Input inputMode="numeric" {...register("question_number")} /></label></div>
      <label className="grid gap-2"><span className="text-sm font-medium">Relevant context excerpt</span><Textarea placeholder="Only the passage or transcript fragment needed to understand the error." {...register("context_excerpt")} /></label>
      <div className="grid gap-3 sm:grid-cols-2">{(["a", "b", "c", "d"] as const).map((letter) => <label className="grid gap-1" key={letter}><span className="text-xs text-muted-foreground">Option {letter.toUpperCase()}</span><Input {...register(`option_${letter}`)} /></label>)}</div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className="text-sm font-medium">My answer</span><Input {...register("my_answer")} /></label><label className="grid gap-2"><span className="text-sm font-medium">Correct answer</span><Input {...register("correct_answer")} /></label></div>
      <label className="grid gap-2"><span className="text-sm font-medium">Why I missed it</span><Textarea placeholder="Missed signal, distractor logic, or timing failure." {...register("explanation")} /></label>
      <label className="grid max-w-xs gap-2"><span className="text-sm font-medium">Time spent (seconds)</span><Input inputMode="numeric" {...register("time_spent_seconds")} /></label>
    </div></details>
    {formError && <p className="text-sm text-destructive">{formError}</p>}{saved && <p className="text-sm font-medium text-primary">Saved.</p>}
    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">{!question && <Button disabled={pending} onClick={() => { saveAnother.current = true; }} type="submit" variant="secondary">Save & add</Button>}<Button disabled={pending} onClick={() => { saveAnother.current = false; }} type="submit">{pending ? "Saving..." : question ? "Save changes" : "Save error"}</Button></div>
  </form>;
}
