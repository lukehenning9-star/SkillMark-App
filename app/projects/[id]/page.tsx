import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppNav from "@/components/AppNav";
import { deleteProject } from "@/app/actions/projects";
import type { Project, Profile } from "@/lib/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    .select("username, full_name, avatar_url")
    .eq("id", project.profile_id)
    .single<Pick<Profile, "username" | "full_name" | "avatar_url">>();

  const isOwner = user?.id === project.profile_id;

  async function handleDelete() {
    "use server";
    await deleteProject(id);
    redirect("/dashboard");
  }

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={profile ? `/${profile.username}` : "/dashboard"}
              className="text-sm text-text-dim hover:text-navy flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back to Profile
            </Link>
            {isOwner && (
              <div className="flex gap-2">
                <Link
                  href={`/projects/${id}/edit`}
                  className="text-sm font-semibold text-navy border border-border px-3 py-1.5 rounded-md hover:border-border2 hover:bg-white transition-colors"
                >
                  Edit
                </Link>
                <form action={handleDelete}>
                  <button
                    type="submit"
                    className="text-sm font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Cover photo placeholder */}
          <div className="bg-white border border-border rounded-xl overflow-hidden mb-6">
            {project.cover_photo_url ? (
              <div className="aspect-video relative">
                <Image
                  src={project.cover_photo_url}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-sm-bg flex flex-col items-center justify-center gap-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
          </div>

          {(project.before_photo_url || project.after_photo_url) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {project.before_photo_url && (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className="aspect-video relative">
                    <Image src={project.before_photo_url} alt="Before" fill className="object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-text-dim text-center px-3 py-2 border-t border-border bg-sm-bg">Before</p>
                </div>
              )}
              {project.after_photo_url && (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className="aspect-video relative">
                    <Image src={project.after_photo_url} alt="After" fill className="object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-text-dim text-center px-3 py-2 border-t border-border bg-sm-bg">After</p>
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main */}
            <div className="md:col-span-2 space-y-5">
              <div className="bg-white border border-border rounded-xl p-6">
                <div className="mb-3">
                  <h1 className="font-serif text-2xl font-bold text-navy leading-tight">{project.title}</h1>
                </div>

                {project.description && (
                  <p className="text-sm text-text-mid leading-relaxed">{project.description}</p>
                )}
              </div>

              {project.specific_skills?.length > 0 && (
                <div className="bg-white border border-border rounded-xl p-5">
                  <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-3">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {project.specific_skills.map((skill) => (
                      <span key={skill} className="text-xs bg-sm-bg border border-border text-navy px-3 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Worker */}
              {profile && (
                <div className="bg-white border border-border rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-3">Worker</p>
                  <Link href={`/${profile.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-navy-mid rounded-full flex items-center justify-center overflow-hidden shrink-0 relative">
                      {profile.avatar_url ? (
                        <Image src={profile.avatar_url} alt="" fill className="object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {(profile.full_name ?? profile.username).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">{profile.full_name ?? profile.username}</p>
                      <p className="text-xs text-text-dim">@{profile.username}</p>
                    </div>
                  </Link>
                </div>
              )}

              {/* Details */}
              <div className="bg-white border border-border rounded-xl p-4 space-y-3">
                <p className="text-[11px] font-semibold text-text-dim uppercase tracking-wide">Details</p>
                {project.trade_category && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                    <span className="text-navy">{project.trade_category}</span>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-navy">{project.location}</span>
                  </div>
                )}
                {project.completed_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span className="text-navy">
                      {new Date(project.completed_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
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
