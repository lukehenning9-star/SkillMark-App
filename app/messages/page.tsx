import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import MessagesClient from "./MessagesClient";
import type { Profile } from "@/lib/types";

type PageProps = { searchParams: Promise<{ to?: string }> };

export default async function MessagesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { to } = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, trade, experience_level")
    .eq("id", user.id)
    .single<Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "trade" | "experience_level">>();

  if (!profile) redirect("/login");

  let initialPartner: typeof profile | null = null;
  if (to) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, trade, experience_level")
      .eq("username", to.toLowerCase())
      .neq("id", user.id)
      .single<Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "trade" | "experience_level">>();
    initialPartner = data;
  }

  return (
    <>
      <AppNav />
      <MessagesClient
        currentUser={profile}
        initialPartner={initialPartner}
      />
    </>
  );
}
