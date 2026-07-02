import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import SettingsForm from "./SettingsForm";
import CertificationsSection from "./CertificationsSection";
import WorkExperienceSection from "./WorkExperienceSection";
import type { Profile, Certification, WorkExperience } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: certifications }, { data: workExperience }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("certifications")
      .select("id, profile_id, name, issuing_org, date_earned, expiry_date, created_at")
      .eq("profile_id", user.id)
      .order("date_earned", { ascending: false }),
    supabase
      .from("work_experience")
      .select("*")
      .eq("profile_id", user.id)
      .order("start_date", { ascending: false }),
  ]);

  if (!profile) redirect("/login");

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <SettingsForm profile={profile} />
        <div className="max-w-2xl mx-auto px-4 pb-8 space-y-5">
          <WorkExperienceSection workExperience={(workExperience ?? []) as WorkExperience[]} />
          <CertificationsSection certifications={(certifications ?? []) as Certification[]} />
        </div>
      </main>
    </>
  );
}
