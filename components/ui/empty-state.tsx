export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed bg-card p-8 text-center">
    <h2 className="font-semibold">{title}</h2>
    <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
  </div>;
}
