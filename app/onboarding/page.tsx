import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";
import CompanyOnboardingClient from "./CompanyOnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete, username, account_type")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_complete) redirect(`/${profile.username}`);

  return profile?.account_type === "company" ? <CompanyOnboardingClient /> : <OnboardingClient />;
}
