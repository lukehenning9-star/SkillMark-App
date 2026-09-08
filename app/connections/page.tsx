import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import ConnectionsClient, { type ConnRow, type InviteRow } from "./ConnectionsClient";

export const metadata = { title: "Connections" };

type ProfileLite = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  trade: string | null;
};

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, status, created_at")
    .order("created_at", { ascending: false });

  const edges = rows ?? [];
  const otherIds = Array.from(
    new Set(edges.map((r) => (r.requester_id === user.id ? r.addressee_id : r.requester_id)))
  );

  let profiles: ProfileLite[] = [];
  if (otherIds.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, trade")
      .in("id", otherIds);
    profiles = (data as ProfileLite[]) ?? [];
  }
  const pmap = new Map(profiles.map((p) => [p.id, p]));

  const incoming: ConnRow[] = [];
  const following: ConnRow[] = [];
  const connected: ConnRow[] = [];
  for (const e of edges) {
    const otherId = e.requester_id === user.id ? e.addressee_id : e.requester_id;
    const profile = pmap.get(otherId);
    if (!profile) continue;
    const row: ConnRow = { id: e.id, otherId, profile };
    if (e.status === "accepted") connected.push(row);
    else if (e.addressee_id === user.id) incoming.push(row);
    else following.push(row);
  }

  // Pending project invites (this user was invited to collaborate).
  const { data: rawInvites } = await supabase
    .from("project_collaborators")
    .select("id, project_id, status, projects(title)")
    .eq("profile_id", user.id)
    .eq("status", "invited");
  const invites: InviteRow[] = (rawInvites ?? []).map((i) => ({
    id: i.id,
    projectId: i.project_id,
    // supabase types the embedded relation as an array
    projectTitle:
      (Array.isArray(i.projects) ? i.projects[0]?.title : (i.projects as { title: string } | null)?.title) ?? "a project",
  }));

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="font-serif text-2xl font-bold text-navy mb-6">Connections</h1>
          <ConnectionsClient
            incoming={incoming}
            following={following}
            connected={connected}
            invites={invites}
          />
        </div>
      </main>
    </>
  );
}
