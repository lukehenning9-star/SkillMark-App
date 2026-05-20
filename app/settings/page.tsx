import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import SettingsForm from "./SettingsForm";
import CertificationsSection from "./CertificationsSection";
import type { Profile, Certification } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: certifications }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("certifications")
      .select("id, profile_id, name, issuing_org, date_earned, expiry_date, created_at")
      .eq("profile_id", user.id)
      .order("date_earned", { ascending: false }),
  ]);

  if (!profile) redirect("/login");

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <SettingsForm profile={profile} />
        <div className="max-w-2xl mx-auto px-4 pb-8">
          <CertificationsSection certifications={(certifications ?? []) as Certification[]} />
        </div>
      </main>
    </>
  );
}
