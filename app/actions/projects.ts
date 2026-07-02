"use server";

import { createClient } from "@/lib/supabase/server";

const STORAGE_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

function validateProjectFields(formData: FormData) {
  const rawTitle = formData.get("title");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (!title) return { error: "Project title is required." };
  if (title.length > 200) return { error: "Title must be 200 characters or less." };

  const description = (formData.get("description") as string | null)?.trim() || null;
  if (description && description.length > 5000) return { error: "Description must be 5000 characters or less." };

  const location = (formData.get("location") as string | null)?.trim() || null;
  if (location && location.length > 200) return { error: "Location must be 200 characters or less." };

  // Users may type custom skills (SkillTagInput allows free entry), so
  // sanitize rather than filter against a preset list: trim, cap length,
  // dedupe, and bound the array.
  const seen = new Set<string>();
  const specificSkills: string[] = [];
  for (const raw of formData.getAll("specific_skills")) {
    if (typeof raw !== "string") continue;
    const skill = raw.trim();
    if (!skill || skill.length > 50) continue;
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    specificSkills.push(skill);
    if (specificSkills.length >= 20) break;
  }

  const rawTradeCategory = (formData.get("trade_category") as string | null)?.trim() || null;
  if (rawTradeCategory && rawTradeCategory.length > 100) return { error: "Trade category must be 100 characters or less." };

  const rawDate = (formData.get("completed_date") as string | null) || null;
  const completedDate = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;

  return {
    title,
    description,
    location,
    specificSkills,
    tradeCategory: rawTradeCategory,
    completedDate,
  };
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const fields = validateProjectFields(formData);
  if ("error" in fields) return fields;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      profile_id: user.id,
      title: fields.title,
      description: fields.description,
      trade_category: fields.tradeCategory,
      location: fields.location,
      completed_date: fields.completedDate,
      specific_skills: fields.specificSkills,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const fields = validateProjectFields(formData);
  if ("error" in fields) return fields;

  const { error } = await supabase
    .from("projects")
    .update({
      title: fields.title,
      description: fields.description,
      trade_category: fields.tradeCategory,
      location: fields.location,
      completed_date: fields.completedDate,
      specific_skills: fields.specificSkills,
    })
    .eq("id", projectId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function saveProjectCoverPhoto(projectId: string, url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!url.startsWith(`${STORAGE_URL_PREFIX}project-photos/${user.id}/${projectId}/`)) return { error: "Invalid URL." };

  const { error } = await supabase
    .from("projects")
    .update({ cover_photo_url: url })
    .eq("id", projectId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function saveProjectBeforePhoto(projectId: string, url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!url.startsWith(`${STORAGE_URL_PREFIX}project-photos/${user.id}/${projectId}/`)) return { error: "Invalid URL." };
  const { error } = await supabase
    .from("projects")
    .update({ before_photo_url: url })
    .eq("id", projectId)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function saveProjectAfterPhoto(projectId: string, url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!url.startsWith(`${STORAGE_URL_PREFIX}project-photos/${user.id}/${projectId}/`)) return { error: "Invalid URL." };
  const { error } = await supabase
    .from("projects")
    .update({ after_photo_url: url })
    .eq("id", projectId)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}
