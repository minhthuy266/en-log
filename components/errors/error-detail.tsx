"use client";

import { useParams } from "next/navigation";
import { ErrorForm } from "@/components/errors/error-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useDeleteError, useError } from "@/lib/queries/use-errors";

export function ErrorDetail() {
  const { id } = useParams<{ id: string }>(); const query = useError(id); const remove = useDeleteError();
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading error...</p>;
  if (query.isError || !query.data) return <EmptyState title="Error not found" description={query.error?.message ?? "It may have been deleted."} />;
  return <div className="grid gap-6"><div className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Error detail</h1><p className="mt-2 text-sm text-muted-foreground">Refine the diagnosis and keep rule links accurate.</p></div><Button disabled={remove.isPending} onClick={() => { if (window.confirm("Delete this error?")) remove.mutate(id); }} variant="ghost">Delete</Button></div><ErrorForm question={query.data} /></div>;
}
