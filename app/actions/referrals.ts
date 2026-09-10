"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { ReferralStats } from "@/lib/types";

const REF_COOKIE = "sm_ref";

// The current user's referral code + a summary of their referrals.
export async function getReferralStats(): Promise<ReferralStats | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: code, error: codeErr } = await supabase.rpc("get_or_create_my_referral_code");
  if (codeErr) return { error: codeErr.message };

  const { data: rows } = await supabase.from("referrals").select("status").eq("referrer_id", user.id);
  let pending = 0, rewarded = 0, review = 0;
  for (const r of rows ?? []) {
    if (r.status === "rewarded") rewarded++;
    else if (r.status === "pending_review") review++;
    else if (r.status === "pending") pending++;
  }
  return { code: code as string, pending, rewarded, review, monthsEarned: rewarded };
}

// If a referral code was captured at signup (cookie), record it now that the
// user is authenticated, then clear the cookie. Safe to call repeatedly.
export async function claimReferral() {
  const jar = await cookies();
  const code = jar.get(REF_COOKIE)?.value;
  if (!code) return { ok: true };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase.rpc("record_referral", { p_code: code });
  jar.delete(REF_COOKIE);
  return { ok: true };
}
