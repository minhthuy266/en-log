"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { captureReasonLabels, errorTypeLabels, errorTypes, sectionLabels, sections } from "@/lib/constants";
import { useErrors } from "@/lib/queries/use-errors";

export function ErrorList() {
  const query = useErrors(); const [search, setSearch] = useState(""); const [section, setSection] = useState(""); const [type, setType] = useState(""); const [reason, setReason] = useState("");
  const errors = useMemo(() => (query.data ?? []).filter((item) => (!section || item.section === section) && (!type || item.error_types.includes(type as typeof item.error_types[number])) && (!reason || item.capture_reason === reason) && [item.question_text, item.explanation ?? "", item.source_name ?? "", ...item.rules.map((rule) => rule.title)].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data, section, type, reason, search]);
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading error log...</p>;
  if (query.isError) return <p className="text-sm text-destructive">{query.error.message}</p>;
  return <div className="grid gap-4"><div className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-4"><Input placeholder="Search errors or rules" value={search} onChange={(e) => setSearch(e.target.value)} /><Select value={section} onChange={(e) => setSection(e.target.value)}><option value="">All sections</option>{sections.map((item) => <option key={item} value={item}>{sectionLabels[item]}</option>)}</Select><Select value={type} onChange={(e) => setType(e.target.value)}><option value="">All error types</option>{errorTypes.map((item) => <option key={item} value={item}>{errorTypeLabels[item]}</option>)}</Select><Select value={reason} onChange={(e) => setReason(e.target.value)}><option value="">All reasons</option>{Object.entries(captureReasonLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></div>
    {!errors.length ? <EmptyState title="No matching errors" description="Log only wrong, guessed-right, or too-slow questions that contain a useful learning signal." /> : <div className="grid gap-3">{errors.map((item) => <Link className="rounded-xl border bg-card p-4 transition-colors hover:border-primary" href={`/errors/${item.id}`} key={item.id}><div className="flex flex-wrap gap-2"><Badge className="bg-secondary text-primary">{sectionLabels[item.section]}</Badge><Badge>{captureReasonLabels[item.capture_reason]}</Badge>{item.error_types.map((type) => <Badge key={type}>{errorTypeLabels[type]}</Badge>)}</div><h2 className="mt-3 line-clamp-2 font-semibold">{item.question_text}</h2><p className="mt-2 text-sm text-muted-foreground">{item.occurred_on} · {item.rules.length} linked rule{item.rules.length === 1 ? "" : "s"}{item.mockTest ? ` · ${item.mockTest.name}` : ""}</p></Link>)}</div>}
  </div>;
}
