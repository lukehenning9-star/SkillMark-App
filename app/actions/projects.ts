"use server";

import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = (formData.get("title") as string).trim();
  if (!title) return { error: "Project title is required." };

  const supervisorEmail = (formData.get("supervisor_email") as string | null)?.trim() || null;
  const supervisorName = (formData.get("supervisor_name") as string | null)?.trim() || null;
  const specificSkills = formData.getAll("specific_skills") as string[];

  const verificationToken = randomUUID();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      profile_id: user.id,
      title,
      description: (formData.get("description") as string | null)?.trim() || null,
      trade_category: (formData.get("trade_category") as string | null) || null,
      location: (formData.get("location") as string | null)?.trim() || null,
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
