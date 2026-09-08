"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const STORAGE_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

// Record a gallery photo the caller just uploaded. The URL must live under the
// caller's own storage prefix for THIS project's gallery; RLS additionally
// requires uploaded_by = auth.uid() and owner/accepted-collaborator membership.
export async function addGalleryPhoto(projectId: string, url: string, caption?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const expected = `${STORAGE_URL_PREFIX}project-photos/${user.id}/${projectId}/gallery/`;
  if (!url.startsWith(expected)) return { error: "Invalid photo URL." };

  const trimmedCaption = caption?.trim().slice(0, 200) || null;

  const { data, error } = await supabase
    .from("project_photos")
    .insert({ project_id: projectId, photo_url: url, uploaded_by: user.id, caption: trimmedCaption })
    .select("id, project_id, photo_url, caption, display_order, uploaded_by, created_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { photo: data };
}

// Only the project owner can delete photos (RLS enforces this too).
export async function deleteGalleryPhoto(photoId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("project_photos").delete().eq("id", photoId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
