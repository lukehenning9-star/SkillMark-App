import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import AppNav from "@/components/AppNav";
import ReferralClaimer from "@/components/ReferralClaimer";
import FeedClient, { type FeedProject } from "./FeedClient";

// How many recent projects to score, and how many to show.
const CANDIDATE_POOL = 150;
const FEED_SIZE = 60;

function embeddedCount(v: unknown): number {
  // Supabase returns an aggregate embed as [{ count: n }].
  if (Array.isArray(v)) return (v[0] as { count?: number } | undefined)?.count ?? 0;
  return 0;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // The feed is public: guests can browse projects. Only DOING things
  // (posting, liking, connecting) requires an account.

  // 1) Who this viewer is connected to (accepted, either direction).
  const connectionIds = new Set<string>();
  if (user) {
    const { data: conns } = await supabase
      .from("connections")
      .select("requester_id, addressee_id")
      .eq("status", "accepted");
    for (const c of conns ?? []) {
      connectionIds.add(c.requester_id === user.id ? c.addressee_id : c.requester_id);
    }
  }

  // 2) Recent candidate projects (feed-shared only) with author + counts.
  const { data: raw } = await supabase
    .from("projects")
    .select(
      `id, title, description, cover_photo_url, before_photo_url, after_photo_url,
       specific_skills, trade_category, created_at, profile_id,
       profiles(id, username, full_name, avatar_url, trade),
       likes:project_likes(count), comments:project_comments(count)`
    )
    .eq("post_to_feed", true)
    .order("created_at", { ascending: false })
    .limit(CANDIDATE_POOL);

  const candidates = (raw ?? []).filter((p) => p.profiles);

  // 3) Which of these the viewer already liked.
  const ids = candidates.map((p) => p.id);
  const likedByMe = new Set<string>();
  if (user && ids.length) {
    const { data: myLikes } = await supabase
      .from("project_likes")
      .select("project_id")
      .eq("profile_id", user.id)
      .in("project_id", ids);
    for (const l of myLikes ?? []) likedByMe.add(l.project_id);
  }

  // Premium authors get a small feed boost + a badge.
  const premiumAuthors = new Set<string>();
  if (candidates.length) {
    const authorIds = Array.from(new Set(candidates.map((p) => p.profile_id)));
    const { data: pa } = await supabase.rpc("premium_among", { ids: authorIds });
    for (const row of (pa ?? []) as (string | { id?: string })[]) {
      premiumAuthors.add(typeof row === "string" ? row : row.id ?? "");
    }
  }

  const now = Date.now();
  const scored = candidates.map((p) => {
    const author = (Array.isArray(p.profiles) ? p.profiles[0] : p.profiles) as FeedProject["profiles"];
    const like_count = embeddedCount(p.likes);
    const comment_count = embeddedCount(p.comments);
    const from_connection = connectionIds.has(p.profile_id);

    const author_premium = premiumAuthors.has(p.profile_id);
    const ageDays = (now - new Date(p.created_at).getTime()) / 86_400_000;
    const recency = Math.max(0, 4 - ageDays * 0.5);
    const popularity = like_count * 1 + comment_count * 1.5;
    const affinity = from_connection ? 3 : 0;
    const premiumBoost = author_premium ? 2 : 0;
    // Small deterministic jitter keeps discovery from being identical every load.
    const jitter = (parseInt(p.id.slice(0, 4), 16) % 100) / 200; // 0–0.5
    const score = affinity + popularity + recency + jitter + premiumBoost;

    const item: FeedProject = {
      id: p.id,
      title: p.title,
      description: p.description,
      cover_photo_url: p.cover_photo_url,
      before_photo_url: p.before_photo_url,
      after_photo_url: p.after_photo_url,
      specific_skills: p.specific_skills ?? [],
      trade_category: p.trade_category,
      created_at: p.created_at,
      profiles: author,
      like_count,
      comment_count,
      liked_by_me: likedByMe.has(p.id),
      from_connection,
      is_premium: author_premium,
    };
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const projects = scored.slice(0, FEED_SIZE).map((s) => s.item);

  // Private "people you work with most" strip (signed-in only).
  const { data: topRaw } = user
    ? await supabase.rpc("top_collaborators", { target: user.id, lim: 6 })
    : { data: null };
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

  return (
    <>
      <AppNav />
      <ReferralClaimer />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:items-start">
          {/* Feed column */}
          <div className="w-full max-w-[560px] mx-auto lg:mx-0 lg:max-w-none">
            {/* Mobile-only horizontal collaborators strip (sidebar covers desktop) */}
            {topCollaborators.length > 0 && (
              <div className="lg:hidden bg-white border border-border rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-3">You work with most</p>
                <div className="flex gap-4 overflow-x-auto">
                  {topCollaborators.map((c) => (
                    <Link key={c.id} href={`/${c.username}`} className="flex flex-col items-center gap-1.5 w-14 shrink-0 group">
                      <div className="w-11 h-11 rounded-full bg-navy-mid overflow-hidden flex items-center justify-center relative">
                        {c.avatar_url ? (
                          <Image src={c.avatar_url} alt={c.full_name || c.username} fill sizes="44px" className="object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white">{(c.full_name || c.username).charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-navy font-medium text-center truncate w-full group-hover:underline">{c.full_name || c.username}</span>
                      <span className="text-[9px] text-text-dim">{c.shared_count}×</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <h1 className="font-serif text-xl font-bold text-navy mb-4">{user ? "Your Feed" : "Latest Projects"}</h1>
            {!user && (
              <div className="bg-accent/5 border border-accent-border rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-text-mid">Browsing as a guest. Sign up to post work, like, and connect.</p>
                <Link href="/signup" className="shrink-0 text-sm font-semibold text-white bg-accent px-3.5 py-2 rounded-md hover:opacity-90 transition-opacity">Join Free</Link>
              </div>
            )}
            <FeedClient projects={projects} canInteract={!!user} />
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block space-y-4 lg:sticky lg:top-20">
            {topCollaborators.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-3">You work with most</p>
                <div className="space-y-2.5">
                  {topCollaborators.map((c) => (
                    <Link key={c.id} href={`/${c.username}`} className="flex items-center gap-2.5 group">
                      <div className="w-9 h-9 rounded-full bg-navy-mid overflow-hidden flex items-center justify-center relative shrink-0">
                        {c.avatar_url ? (
                          <Image src={c.avatar_url} alt={c.full_name || c.username} fill sizes="36px" className="object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-white">{(c.full_name || c.username).charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-sm text-navy font-medium truncate flex-1 min-w-0 group-hover:underline">{c.full_name || c.username}</span>
                      <span className="text-xs text-text-dim shrink-0">{c.shared_count}×</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {user ? (
              <>
                <div className="bg-white border border-border rounded-xl p-4">
                  <p className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-3">Grow your network</p>
                  <div className="space-y-1">
                    <Link href="/search" className="block text-sm text-navy hover:text-accent py-1.5">Find people to connect with →</Link>
                    <Link href="/connections" className="block text-sm text-navy hover:text-accent py-1.5">Manage connections →</Link>
                    <Link href="/projects/new" className="block text-sm text-navy hover:text-accent py-1.5">Add a project →</Link>
                  </div>
                </div>
                <div className="bg-accent/5 border border-accent-border rounded-xl p-4">
                  <p className="text-sm font-semibold text-navy mb-1">Invite &amp; earn</p>
                  <p className="text-xs text-text-mid mb-2">Get a free month of Premium for every friend who joins and posts work.</p>
                  <div className="space-y-1">
                    <Link href="/referrals" className="block text-sm font-semibold text-accent hover:underline py-1">Get your invite link →</Link>
                    <Link href="/premium" className="block text-sm text-navy hover:text-accent py-1">What&apos;s Premium? →</Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-accent/5 border border-accent-border rounded-xl p-4">
                <p className="text-sm font-semibold text-navy mb-1">Join SkillMark</p>
                <p className="text-xs text-text-mid mb-3">Build a profile, post your work, and connect with the trades. Free to join.</p>
                <div className="space-y-1">
                  <Link href="/signup" className="block text-sm font-semibold text-accent hover:underline py-1">Create your free profile →</Link>
                  <Link href="/search" className="block text-sm text-navy hover:text-accent py-1">Find tradespeople →</Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
