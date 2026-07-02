import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import FeedClient, { type FeedProject } from "./FeedClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: raw } = await supabase
    .from("projects")
    .select(
      `id, title, description, cover_photo_url, before_photo_url, after_photo_url,
       specific_skills, trade_category, created_at,
       profiles(username, full_name, avatar_url, trade)`
    )
    .order("created_at", { ascending: false })
    .limit(60);

  const projects = (raw ?? []).filter((p) => p.profiles) as unknown as FeedProject[];

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-[470px] mx-auto px-4 py-6">
          <h1 className="font-serif text-xl font-bold text-navy mb-4">Latest Work</h1>
          <FeedClient projects={projects} />
        </div>
      </main>
    </>
  );
}
