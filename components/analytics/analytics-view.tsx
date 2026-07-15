"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { useAnalytics } from "@/lib/queries/use-analytics";

export function AnalyticsView() {
  const query = useAnalytics();
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Diagnosing patterns...</p>;
  if (query.isError) return <p className="text-sm text-destructive">{query.error.message}</p>;
  const data = query.data;
  if (!data || (!data.totalErrors && !data.mockTests.length)) return <EmptyState title="Not enough evidence yet" description="Log meaningful errors and mock scores. Analytics will describe friction, never invent accuracy." />;
  const sectionData = [...data.bySection].sort((a, b) => a.key.localeCompare(b.key));
  return <div className="grid gap-6">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Logged errors" value={data.totalErrors} /><Metric label="Due rules" value={data.dueRules} /><Metric label="Repeated rules" value={data.repeatedRules} /><Metric label="Latest total" value={data.latestScore ?? "—"} /></div>
    <section className="rounded-xl border border-primary/20 bg-secondary p-4 md:p-5"><h2 className="font-semibold text-primary">Focus next</h2><div className="mt-3 grid gap-2">{data.focusNext.map((item) => <p className="rounded-lg bg-white/70 p-3 text-sm" key={item}>{item}</p>)}</div></section>
    <div className="grid gap-6 lg:grid-cols-2"><ChartCard title="Logged friction by section" note="Counts are not accuracy; only selected errors are logged."><ResponsiveContainer height="100%" width="100%"><BarChart data={sectionData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Top error types" note="One question may count in multiple types."><ResponsiveContainer height="100%" width="100%"><BarChart data={data.byErrorType.slice(0, 6)} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis allowDecimals={false} type="number" /><YAxis dataKey="label" fontSize={11} type="category" width={110} /><Tooltip /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[0,5,5,0]} /></BarChart></ResponsiveContainer></ChartCard></div>
    {data.mockTests.length > 0 && <ChartCard title="Benchmark trend" note="Judge the rolling trend; one run can fluctuate."><ResponsiveContainer height="100%" width="100%"><LineChart data={data.mockTests}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="taken_on" fontSize={11} /><YAxis domain={[0, 990]} /><Tooltip /><Legend /><Line dataKey="listening_score" name="Stream A" stroke="#2563eb" strokeWidth={2} /><Line dataKey="reading_score" name="Stream B" stroke="#7c3aed" strokeWidth={2} /><Line dataKey="total_score" name="Total" stroke="#059669" strokeWidth={3} /></LineChart></ResponsiveContainer></ChartCard>}
    <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">Most repeated rules</h2><div className="mt-3 grid gap-2">{data.topRules.map((rule, index) => <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm" key={rule.id}><span><span className="mr-2 text-muted-foreground">#{index + 1}</span>{rule.title}{rule.repeatedAfterReview && <span className="ml-2 text-xs text-destructive">repeated after review</span>}</span><strong>{rule.count}</strong></div>)}</div></section><section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">7-day logging trend</h2><p className="mt-3 text-4xl font-semibold">{data.errorsLast7Days}</p><p className="mt-2 text-sm text-muted-foreground">Previous 7 days: {data.errorsPrevious7Days}. Lower is only good when practice volume is comparable.</p></section></div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function ChartCard({ title, note, children }: { title: string; note: string; children: React.ReactNode }) { return <section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{note}</p><div className="mt-4 h-72">{children}</div></section>; }
