import { redirect } from "next/navigation";
import { AppNavigation } from "@/components/layout/app-navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <div className="min-h-screen"><AppNavigation email={user.email ?? "TOEIC learner"} /><main className="pb-24 md:pl-64 md:pb-0"><div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div></main></div>;
}
