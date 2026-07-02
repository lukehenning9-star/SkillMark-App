import Link from "next/link";
import { Home, User, Search, FolderPlus, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import UserMenuDropdown from "./UserMenuDropdown";
import MobileBottomNav from "./MobileBottomNav";
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
        <Link href="/dashboard" className="font-serif text-xl font-bold text-navy shrink-0">
          Skill<span className="text-accent">Mark</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-dim hover:text-navy hover:bg-sm-bg rounded-md transition-colors"
          >
            <Home size={14} />
            Feed
          </Link>
          <Link
            href={`/${profile.username}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-dim hover:text-navy hover:bg-sm-bg rounded-md transition-colors"
          >
            <User size={14} />
            My Profile
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-dim hover:text-navy hover:bg-sm-bg rounded-md transition-colors"
          >
            <Search size={14} />
            Search
          </Link>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-dim hover:text-navy hover:bg-sm-bg rounded-md transition-colors"
          >
            <FolderPlus size={14} />
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
              <MessageSquare size={18} />
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
      <MobileBottomNav username={profile.username} unreadCount={msgCount} />
    </header>
  );
}
