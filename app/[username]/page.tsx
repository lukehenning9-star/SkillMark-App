import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AppNav from "@/components/AppNav";
import ProfileView from "./ProfileView";
import { incrementProfileViews } from "@/app/actions/profile";
import type { Profile, WorkExperience, Project, Certification } from "@/lib/types";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single<Profile>();

  if (!profile) notFound();

  const [
    { data: workExperience },
    { data: projects },
    { data: certifications },
    { data: { user: viewer } },
  ] = await Promise.all([
    supabase
      .from("work_experience")
      .select("*")
      .eq("profile_id", profile.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("projects")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("certifications")
      .select("*")
      .eq("profile_id", profile.id)
      .order("date_earned", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const isOwner = viewer?.id === profile.id;

  if (!isOwner) {
    incrementProfileViews(profile.id).catch(() => {});
  }

  let unreadCount = 0;
  if (isOwner) {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", profile.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  }

  return (
    <>
      <AppNav />
      <ProfileView
        profile={profile}
        projects={(projects ?? []) as Project[]}
        workExperience={(workExperience ?? []) as WorkExperience[]}
        certifications={(certifications ?? []) as Certification[]}
        isOwner={isOwner}
        unreadCount={unreadCount}
      />
    </>
  );
}
