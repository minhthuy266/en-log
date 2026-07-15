"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null); setMessage(null); setPending(true);
    const supabase = createClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setPending(false);
    if (result.error) return setError(result.error.message);
    if (mode === "signup" && !result.data.session) return setMessage("Check your email to confirm the account, then log in.");
    router.push("/review"); router.refresh();
  }

  return <form className="grid gap-4" onSubmit={submit}>
    <label className="grid gap-2"><span className="text-sm font-medium">Email</span><Input autoComplete="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label className="grid gap-2"><span className="text-sm font-medium">Password</span><Input autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    {error && <p className="text-sm text-destructive">{error}</p>}
    {message && <p className="text-sm text-primary">{message}</p>}
    <Button className="w-full" disabled={pending} type="submit">{pending ? "Working..." : mode === "login" ? "Log in" : "Create account"}</Button>
  </form>;
}
