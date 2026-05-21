"use server";

import { createClient } from "@/lib/supabase/server";
import { PROJECT_SKILLS } from "@/lib/constants";

function validateProjectFields(formData: FormData) {
  const title = (formData.get("title") as string).trim();
  if (!title) return { error: "Project title is required." };
  if (title.length > 200) return { error: "Title must be 200 characters or less." };

  const description = (formData.get("description") as string | null)?.trim() || null;
  if (description && description.length > 5000) return { error: "Description must be 5000 characters or less." };

  const location = (formData.get("location") as string | null)?.trim() || null;
  if (location && location.length > 200) return { error: "Location must be 200 characters or less." };

  const validSkillSet = new Set<string>(PROJECT_SKILLS);
  const specificSkills = (formData.getAll("specific_skills") as string[])
    .filter((s) => validSkillSet.has(s))
    .slice(0, 20);

  return {
    title,
    description,
    location,
    specificSkills,
    tradeCategory: (formData.get("trade_category") as string | null) || null,
    completedDate: (formData.get("completed_date") as string | null) || null,
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

  if (!url.startsWith("https://")) return { error: "Invalid URL." };

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
  if (!url.startsWith("https://")) return { error: "Invalid URL." };
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
  if (!url.startsWith("https://")) return { error: "Invalid URL." };
  const { error } = await supabase
    .from("projects")
    .update({ after_photo_url: url })
    .eq("id", projectId)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}
