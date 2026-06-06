import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import FeedClient, { type FeedProject } from "./FeedClient";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, onboarding_complete")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (!profile.onboarding_complete) redirect("/onboarding");

  const { data: raw } = await supabase
    .from("projects")
    .select(`
      id, title, description, cover_photo_url, before_photo_url, after_photo_url,
      specific_skills, trade_category, created_at,
      profiles(username, full_name, avatar_url, trade)
    `)
    .order("created_at", { ascending: false })
    .limit(60);

  const projects = ((raw ?? []) as unknown[]).filter(
    (r): r is FeedProject =>
      r !== null &&
      typeof r === "object" &&
      "profiles" in r &&
      r.profiles !== null
  );

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-[470px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-serif text-xl font-bold text-navy">Feed</h1>
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
            >
              <Plus size={12} />
              Add Project
            </Link>
          </div>
          <FeedClient projects={projects} />
        </div>
      </main>
    </>
  );
}
