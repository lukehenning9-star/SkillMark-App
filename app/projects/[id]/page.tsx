import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Wrench, MapPin, Calendar, Camera } from "lucide-react";
import AppNav from "@/components/AppNav";
import DeleteProjectButton from "./DeleteProjectButton";
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
              <ChevronLeft size={14} />
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
                <DeleteProjectButton projectId={id} ownerUsername={profile?.username ?? null} />
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
                <Camera size={32} className="text-text-dim" />
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
                  <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-semibold text-navy whitespace-nowrap">Skills</h2>
                  <div className="h-px bg-border flex-1" />
                </div>
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
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-xs font-semibold text-navy whitespace-nowrap">Worker</h2>
                    <div className="h-px bg-border flex-1" />
                  </div>
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
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xs font-semibold text-navy whitespace-nowrap">Details</h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                {project.trade_category && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench size={13} className="text-text-dim shrink-0" />
                    <span className="text-navy">{project.trade_category}</span>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={13} className="text-text-dim shrink-0" />
                    <span className="text-navy">{project.location}</span>
                  </div>
                )}
                {project.completed_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={13} className="text-text-dim shrink-0" />
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
