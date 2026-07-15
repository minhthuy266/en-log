"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function signOut() {
    setPending(true); await createClient().auth.signOut(); router.push("/login"); router.refresh();
  }
  return <Button className="w-full" disabled={pending} onClick={signOut} variant="secondary">{pending ? "Signing out..." : "Sign out"}</Button>;
}
