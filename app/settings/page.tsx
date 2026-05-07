import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import SettingsForm from "./SettingsForm";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <SettingsForm profile={profile} />
      </main>
    </>
  );
}
