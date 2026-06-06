"use server";

import { createClient } from "@/lib/supabase/server";

type ProfileUpdate = {
  full_name?: string | null;
  headline?: string | null;
  trade?: string | null;
  experience_level?: string | null;
  years_experience?: number;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  is_available?: boolean;
  union_status?: string | null;
};

const VALID_UNION_STATUSES = ["Union Member", "Non-Union", "Open to Both"] as const;

export async function saveProfileStep(data: ProfileUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (data.full_name != null && data.full_name.length > 100) return { error: "Full name must be 100 characters or less." };
  if (data.headline != null && data.headline.length > 120) return { error: "Headline must be 120 characters or less." };
  if (data.city != null && data.city.length > 100) return { error: "City must be 100 characters or less." };
  if (data.bio != null && data.bio.length > 300) return { error: "Bio must be 300 characters or less." };
  if (data.years_experience !== undefined && (data.years_experience < 0 || data.years_experience > 60)) {
    return { error: "Years of experience must be between 0 and 60." };
  }
  if (data.union_status != null && !(VALID_UNION_STATUSES as readonly string[]).includes(data.union_status)) {
    return { error: "Invalid union status." };
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

export async function deleteWorkExperience(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase
    .from("work_experience")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateWorkExperience(id: string, data: {
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
  const { error } = await supabase
    .from("work_experience")
    .update({ ...data, profile_id: user.id })
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function incrementProfileViews(profileId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_profile_views", { profile_id: profileId });
}
