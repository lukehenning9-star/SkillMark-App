"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Sending a request creates a one-way follow immediately (pending row); if the
// other person already requested you, this accepts that instead of stacking a
// second edge. Acceptance makes it a mutual connection.
export async function sendConnectionRequest(targetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (targetId === user.id) return { error: "You can't connect with yourself." };

  if (!checkRateLimit(`connect:${user.id}`, 30, 60_000)) {
    return { error: "You're connecting too fast. Try again in a minute." };
  }

  // If they already sent me a request, accept it rather than create a new edge.
  const { data: reverse } = await supabase
    .from("connections")
    .select("id, status")
    .eq("requester_id", targetId)
    .eq("addressee_id", user.id)
    .maybeSingle();

  if (reverse) {
    if (reverse.status === "accepted") return { status: "accepted" as const };
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", reverse.id);
    if (error) return { error: error.message };
    revalidatePath("/connections");
    return { status: "accepted" as const };
  }

  const { error } = await supabase
    .from("connections")
    .insert({ requester_id: user.id, addressee_id: targetId, status: "pending" });

  // Unique violation = a request already exists in this direction; treat as no-op.
  if (error && !/duplicate key|unique/i.test(error.message)) return { error: error.message };
  revalidatePath("/connections");
  return { status: "pending" as const };
}

// Addressee accepts a pending incoming request (identified by the requester).
export async function acceptConnectionRequest(requesterId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("requester_id", requesterId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) return { error: error.message };
  revalidatePath("/connections");
  return { success: true };
}

// Remove any edge between me and the other person (decline / unfollow / disconnect).
export async function removeConnection(otherId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!UUID_RE.test(otherId)) return { error: "Invalid user." };

  const { error } = await supabase
    .from("connections")
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${otherId}),` +
      `and(requester_id.eq.${otherId},addressee_id.eq.${user.id})`
    );

  if (error) return { error: error.message };
  revalidatePath("/connections");
  return { success: true };
}
