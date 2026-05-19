"use server";

import { createClient } from "@/lib/supabase/server";
import { PROJECT_SKILLS } from "@/lib/constants";
import { randomUUID } from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = (formData.get("title") as string).trim();
  if (!title) return { error: "Project title is required." };
  if (title.length > 200) return { error: "Title must be 200 characters or less." };

  const description = (formData.get("description") as string | null)?.trim() || null;
  if (description && description.length > 5000) return { error: "Description must be 5000 characters or less." };

  const location = (formData.get("location") as string | null)?.trim() || null;
  if (location && location.length > 200) return { error: "Location must be 200 characters or less." };

  const supervisorName = (formData.get("supervisor_name") as string | null)?.trim() || null;
  if (supervisorName && supervisorName.length > 200) return { error: "Supervisor name must be 200 characters or less." };

  const supervisorEmailRaw = (formData.get("supervisor_email") as string | null)?.trim() || null;
  if (supervisorEmailRaw && !EMAIL_RE.test(supervisorEmailRaw)) {
    return { error: "Supervisor email is not a valid email address." };
  }
  const supervisorEmail = supervisorEmailRaw;

  const rawSkills = formData.getAll("specific_skills") as string[];
  const validSkillSet = new Set<string>(PROJECT_SKILLS);
  const specificSkills = rawSkills
    .filter((s) => validSkillSet.has(s))
    .slice(0, 20);

  const verificationToken = randomUUID();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      profile_id: user.id,
      title,
      description,
      trade_category: (formData.get("trade_category") as string | null) || null,
      location,
      completed_date: (formData.get("completed_date") as string | null) || null,
      specific_skills: specificSkills,
      supervisor_name: supervisorName,
      supervisor_email: supervisorEmail,
      verification_token: verificationToken,
      verification_status: supervisorEmail ? "pending" : "unverified",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
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
