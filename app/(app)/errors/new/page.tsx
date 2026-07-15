import { ErrorForm } from "@/components/errors/error-form";
export default function NewErrorPage() { return <section className="grid gap-6"><div><h1 className="text-2xl font-semibold">Add Error</h1><p className="mt-2 text-sm text-muted-foreground">Wrong, guessed right, or too slow—capture it in under a minute.</p></div><ErrorForm /></section>; }
