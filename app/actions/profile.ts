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
const VALID_EXPERIENCE_LEVELS = ["apprentice", "journeyman", "master"] as const;

const STORAGE_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

// Accepts "YYYY-MM" (from <input type="month">) or "YYYY-MM-DD"; returns a
// valid Postgres date string or null.
function normalizeDate(value: string | undefined | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}

export async function saveProfileStep(data: ProfileUpdate) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (data.full_name != null && data.full_name.length > 100) return { error: "Full name must be 100 characters or less." };
  if (data.headline != null && data.headline.length > 120) return { error: "Headline must be 120 characters or less." };
  if (data.trade != null && data.trade.length > 100) return { error: "Trade must be 100 characters or less." };
  if (data.city != null && data.city.length > 100) return { error: "City must be 100 characters or less." };
  if (data.state != null && data.state.length > 50) return { error: "State must be 50 characters or less." };
  if (data.bio != null && data.bio.length > 300) return { error: "Bio must be 300 characters or less." };
  if (data.years_experience !== undefined && (data.years_experience < 0 || data.years_experience > 60)) {
    return { error: "Years of experience must be between 0 and 60." };
  }
  if (data.union_status != null && !(VALID_UNION_STATUSES as readonly string[]).includes(data.union_status)) {
    return { error: "Invalid union status." };
  }
  if (data.experience_level != null && !(VALID_EXPERIENCE_LEVELS as readonly string[]).includes(data.experience_level)) {
    return { error: "Invalid experience level." };
  }

  // Whitelist columns explicitly — server action arguments are attacker-
  // controlled JSON, and passing the raw object to .update() would let a
  // caller write any column of their own row (profile_views, username, ...).
  const update: ProfileUpdate = {};
  if (data.full_name !== undefined) update.full_name = data.full_name;
  if (data.headline !== undefined) update.headline = data.headline;
  if (data.trade !== undefined) update.trade = data.trade;
  if (data.experience_level !== undefined) update.experience_level = data.experience_level;
  if (data.years_experience !== undefined) update.years_experience = data.years_experience;
  if (data.city !== undefined) update.city = data.city;
  if (data.state !== undefined) update.state = data.state;
  if (data.bio !== undefined) update.bio = data.bio;
  if (data.is_available !== undefined) update.is_available = data.is_available;
  if (data.union_status !== undefined) update.union_status = data.union_status;
  if (Object.keys(update).length === 0) return { success: true };

  const { error } = await supabase
    .from("profiles")
    .update(update)
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

  if (!data.job_title.trim()) return { error: "Job title is required." };
  if (!data.company_name.trim()) return { error: "Company name is required." };
  if (data.job_title.length > 200) return { error: "Job title must be 200 characters or less." };
  if (data.company_name.length > 200) return { error: "Company name must be 200 characters or less." };
  if (data.description && data.description.length > 2000) return { error: "Description must be 2000 characters or less." };

  const startDate = normalizeDate(data.start_date);
  if (!startDate) return { error: "Please enter a valid start date." };
  const endDate = data.is_current ? null : normalizeDate(data.end_date);
  if (endDate && endDate < startDate) return { error: "End date cannot be before start date." };

  const { error } = await supabase.from("work_experience").insert({
    profile_id: user.id,
    job_title: data.job_title.trim(),
    company_name: data.company_name.trim(),
    start_date: startDate,
    end_date: endDate,
    is_current: data.is_current,
    description: data.description?.trim() || null,
  });

  if (error) return { error: error.message };
  return { success: true };
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

export async function saveAvatarUrl(url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!url.startsWith(`${STORAGE_URL_PREFIX}avatars/${user.id}/`)) return { error: "Invalid URL." };
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function saveBannerUrl(url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!url.startsWith(`${STORAGE_URL_PREFIX}banners/${user.id}/`)) return { error: "Invalid URL." };
  const { error } = await supabase.from("profiles").update({ banner_url: url }).eq("id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return { username: profile?.username ?? null };
}
