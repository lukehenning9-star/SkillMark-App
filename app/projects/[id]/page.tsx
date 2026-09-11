import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Wrench, MapPin, Calendar, Camera, Users } from "lucide-react";
import AppNav from "@/components/AppNav";
import DeleteProjectButton from "./DeleteProjectButton";
import ProjectSocial from "./ProjectSocial";
import ProjectGallery from "./ProjectGallery";
import CollaboratorControls, { type MyCollab } from "./CollaboratorControls";
import type { Project, Profile, ProjectComment } from "@/lib/types";

// Supabase types a to-one embed as an array; normalize to a single row.
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

type PersonLite = { id: string; username: string; full_name: string | null; avatar_url: string | null; trade?: string | null };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("title, description, trade_category, cover_photo_url")
    .eq("id", id)
    .single();
  if (!project) return { title: "Project not found" };
  const description =
    project.description?.slice(0, 160) || [project.trade_category, "on SkillMark"].filter(Boolean).join(" · ");
  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      ...(project.cover_photo_url ? { images: [project.cover_photo_url] } : {}),
    },
    twitter: { card: project.cover_photo_url ? "summary_large_image" : "summary", title: project.title, description },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("id, profile_id, title, description, trade_category, specific_skills, location, completed_date, cover_photo_url, before_photo_url, after_photo_url")
    .eq("id", id)
    .single<Project>();
  if (!project) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", project.profile_id)
    .single<Pick<Profile, "id" | "username" | "full_name" | "avatar_url">>();

  const isOwner = user?.id === project.profile_id;

  // Parallel fetch of the social + collaboration data.
  const [
    { data: accRaw },
    { data: myRow },
    { count: likeCount },
    { data: myLike },
    { data: commentsRaw },
    { data: photosRaw },
  ] = await Promise.all([
    supabase
      .from("project_collaborators")
      .select("id, profile_id, contribution, profiles(id, username, full_name, avatar_url, trade)")
      .eq("project_id", id)
      .eq("status", "accepted"),
    user
      ? supabase.from("project_collaborators").select("id, status, contribution").eq("project_id", id).eq("profile_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("project_likes").select("*", { count: "exact", head: true }).eq("project_id", id),
    user
      ? supabase.from("project_likes").select("project_id").eq("project_id", id).eq("profile_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("project_comments")
      .select("id, project_id, profile_id, content, created_at, profile:profiles(username, full_name, avatar_url)")
      .eq("project_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("project_photos").select("id, photo_url, caption, uploaded_by").eq("project_id", id).order("created_at", { ascending: true }),
  ]);

  const collaborators = (accRaw ?? []).map((c) => ({
    id: c.id as string,
    profile_id: c.profile_id as string,
    contribution: (c.contribution as string | null) ?? null,
    profile: one<PersonLite>(c.profiles as unknown as PersonLite | PersonLite[]),
  }));
  const myCollab = (myRow as MyCollab | null) ?? null;
  const comments = (commentsRaw ?? []).map((c) => ({ ...c, profile: one(c.profile) })) as unknown as ProjectComment[];
  const photos = (photosRaw ?? []) as { id: string; photo_url: string; caption: string | null; uploaded_by: string | null }[];
  const isAcceptedCollaborator = myCollab?.status === "accepted";
  const canAddPhotos = Boolean(isOwner || isAcceptedCollaborator);

  // Owner-only: pending join requests + invite candidates (connections not yet involved).
  let pendingRequests: { id: string; profile: PersonLite }[] = [];
  let inviteCandidates: PersonLite[] = [];
  if (isOwner && user) {
    const [{ data: reqs }, { data: conns }, { data: involved }] = await Promise.all([
      supabase.from("project_collaborators").select("id, profiles(id, username, full_name, avatar_url)").eq("project_id", id).eq("status", "requested"),
      supabase.from("connections").select("requester_id, addressee_id").eq("status", "accepted"),
      supabase.from("project_collaborators").select("profile_id").eq("project_id", id),
    ]);
    pendingRequests = (reqs ?? [])
      .map((r) => ({ id: r.id as string, profile: one<PersonLite>(r.profiles as unknown as PersonLite | PersonLite[]) }))
      .filter((r): r is { id: string; profile: PersonLite } => r.profile !== null);

    const involvedIds = new Set<string>([project.profile_id, ...(involved ?? []).map((i) => i.profile_id as string)]);
    const connIds = Array.from(
      new Set((conns ?? []).map((c) => (c.requester_id === user.id ? c.addressee_id : c.requester_id)))
    ).filter((cid) => !involvedIds.has(cid));
    if (connIds.length) {
      const { data: cands } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", connIds);
      inviteCandidates = (cands as PersonLite[]) ?? [];
    }
  }

  // Non-owner: can request to join if connected to the owner and not already involved.
  let canRequestToJoin = false;
  if (user && !isOwner && !myCollab) {
    const { data: conn } = await supabase
      .from("connections")
      .select("id")
      .eq("status", "accepted")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${project.profile_id}),` +
        `and(requester_id.eq.${project.profile_id},addressee_id.eq.${user.id})`
      )
      .maybeSingle();
    canRequestToJoin = Boolean(conn);
  }

  const contributors = [
    profile ? { profile_id: profile.id, profile: { ...profile, trade: null }, contribution: null, isOwnerRow: true } : null,
    ...collaborators.map((c) => ({ ...c, isOwnerRow: false })),
  ].filter(Boolean) as { profile_id: string; profile: PersonLite | null; contribution: string | null; isOwnerRow: boolean }[];

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <Link href={profile ? `/${profile.username}` : "/dashboard"} className="text-sm text-text-dim hover:text-navy flex items-center gap-1.5">
              <ChevronLeft size={14} /> Back to Profile
            </Link>
            {isOwner && (
              <div className="flex gap-2">
                <Link href={`/projects/${id}/edit`} className="text-sm font-semibold text-navy border border-border px-3 py-1.5 rounded-md hover:border-border2 hover:bg-white transition-colors">
                  Edit
                </Link>
                <DeleteProjectButton projectId={id} ownerUsername={profile?.username ?? null} />
              </div>
            )}
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden mb-6">
            {project.cover_photo_url ? (
              <div className="aspect-video relative">
                <Image src={project.cover_photo_url} alt={project.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-sm-bg flex flex-col items-center justify-center gap-3">
                <Camera size={32} className="text-text-dim" />
              </div>
            )}
          </div>

          {(project.before_photo_url || project.after_photo_url) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {project.before_photo_url && (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className="aspect-video relative"><Image src={project.before_photo_url} alt="Before" fill className="object-cover" /></div>
                  <p className="text-xs font-semibold text-text-dim text-center px-3 py-2 border-t border-border bg-sm-bg">Before</p>
                </div>
              )}
              {project.after_photo_url && (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className="aspect-video relative"><Image src={project.after_photo_url} alt="After" fill className="object-cover" /></div>
                  <p className="text-xs font-semibold text-text-dim text-center px-3 py-2 border-t border-border bg-sm-bg">After</p>
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-5">
              <div className="bg-white border border-border rounded-xl p-6 sm:p-7">
                <h1 className="font-serif text-2xl font-bold text-navy leading-tight mb-3">{project.title}</h1>
                {project.description && <p className="text-sm text-text-mid leading-relaxed">{project.description}</p>}
              </div>

              {project.specific_skills?.length > 0 && (
                <div className="bg-white border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-xs font-semibold text-navy whitespace-nowrap">Skills</h2>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.specific_skills.map((skill) => (
                      <span key={skill} className="text-xs bg-sm-bg border border-border text-navy px-3 py-1 rounded-full font-medium">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              <ProjectGallery projectId={id} canAdd={canAddPhotos} isOwner={isOwner} initialPhotos={photos} />

              <ProjectSocial
                projectId={id}
                initialLiked={Boolean(myLike)}
                initialLikeCount={likeCount ?? 0}
                initialComments={comments}
                currentUserId={user?.id ?? null}
                isOwner={isOwner}
              />
            </div>

            <div className="space-y-4">
              {/* Contributors */}
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={13} className="text-text-dim" />
                  <h2 className="text-xs font-semibold text-navy whitespace-nowrap">
                    {contributors.length > 1 ? "Contributors" : "Contributor"}
                  </h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="space-y-3">
                  {contributors.map((c) =>
                    c.profile ? (
                      <div key={c.profile_id}>
                        <Link href={`/${c.profile.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          <div className="w-10 h-10 bg-navy-mid rounded-full flex items-center justify-center overflow-hidden shrink-0 relative">
                            {c.profile.avatar_url ? (
                              <Image src={c.profile.avatar_url} alt="" fill className="object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-white">{(c.profile.full_name ?? c.profile.username).charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-navy truncate">
                              {c.profile.full_name ?? c.profile.username}
                              {c.isOwnerRow && <span className="ml-1.5 text-[10px] font-semibold text-accent">Owner</span>}
                            </p>
                            <p className="text-xs text-text-dim truncate">@{c.profile.username}</p>
                          </div>
                        </Link>
                        {c.contribution && <p className="text-xs text-text-mid mt-1.5 pl-[52px] leading-relaxed">{c.contribution}</p>}
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              {user && (
                <CollaboratorControls
                  projectId={id}
                  isOwner={isOwner}
                  inviteCandidates={inviteCandidates}
                  pendingRequests={pendingRequests}
                  myCollab={myCollab}
                  canRequestToJoin={canRequestToJoin}
                />
              )}

              <div className="bg-white border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xs font-semibold text-navy whitespace-nowrap">Details</h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                {project.trade_category && (
                  <div className="flex items-center gap-2 text-sm"><Wrench size={13} className="text-text-dim shrink-0" /><span className="text-navy">{project.trade_category}</span></div>
                )}
                {project.location && (
                  <div className="flex items-center gap-2 text-sm"><MapPin size={13} className="text-text-dim shrink-0" /><span className="text-navy">{project.location}</span></div>
                )}
                {project.completed_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={13} className="text-text-dim shrink-0" />
                    <span className="text-navy">{new Date(project.completed_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
