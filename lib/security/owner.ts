import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getOwnerContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authorized: false as const, status: 401 as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.access_role !== "owner" || profile.account_status !== "active") {
    return { authorized: false as const, status: 403 as const };
  }

  return { authorized: true as const, user, supabase };
}
