import { TodayReviewList } from "@/components/reviews/today-review-list";
export default function ReviewPage() { return <section className="grid gap-6"><div><h1 className="text-2xl font-semibold">Today Review</h1><p className="mt-2 text-sm text-muted-foreground">Retrieve first, reveal second, then score honestly.</p></div><TodayReviewList /></section>; }
