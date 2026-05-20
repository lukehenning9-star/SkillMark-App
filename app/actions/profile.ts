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
};

export async function saveProfileStep(data: ProfileUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (data.full_name !== undefined && data.full_name.length > 100) return { error: "Full name must be 100 characters or less." };
  if (data.city !== undefined && data.city.length > 100) return { error: "City must be 100 characters or less." };
  if (data.bio !== undefined && data.bio.length > 300) return { error: "Bio must be 300 characters or less." };
  if (data.years_experience !== undefined && (data.years_experience < 0 || data.years_experience > 60)) {
    return { error: "Years of experience must be between 0 and 60." };
  }

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
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (data.job_title.length > 200) return { error: "Job title must be 200 characters or less." };
  if (data.company_name.length > 200) return { error: "Company name must be 200 characters or less." };
  if (data.description && data.description.length > 2000) return { error: "Description must be 2000 characters or less." };

  const { error } = await supabase
    .from("work_experience")
    .insert({ ...data, profile_id: user.id });

  if (error) return { error: error.message };
  return { success: true };
}

export async function saveAvatarUrl(url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!url.startsWith("https://")) return { error: "Invalid URL." };
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function saveBannerUrl(url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!url.startsWith("https://")) return { error: "Invalid URL." };
  const { error } = await supabase.from("profiles").update({ banner_url: url }).eq("id", user.id);
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
