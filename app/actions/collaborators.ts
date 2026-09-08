"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// All of these delegate to SECURITY DEFINER RPCs that enforce ownership,
// connection, and state-transition rules server-side (see schema.sql).

export async function inviteCollaborator(projectId: string, profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.rpc("invite_collaborator", {
    p_project: projectId,
    p_profile: profileId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function requestToJoin(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.rpc("request_to_join", { p_project: projectId });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function respondToInvite(collabId: string, accept: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.rpc("respond_to_invite", { p_collab: collabId, p_accept: accept });
  if (error) return { error: error.message };
  revalidatePath("/connections");
  return { success: true };
}

export async function respondToJoinRequest(collabId: string, accept: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.rpc("respond_to_join_request", { p_collab: collabId, p_accept: accept });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateContribution(collabId: string, text: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (text.length > 2000) return { error: "Contribution must be 2000 characters or less." };
  const { error } = await supabase.rpc("update_my_contribution", { p_collab: collabId, p_text: text });
  if (error) return { error: error.message };
  return { success: true };
}

export async function removeCollaborator(collabId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.rpc("remove_collaborator", { p_collab: collabId });
  if (error) return { error: error.message };
  return { success: true };
}
