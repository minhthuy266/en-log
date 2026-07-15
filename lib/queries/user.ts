import { createClient } from "@/lib/supabase/client";

export async function getCurrentUserId() {
  const { data: { user }, error } = await createClient().auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("You must be logged in.");
  return user.id;
}
