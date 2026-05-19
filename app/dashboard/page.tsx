import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppNav from "@/components/AppNav";
import { ensureProfile } from "@/app/actions/profile";
import type { Profile, Project } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-text-dim mt-0.5 font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-border rounded-xl p-5 flex gap-4 items-start hover:border-accent hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 bg-sm-bg border border-border rounded-lg flex items-center justify-center shrink-0 text-text-dim group-hover:text-accent group-hover:border-accent transition-colors">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-navy text-sm">{title}</p>
        <p className="text-xs text-text-dim mt-0.5 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let profile = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()).data;

  if (!profile) {
    profile = await ensureProfile() as Profile | null;
    if (!profile) redirect("/login");
  }

  const [{ data: workExp }, { data: projects }] = await Promise.all([
    supabase
      .from("work_experience")
      .select("id")
      .eq("profile_id", user.id),
    supabase
      .from("projects")
      .select("id, title, trade_category, cover_photo_url, verification_status")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const typedProjects = (projects ?? []) as Project[];
  const pendingVerifications = typedProjects.filter(
    (p) => p.verification_status === "pending"
  );

  const displayName = profile.full_name || profile.username;
  const firstName = displayName.split(" ")[0];

  const missingItems = [
    !profile.full_name && "full name",
    !profile.trade && "trade",
    !profile.city && "location",
    !profile.bio && "bio",
    (workExp?.length ?? 0) === 0 && "work experience",
  ].filter(Boolean) as string[];
  const profileIncomplete = missingItems.length > 0;

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-navy">
                Welcome back, {firstName}
              </h1>
              <p className="text-text-dim text-sm mt-0.5">
                {profile.trade ?? "Trades Professional"}{profile.city ? ` · ${profile.city}, ${profile.state}` : ""}
              </p>
            </div>
            <Link
              href={`/${profile.username}`}
              className="text-sm font-semibold text-accent border border-accent rounded-md px-4 py-2 hover:bg-accent hover:text-white transition-colors"
            >
              View Profile
            </Link>
          </div>

          {/* Profile completion nudge */}
          {profileIncomplete && (
            <div className="bg-white border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">Finish setting up your profile</p>
                  <p className="text-xs text-text-dim mt-0.5">
                    Still missing: {missingItems.join(", ")}
                  </p>
                </div>
              </div>
              <Link
                href="/settings"
                className="shrink-0 text-xs font-semibold text-white bg-navy px-3 py-2 rounded-md hover:bg-navy-mid transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Profile Views" value={profile.profile_views} />
            <StatCard label="Projects" value={typedProjects.length} />
            <StatCard label="Connections" value={0} />
          </div>

          {/* Pending verifications alert */}
          {pendingVerifications.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {pendingVerifications.length} project{pendingVerifications.length > 1 ? "s" : ""} awaiting supervisor verification
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Verification emails have been sent. Remind your supervisors to check their inbox.
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Availability + quick actions */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy">Availability</p>
                    <p className={`text-xs mt-0.5 font-medium ${profile.is_available ? "text-emerald-600" : "text-text-dim"}`}>
                      {profile.is_available ? "Open to work" : "Not currently available"}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${profile.is_available ? "bg-emerald-500" : "bg-border2"}`} />
                </div>
                <Link
                  href="/settings"
                  className="mt-3 block text-xs text-accent font-semibold hover:underline"
                >
                  Change in settings →
                </Link>
              </div>
            </div>

            {/* Right: Quick actions */}
            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-semibold text-text-dim uppercase tracking-wide">Quick Actions</p>

              <QuickActionCard
                href="/projects/new"
                title="Add a Project"
                description="Upload photos and details of your best work to build your portfolio."
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                }
              />

              <QuickActionCard
                href={`/${profile.username}`}
                title="View Your Public Profile"
                description="See exactly how contractors and employers see your SkillMark profile."
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                }
              />

              <QuickActionCard
                href="/settings"
                title="Edit Profile"
                description="Update your bio, location, availability, and contact info."
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                }
              />

              <QuickActionCard
                href="/search"
                title="Find Trade Workers"
                description="Search verified trade workers by skill, location, and experience level."
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                }
              />
            </div>
          </div>

          {/* Recent projects */}
          {typedProjects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-text-dim uppercase tracking-wide">Your Projects</p>
                <Link href="/projects" className="text-xs text-accent font-semibold hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {typedProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-sm hover:border-border2 transition-all group"
                  >
                    <div className="aspect-video bg-sm-bg flex items-center justify-center relative">
                      {project.cover_photo_url ? (
                        <Image src={project.cover_photo_url} alt={project.title} fill className="object-cover" />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-navy leading-tight">{project.title}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          project.verification_status === "verified"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : project.verification_status === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-sm-bg text-text-dim border border-border"
                        }`}>
                          {project.verification_status === "verified" ? "Verified" : project.verification_status === "pending" ? "Pending" : "Unverified"}
                        </span>
                      </div>
                      {project.trade_category && (
                        <p className="text-xs text-text-dim mt-1">{project.trade_category}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {typedProjects.length === 0 && (
            <div className="bg-white border border-dashed border-border2 rounded-xl p-10 text-center">
              <div className="w-12 h-12 bg-sm-bg border border-border rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p className="font-semibold text-navy text-sm">No projects yet</p>
              <p className="text-xs text-text-dim mt-1 mb-4">Add your first project to start building your verified portfolio.</p>
              <Link
                href="/projects/new"
                className="inline-block bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-md hover:bg-navy-mid transition-colors"
              >
                Add First Project
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
