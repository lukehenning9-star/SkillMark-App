"use server";

import { createClient } from "@/lib/supabase/server";

export async function blockUser(targetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (targetId === user.id) return { error: "You can't block yourself." };

  // Upsert on the (blocker_id, blocked_id) primary key so re-blocking is a no-op.
  const { error } = await supabase
    .from("blocked_users")
    .upsert({ blocker_id: user.id, blocked_id: targetId });
  if (error) return { error: error.message };
  return { success: true };
}

export async function unblockUser(targetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId);
  if (error) return { error: error.message };
  return { success: true };
}
