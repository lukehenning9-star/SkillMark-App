import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search, Eye, Sparkles, Images, BadgeCheck } from "lucide-react";
import AppNav from "@/components/AppNav";
import PremiumClient from "./PremiumClient";
import { isPremium } from "@/lib/premium";
import { STRIPE_ENABLED, PREMIUM_PRICE_LABEL } from "@/lib/stripe";

export const metadata = { title: "Premium" };

const FEATURES = [
  { icon: Search, title: "Boosted in search & feed", body: "Show up higher when contractors search and browse, so you get found first." },
  { icon: BadgeCheck, title: "Premium badge", body: "A badge on your profile that signals you're serious about your trade." },
  { icon: Eye, title: "Profile view insights", body: "See how much attention your profile is getting." },
  { icon: Images, title: "Higher limits", body: "Add far more projects and photos to show the full range of your work." },
];

export default async function PremiumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const premium = user ? await isPremium(supabase, user.id) : false;
  let hasStripeSub = false;
  if (user) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("profile_id", user.id)
      .maybeSingle();
    hasStripeSub = Boolean(sub && ["active", "trialing", "past_due"].includes(sub.status ?? ""));
  }

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={22} className="text-accent" />
            <h1 className="font-serif text-2xl font-bold text-navy">SkillMark Premium</h1>
          </div>
          <p className="text-sm text-text-mid mb-6">
            Get found by more contractors and stand out. <strong>{PREMIUM_PRICE_LABEL}</strong>, cancel anytime.
          </p>

          {premium && (
            <div className="bg-accent/5 border border-accent-border rounded-xl p-4 mb-6 flex items-center gap-2">
              <BadgeCheck size={18} className="text-accent" />
              <p className="text-sm font-semibold text-navy">You&apos;re on Premium. Nice.</p>
            </div>
          )}

          <div className="bg-white border border-border rounded-xl p-6 mb-6 space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <f.icon size={17} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">{f.title}</p>
                  <p className="text-sm text-text-mid">{f.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <PremiumClient loggedIn={Boolean(user)} enabled={STRIPE_ENABLED} hasStripeSub={hasStripeSub} />
          </div>

          <div className="mt-6 text-center">
            <Link href="/referrals" className="text-sm font-semibold text-accent hover:underline">
              Or earn free months by inviting people →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
