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
