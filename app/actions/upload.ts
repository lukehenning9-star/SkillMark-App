"use server";

import { createClient } from "@/lib/supabase/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function publicUrl(bucket: string, path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export async function getAvatarUploadUrl() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const path = `${user.id}/avatar`;
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUploadUrl(path, { upsert: true });

  if (error) return { error: error.message };
  return { signedUrl: data.signedUrl, publicUrl: publicUrl("avatars", path) };
}

export async function getBannerUploadUrl() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const path = `${user.id}/banner`;
  const { data, error } = await supabase.storage
    .from("banners")
    .createSignedUploadUrl(path, { upsert: true });

  if (error) return { error: error.message };
  return { signedUrl: data.signedUrl, publicUrl: publicUrl("banners", path) };
}

export async function getProjectPhotoUploadUrl(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("profile_id", user.id)
    .single();

  if (!project) return { error: "Project not found." };

  const path = `${user.id}/${projectId}/cover`;
  const { data, error } = await supabase.storage
    .from("project-photos")
    .createSignedUploadUrl(path, { upsert: true });

  if (error) return { error: error.message };
  return { signedUrl: data.signedUrl, publicUrl: publicUrl("project-photos", path) };
}

export async function getProjectBeforePhotoUploadUrl(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("profile_id", user.id)
    .single();
  if (!project) return { error: "Project not found." };
  const path = `${user.id}/${projectId}/before`;
  const { data, error } = await supabase.storage
    .from("project-photos")
    .createSignedUploadUrl(path, { upsert: true });
  if (error) return { error: error.message };
  return { signedUrl: data.signedUrl, publicUrl: publicUrl("project-photos", path) };
}

export async function getProjectAfterPhotoUploadUrl(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("profile_id", user.id)
    .single();
  if (!project) return { error: "Project not found." };
  const path = `${user.id}/${projectId}/after`;
  const { data, error } = await supabase.storage
    .from("project-photos")
    .createSignedUploadUrl(path, { upsert: true });
  if (error) return { error: error.message };
  return { signedUrl: data.signedUrl, publicUrl: publicUrl("project-photos", path) };
}

// Gallery photos can be added by the owner OR an accepted collaborator. Each
// file goes under the uploader's own storage prefix, so storage RLS (own-prefix
// write) permits it without cross-user access.
export async function getGalleryPhotoUploadUrl(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: project } = await supabase
    .from("projects")
    .select("profile_id")
    .eq("id", projectId)
    .single();
  if (!project) return { error: "Project not found." };

  if (project.profile_id !== user.id) {
    const { data: collab } = await supabase
      .from("project_collaborators")
      .select("id")
      .eq("project_id", projectId)
      .eq("profile_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();
    if (!collab) return { error: "You're not a collaborator on this project." };
  }

  const path = `${user.id}/${projectId}/gallery/${crypto.randomUUID()}`;
  const { data, error } = await supabase.storage
    .from("project-photos")
    .createSignedUploadUrl(path);
  if (error) return { error: error.message };
  return { signedUrl: data.signedUrl, publicUrl: publicUrl("project-photos", path), path };
}
