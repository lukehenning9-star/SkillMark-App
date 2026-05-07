"use server";

import { createClient } from "@/lib/supabase/server";

type ProfileUpdate = {
  full_name?: string;
  trade?: string;
  experience_level?: string;
  years_experience?: number;
  city?: string;
  state?: string;
  bio?: string;
  is_available?: boolean;
  onboarding_complete?: boolean;
};

export async function saveProfileStep(data: ProfileUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function addWorkExperience(data: {
  job_title: string;
  company_name: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  supervisor_name?: string;
  supervisor_email?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("work_experience")
    .insert({ ...data, profile_id: user.id });

  if (error) return { error: error.message };
  return { success: true };
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return { username: profile?.username ?? null };
}

export async function ensureProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existing) return existing;

  const username =
    (user.user_metadata?.username as string | undefined) ?? user.id;
  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: user.id, username, full_name: "" })
    .select()
    .single();

  return created;
}
