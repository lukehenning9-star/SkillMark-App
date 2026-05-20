import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppNav from "@/components/AppNav";
import { deleteProject } from "@/app/actions/projects";
import type { Project } from "@/lib/types";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, profile_id, title, trade_category, cover_photo_url, description, completed_date, specific_skills, location, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  const typedProjects = (projects ?? []) as Project[];

  async function handleDelete(formData: FormData) {
    "use server";
    const projectId = formData.get("project_id") as string;
    if (!projectId) return;
    await deleteProject(projectId);
    redirect("/projects");
  }

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-text-dim hover:text-navy flex items-center gap-1.5 mb-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="font-serif text-2xl font-bold text-navy">Your Projects</h1>
              <p className="text-text-dim text-sm mt-0.5">
                {typedProjects.length} project{typedProjects.length !== 1 ? "s" : ""} in your portfolio
              </p>
            </div>
            <Link
              href="/projects/new"
              className="bg-navy text-white font-semibold text-sm px-4 py-2.5 rounded-md hover:bg-navy-mid transition-colors shrink-0"
            >
              + Add Project
            </Link>
          </div>

          {typedProjects.length === 0 ? (
            <div className="bg-white border border-dashed border-border2 rounded-xl p-12 text-center">
              <div className="w-12 h-12 bg-sm-bg border border-border rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p className="font-semibold text-navy">No projects yet</p>
              <p className="text-sm text-text-dim mt-1 mb-5">
                Add your first project to start building your portfolio.
              </p>
              <Link
                href="/projects/new"
                className="inline-block bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-md hover:bg-navy-mid transition-colors"
              >
                Add First Project
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {typedProjects.map((project) => (
                <div key={project.id} className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-sm hover:border-border2 transition-all">
                  <Link href={`/projects/${project.id}`}>
                    <div className="aspect-video bg-sm-bg flex items-center justify-center relative">
                      {project.cover_photo_url ? (
                        <Image
                          src={project.cover_photo_url}
                          alt={project.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/projects/${project.id}`}>
                      <p className="text-sm font-semibold text-navy leading-tight hover:text-accent transition-colors">
                        {project.title}
                      </p>
                    </Link>
                    {project.trade_category && (
                      <p className="text-xs text-text-dim mt-0.5">{project.trade_category}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="flex-1 text-center text-xs font-semibold text-navy border border-border py-1.5 rounded-md hover:border-border2 hover:bg-sm-bg transition-colors"
                      >
                        Edit
                      </Link>
                      <form action={handleDelete} className="flex-1">
                        <input type="hidden" name="project_id" value={project.id} />
                        <button
                          type="submit"
                          className="w-full text-xs font-semibold text-red-600 border border-red-200 py-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
