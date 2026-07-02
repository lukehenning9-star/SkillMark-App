import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppNav from "@/components/AppNav";
import ProfileView from "./ProfileView";
import type { Profile, WorkExperience, Project, Certification } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, headline, bio, trade, avatar_url")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) return { title: "Profile not found" };

  const name = profile.full_name || profile.username;
  const title = `${name} (@${profile.username})`;
  const description =
    profile.headline ||
    profile.bio ||
    [name, profile.trade].filter(Boolean).join(" · ") + " on SkillMark";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(profile.avatar_url ? { images: [profile.avatar_url] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

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

  if (viewer && !isOwner) {
    // Fire-and-forget; never block the page render on the counter.
    void supabase.rpc("increment_profile_views", { target_profile_id: profile.id });
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
