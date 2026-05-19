import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import type { Profile, WorkExperience, Project, Certification } from "@/lib/types";

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Verified
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-semibold text-[11px] uppercase tracking-widest text-text-dim mb-4">
      {children}
    </h2>
  );
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean) {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return `${fmt(start)} – ${isCurrent ? "Present" : end ? fmt(end) : ""}`;
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
      .select("id, title, description, trade_category, specific_skills, cover_photo_url, verification_status")
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
  const typedProjects = (projects ?? []) as Project[];
  const typedWorkExp = (workExperience ?? []) as WorkExperience[];
  const typedCerts = (certifications ?? []) as Certification[];
  const verifiedProjects = typedProjects.filter((p) => p.verification_status === "verified");

  const experienceLevelLabel: Record<string, string> = {
    apprentice: "Apprentice",
    journeyman: "Journeyman",
    master: "Master",
  };

  return (
    <>
      <AppNav />
    <main className="min-h-screen bg-sm-bg">
      {/* Banner */}
      <div className="h-32 sm:h-48 bg-navy relative">
        {profile.banner_url && (
          <img
            src={profile.banner_url}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        )}
        {isOwner && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-navy/50">
            <button className="text-white text-xs font-semibold border border-white/50 px-3 py-1.5 rounded-md">
              Change Banner
            </button>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Avatar + identity row */}
        <div className="relative -mt-12 sm:-mt-16 mb-6 flex items-end justify-between gap-4">
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-sm-bg bg-white overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name ?? profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-bold text-navy-mid select-none">
                  {(profile.full_name ?? profile.username).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {isOwner && (
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-border rounded-full flex items-center justify-center shadow-sm hover:border-accent transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3d4f6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            )}
          </div>

          <div className="flex gap-2 pb-1">
            {isOwner ? (
              <Link
                href="/settings"
                className="text-sm font-semibold text-navy border border-border bg-white px-4 py-2 rounded-md hover:border-border2 transition-colors"
              >
                Edit Profile
              </Link>
            ) : (
              <Link
                href={`/messages?to=${profile.username}`}
                className="text-sm font-semibold text-white bg-navy px-4 py-2 rounded-md hover:bg-navy-mid transition-colors"
              >
                Message
              </Link>
            )}
          </div>
        </div>

        {/* Name + meta */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-navy">
              {profile.full_name ?? profile.username}
            </h1>
            {verifiedProjects.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Verified Worker
              </span>
            )}
          </div>
          <p className="text-text-mid text-[15px] mt-0.5">
            {profile.trade && (
              <span>
                {profile.experience_level
                  ? `${experienceLevelLabel[profile.experience_level]} ${profile.trade}`
                  : profile.trade}
              </span>
            )}
            {profile.years_experience > 0 && (
              <span className="text-text-dim"> · {profile.years_experience} yr{profile.years_experience !== 1 ? "s" : ""} experience</span>
            )}
          </p>
          {(profile.city || profile.state) && (
            <p className="text-sm text-text-dim mt-1 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {[profile.city, profile.state].filter(Boolean).join(", ")}
            </p>
          )}
          {profile.is_available && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Open to Work
            </span>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 border border-border rounded-xl bg-white mb-6 divide-x divide-border overflow-hidden">
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-navy">{typedProjects.length}</p>
            <p className="text-[11px] text-text-dim font-medium uppercase tracking-wide mt-0.5">Projects</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-navy">0</p>
            <p className="text-[11px] text-text-dim font-medium uppercase tracking-wide mt-0.5">Connections</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pb-12">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-5">
            {/* About */}
            {profile.bio && (
              <div className="bg-white border border-border rounded-xl p-5">
                <SectionHeading>About</SectionHeading>
                <p className="text-sm text-text-mid leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {/* Certifications */}
            {typedCerts.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-5">
                <SectionHeading>Certifications</SectionHeading>
                <ul className="space-y-2">
                  {typedCerts.map((cert) => (
                    <li key={cert.id} className="flex items-start gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                        <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-navy leading-tight">{cert.name}</p>
                        {cert.issuing_org && (
                          <p className="text-xs text-text-dim">{cert.issuing_org}</p>
                        )}
                        {cert.date_earned && (
                          <p className="text-xs text-text-dim">
                            {new Date(cert.date_earned + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            {cert.expiry_date && ` – ${new Date(cert.expiry_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Main column */}
          <div className="md:col-span-2 space-y-6">
            {/* Projects */}
            {typedProjects.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-5">
                <SectionHeading>Projects</SectionHeading>
                <div className="grid sm:grid-cols-2 gap-4">
                  {typedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="border border-border rounded-lg overflow-hidden hover:border-border2 hover:shadow-sm transition-all"
                    >
                      <div className="aspect-video bg-sm-bg flex items-center justify-center">
                        {project.cover_photo_url ? (
                          <img
                            src={project.cover_photo_url}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-navy leading-tight">{project.title}</p>
                          {project.verification_status === "verified" && <VerifiedBadge />}
                        </div>
                        {project.trade_category && (
                          <p className="text-xs text-text-dim mt-0.5">{project.trade_category}</p>
                        )}
                        {project.description && (
                          <p className="text-xs text-text-dim mt-1.5 line-clamp-2">{project.description}</p>
                        )}
                        {project.specific_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.specific_skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="text-[10px] bg-sm-bg border border-border text-text-dim px-1.5 py-0.5 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {typedWorkExp.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-5">
                <SectionHeading>Work Experience</SectionHeading>
                <ul className="space-y-5">
                  {typedWorkExp.map((job) => (
                    <li key={job.id} className="flex gap-3">
                      <div className="w-9 h-9 bg-sm-bg border border-border rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy leading-tight">{job.job_title}</p>
                        <p className="text-sm text-text-mid">{job.company_name}</p>
                        <p className="text-xs text-text-dim mt-0.5">
                          {formatDateRange(job.start_date, job.end_date, job.is_current)}
                        </p>
                        {job.description && (
                          <p className="text-xs text-text-dim mt-1.5 leading-relaxed">{job.description}</p>
                        )}
                        {job.supervisor_name && (
                          <p className="text-xs text-text-dim mt-1">
                            Supervisor: {job.supervisor_name}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty state for own profile */}
            {isOwner && typedProjects.length === 0 && (
              <div className="bg-white border border-dashed border-border2 rounded-xl p-8 text-center">
                <p className="font-semibold text-navy text-sm">Start building your portfolio</p>
                <p className="text-xs text-text-dim mt-1 mb-4">
                  Add projects and get them verified by supervisors to stand out.
                </p>
                <Link
                  href="/projects/new"
                  className="inline-block bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-md hover:bg-navy-mid transition-colors"
                >
                  Add First Project
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
