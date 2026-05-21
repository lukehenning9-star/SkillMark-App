import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import EditProjectForm from "./EditProjectForm";
import type { Project } from "@/lib/types";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, profile_id, title, description, trade_category, specific_skills, location, completed_date, cover_photo_url, before_photo_url, after_photo_url, created_at")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single<Project>();

  if (!project) notFound();

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <EditProjectForm project={project} />
      </main>
    </>
  );
}
