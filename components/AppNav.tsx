import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenuDropdown from "./UserMenuDropdown";
import type { Profile } from "@/lib/types";

export default async function AppNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", user.id)
    .single<Pick<Profile, "username" | "full_name" | "avatar_url">>();

  if (!profile) return null;

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  const msgCount = unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={`/${profile.username}`} className="font-serif text-xl font-bold text-navy shrink-0">
          Skill<span className="text-accent">Mark</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href={`/${profile.username}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-dim hover:text-navy hover:bg-sm-bg rounded-md transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            My Profile
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-dim hover:text-navy hover:bg-sm-bg rounded-md transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search
          </Link>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-dim hover:text-navy hover:bg-sm-bg rounded-md transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add Project
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Link
              href="/messages"
              className="w-9 h-9 flex items-center justify-center text-text-dim hover:text-navy hover:bg-sm-bg rounded-md transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </Link>
            {msgCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 pointer-events-none">
                {msgCount > 9 ? "9+" : msgCount}
              </span>
            )}
          </div>

          <UserMenuDropdown
            username={profile.username}
            displayName={profile.full_name ?? profile.username}
            avatarUrl={profile.avatar_url}
          />
        </div>
      </div>
    </header>
  );
}
