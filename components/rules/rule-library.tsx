"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { RuleForm } from "@/components/rules/rule-form";
import { useDeleteRule, useRules } from "@/lib/queries/use-rules";
import type { RuleWithStats } from "@/types/app";

export function RuleLibrary() {
  const query = useRules(); const remove = useDeleteRule();
  const [search, setSearch] = useState(""); const [selectedId, setSelectedId] = useState<string | null>(null); const [creating, setCreating] = useState(false); const [editing, setEditing] = useState(false);
  const filtered = useMemo(() => (query.data ?? []).filter((rule) => [rule.title, rule.rule_text, ...rule.keywords].join(" ").toLowerCase().includes(search.trim().toLowerCase())), [query.data, search]);
  const selected = (query.data ?? []).find((rule) => rule.id === selectedId) ?? filtered[0] ?? null;
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading rules...</p>;
  if (query.isError) return <p className="text-sm text-destructive">{query.error.message}</p>;
  return <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
    <section className="grid content-start gap-3"><div className="flex items-center justify-between"><Input className="mr-2" placeholder="Search rules" value={search} onChange={(e) => setSearch(e.target.value)} /><Button onClick={() => setCreating(!creating)} variant="secondary">New</Button></div>
      {creating && <div className="rounded-xl border bg-card p-4"><RuleForm onSaved={() => setCreating(false)} /></div>}
      {!filtered.length ? <EmptyState title="No matching rules" description="Create a transferable rule from a real mistake." /> : filtered.map((rule) => <button className={`rounded-xl border bg-card p-3 text-left ${selected?.id === rule.id ? "border-primary" : ""}`} key={rule.id} onClick={() => { setSelectedId(rule.id); setEditing(false); }}><span className="font-medium">{rule.title}</span><span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{rule.rule_text}</span><span className="mt-2 block text-xs text-muted-foreground">{rule.questions.length} occurrence{rule.questions.length === 1 ? "" : "s"}</span></button>)}
    </section>
    <section>{selected ? <RuleDetail editing={editing} onEditing={setEditing} onDelete={() => { if (window.confirm("Delete this rule and its review history?")) remove.mutate(selected.id); }} rule={selected} /> : <EmptyState title="No rule selected" description="Choose or create a rule." />}</section>
  </div>;
}

function RuleDetail({ rule, editing, onEditing, onDelete }: { rule: RuleWithStats; editing: boolean; onEditing: (value: boolean) => void; onDelete: () => void }) {
  return <div className="grid gap-5 rounded-xl border bg-card p-4 md:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{rule.title}</h2><div className="mt-2 flex flex-wrap gap-2"><Badge>{rule.review_step === 5 ? "Graduated" : `Review step ${rule.review_step + 1}/5`}</Badge><Badge>{rule.reviewCount} reviews</Badge>{rule.repeatedAfterReview && <Badge className="bg-red-100 text-red-700">Repeated after review</Badge>}</div></div><div className="flex gap-2"><Button onClick={() => onEditing(!editing)} variant="secondary">{editing ? "Cancel" : "Edit"}</Button><Button onClick={onDelete} variant="ghost">Delete</Button></div></div>
    {editing ? <RuleForm onSaved={() => onEditing(false)} rule={rule} /> : <><p className="whitespace-pre-wrap text-sm leading-6">{rule.rule_text}</p>{rule.keywords.length > 0 && <div className="flex flex-wrap gap-2">{rule.keywords.map((keyword) => <Badge key={keyword}>{keyword}</Badge>)}</div>}</>}
    <div><h3 className="text-sm font-semibold">Linked errors ({rule.questions.length})</h3><div className="mt-3 grid gap-2">{rule.questions.slice(0, 8).map((q) => <div className="rounded-lg border p-3 text-sm" key={q.id}><p className="line-clamp-2">{q.question_text}</p><p className="mt-1 text-xs text-muted-foreground">{q.toeic_part.replace("_", " ")} · {q.occurred_on}</p></div>)}{!rule.questions.length && <p className="text-sm text-muted-foreground">No linked errors.</p>}</div></div>
  </div>;
}
