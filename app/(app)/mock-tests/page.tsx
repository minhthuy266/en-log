import { MockTestView } from "@/components/mock-tests/mock-test-view";
export default function MockTestsPage() { return <section className="grid gap-6"><div><h1 className="text-2xl font-semibold">Benchmarks</h1><p className="mt-2 text-sm text-muted-foreground">Track both performance streams and validate progress on fresh timed runs.</p></div><MockTestView /></section>; }
