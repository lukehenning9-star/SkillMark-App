"use server";

import { createClient } from "@/lib/supabase/server";

// Mark all of the current user's unread notifications as read.
export async function markNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase.from("notifications").update({ read: true }).eq("profile_id", user.id).eq("read", false);
  return { ok: true };
}
