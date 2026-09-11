import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, Users, Heart, MessageCircle, Gift, FolderPlus } from "lucide-react";
import AppNav from "@/components/AppNav";
import MarkNotificationsRead from "@/components/MarkNotificationsRead";
import type { Notification } from "@/lib/types";

export const metadata = { title: "Notifications" };

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function iconFor(type: string) {
  if (type.startsWith("connection")) return Users;
  if (type === "project_liked") return Heart;
  if (type === "project_comment") return MessageCircle;
  if (type === "referral_reward") return Gift;
  if (type.startsWith("project_invite") || type.startsWith("join")) return FolderPlus;
  return Bell;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select("id, profile_id, type, title, body, read, link, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const notifications = (data ?? []) as Notification[];

  return (
    <>
      <AppNav />
      <MarkNotificationsRead />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Bell size={20} className="text-navy" />
            <h1 className="font-serif text-2xl font-bold text-navy">Notifications</h1>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-10 text-center">
              <Bell size={28} className="mx-auto text-text-dim mb-3" />
              <p className="text-sm font-semibold text-navy">You&apos;re all caught up</p>
              <p className="text-xs text-text-dim mt-1">Connections, likes, comments, and rewards will show up here.</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
              {notifications.map((n) => {
                const Icon = iconFor(n.type);
                const inner = (
                  <div className={`flex items-start gap-3 px-4 py-3.5 ${n.read ? "" : "bg-accent/5"}`}>
                    <div className="w-9 h-9 rounded-full bg-sm-bg border border-border flex items-center justify-center shrink-0">
                      <Icon size={16} className={n.type === "project_liked" ? "text-red-500" : "text-accent"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-navy">
                        {!n.read && <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full mr-1.5 align-middle" />}
                        <span className="font-semibold">{n.title}</span>
                      </p>
                      {n.body && <p className="text-sm text-text-mid truncate">{n.body}</p>}
                      <p className="text-xs text-text-dim mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} className="block hover:bg-sm-bg transition-colors">
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
