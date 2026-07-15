import Link from "next/link";
import { ErrorList } from "@/components/errors/error-list";
export default function ErrorsPage() { return <section className="grid gap-6"><div className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Error Log</h1><p className="mt-2 text-sm text-muted-foreground">Evidence of friction—not a warehouse of every question.</p></div><Link className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white" href="/errors/new">Add error</Link></div><ErrorList /></section>; }
