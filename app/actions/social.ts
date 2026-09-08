"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

// Toggle a like on a project. Returns the new liked state.
export async function toggleLike(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("project_likes")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("project_likes")
      .delete()
      .eq("project_id", projectId)
      .eq("profile_id", user.id);
    if (error) return { error: error.message };
    return { liked: false };
  }

  const { error } = await supabase
    .from("project_likes")
    .insert({ project_id: projectId, profile_id: user.id });
  if (error) return { error: error.message };
  return { liked: true };
}

export async function addComment(projectId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!checkRateLimit(`comment:${user.id}`, 20, 60_000)) {
    return { error: "You're commenting too fast. Please wait a moment." };
  }

  const trimmed = content.trim();
  if (!trimmed) return { error: "Comment can't be empty." };
  if (trimmed.length > 2000) return { error: "Comment is too long." };

  const { data, error } = await supabase
    .from("project_comments")
    .insert({ project_id: projectId, profile_id: user.id, content: trimmed })
    .select("id, project_id, profile_id, content, created_at, profile:profiles(username, full_name, avatar_url)")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { comment: data };
}

export async function deleteComment(commentId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // RLS restricts deletion to the comment author or the project owner.
  const { error } = await supabase.from("project_comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
