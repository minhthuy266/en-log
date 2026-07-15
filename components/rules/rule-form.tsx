"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRule, useUpdateRule } from "@/lib/queries/use-rules";
import { ruleSchema, type RuleFormValues } from "@/lib/validations/rule";
import { getErrorMessage } from "@/lib/utils";
import type { Rule } from "@/types/app";

export function RuleForm({ rule, onSaved }: { rule?: Rule; onSaved: () => void }) {
  const create = useCreateRule(); const update = useUpdateRule();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<RuleFormValues>({ defaultValues: { title: rule?.title ?? "", rule_text: rule?.rule_text ?? "", keywords: rule?.keywords.join(", ") ?? "" } });
  const pending = create.isPending || update.isPending;
  async function submit(values: RuleFormValues) {
    const parsed = ruleSchema.safeParse(values);
    if (!parsed.success) { parsed.error.issues.forEach((issue) => { const key = issue.path[0]; if (typeof key === "string") setError(key as keyof RuleFormValues, { message: issue.message }); }); return; }
    try { if (rule) await update.mutateAsync({ id: rule.id, values }); else await create.mutateAsync(values); onSaved(); }
    catch (cause) { setError("root", { message: getErrorMessage(cause) }); }
  }
  return <form className="grid gap-4" onSubmit={handleSubmit(submit)}>
    <label className="grid gap-2"><span className="text-sm font-medium">Short recall prompt</span><Input placeholder="e.g. despite vs although" {...register("title")} /><FieldError message={errors.title?.message} /></label>
    <label className="grid gap-2"><span className="text-sm font-medium">Rule</span><Textarea placeholder="Write a transferable rule, not the answer to one question." {...register("rule_text")} /><FieldError message={errors.rule_text?.message} /></label>
    <label className="grid gap-2"><span className="text-sm font-medium">Keywords</span><Input placeholder="despite, although, clause" {...register("keywords")} /></label>
    <FieldError message={errors.root?.message} />
    <Button className="w-full md:w-fit" disabled={pending} type="submit">{pending ? "Saving..." : rule ? "Save rule" : "Create rule"}</Button>
  </form>;
}
