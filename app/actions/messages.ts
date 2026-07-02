"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function sendMessage(recipientId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!checkRateLimit(`send-message:${user.id}`, 30, 60_000)) {
    return { error: "You're sending messages too quickly. Please wait a moment." };
  }

  const trimmed = content.trim();
  if (!trimmed) return { error: "Message cannot be empty" };
  if (trimmed.length > 5000) return { error: "Message is too long" };
  if (recipientId === user.id) return { error: "Cannot message yourself" };

  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: user.id, recipient_id: recipientId, content: trimmed })
    .select()
    .single();

  if (error) return { error: error.message };
  return { message: data };
}

export async function markMessagesRead(senderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", senderId)
    .eq("recipient_id", user.id)
    .is("read_at", null);
}

export async function searchUsers(query: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  if (!checkRateLimit(`search-users:${user.id}`, 30, 60_000)) return [];

  // Strip characters with meaning in PostgREST filter grammar (, ( ) \)
  // and LIKE wildcards (% _) — user input is interpolated into .or() below.
  const q = query.trim().replace(/[^\p{L}\p{N} .'-]/gu, "").trim();
  if (!q || q.length < 2 || q.length > 100) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, trade, experience_level")
    .neq("id", user.id)
    .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
    .limit(10);

  return data ?? [];
}
