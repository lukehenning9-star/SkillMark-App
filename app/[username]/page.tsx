import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AppNav from "@/components/AppNav";
import ProfileView from "./ProfileView";
import { isPremium } from "@/lib/premium";
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
    // Must be awaited: the supabase query builder is a lazy thenable — it only
    // issues the HTTP request when awaited/`.then()`'d. A bare `void` never
    // fires it, so the counter would never increment. It's a single cheap
    // UPDATE, so awaiting it adds negligible latency to the render.
    await supabase.rpc("increment_profile_views", { target_profile_id: profile.id });
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

  // Projects this person is an accepted collaborator on show on their profile too.
  const { data: collabRows } = await supabase
    .from("project_collaborators")
    .select("projects(*)")
    .eq("profile_id", profile.id)
    .eq("status", "accepted");
  const collabProjects = (collabRows ?? [])
    .map((r) => (Array.isArray(r.projects) ? r.projects[0] : r.projects))
    .filter(Boolean) as Project[];
  const ownedProjects = (projects ?? []) as Project[];
  const ownedIds = new Set(ownedProjects.map((p) => p.id));
  const allProjects = [...ownedProjects, ...collabProjects.filter((p) => !ownedIds.has(p.id))].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );

  // Viewer's connection state to this profile (drives the Connect button).
  let connectionState: "none" | "pending_out" | "pending_in" | "connected" = "none";
  if (viewer && !isOwner) {
    const { data: edges } = await supabase
      .from("connections")
      .select("requester_id, addressee_id, status")
      .or(
        `and(requester_id.eq.${viewer.id},addressee_id.eq.${profile.id}),` +
        `and(requester_id.eq.${profile.id},addressee_id.eq.${viewer.id})`
      );
    const edge = edges?.[0];
    if (edge) {
      if (edge.status === "accepted") connectionState = "connected";
      else if (edge.requester_id === viewer.id) connectionState = "pending_out";
      else connectionState = "pending_in";
    }
  }

  // Frequent collaborators (public "works with most" strip).
  const { data: topRaw } = await supabase.rpc("top_collaborators", { target: profile.id, lim: 8 });
  let topCollaborators: { id: string; username: string; full_name: string | null; avatar_url: string | null; shared_count: number }[] = [];
  if (Array.isArray(topRaw) && topRaw.length) {
    const ids = topRaw.map((t: { profile_id: string }) => t.profile_id);
    const { data: tp } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids);
    const pmap = new Map((tp ?? []).map((p) => [p.id, p]));
    topCollaborators = topRaw
      .map((t: { profile_id: string; shared_count: number }) => {
        const p = pmap.get(t.profile_id);
        return p ? { ...p, shared_count: Number(t.shared_count) } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  const profileIsPremium = await isPremium(supabase, profile.id);

  return (
    <>
      <AppNav />
      <ProfileView
        profile={profile}
        projects={allProjects}
        workExperience={(workExperience ?? []) as WorkExperience[]}
        certifications={(certifications ?? []) as Certification[]}
        isOwner={isOwner}
        unreadCount={unreadCount}
        connectionState={connectionState}
        viewerId={viewer?.id ?? null}
        topCollaborators={topCollaborators}
        isPremiumProfile={profileIsPremium}
      />
    </>
  );
}
