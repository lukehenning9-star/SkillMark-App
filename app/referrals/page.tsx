import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { Gift, Clock, CheckCircle2 } from "lucide-react";
import AppNav from "@/components/AppNav";
import ReferralClient from "./ReferralClient";
import { getReferralStats } from "@/app/actions/referrals";
import { PREMIUM_PRICE_LABEL } from "@/lib/stripe";

export const metadata = { title: "Invite & Earn" };

async function origin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 text-center">
      <div className="flex justify-center mb-1.5 text-accent">{icon}</div>
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-text-dim mt-0.5">{label}</p>
    </div>
  );
}

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stats = await getReferralStats();
  if ("error" in stats) {
    return (
      <>
        <AppNav />
        <main className="min-h-screen bg-sm-bg">
          <div className="max-w-2xl mx-auto px-4 py-10">
            <p className="text-sm text-text-dim">Couldn&apos;t load your referrals right now.</p>
          </div>
        </main>
      </>
    );
  }

  const link = `${await origin()}/?ref=${stats.code}`;

  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={22} className="text-accent" />
            <h1 className="font-serif text-2xl font-bold text-navy">Invite &amp; Earn</h1>
          </div>
          <p className="text-sm text-text-mid mb-6">
            Share your link. When someone you invite joins and sets up their profile with a real
            project, you get a <strong>free month of Premium</strong> ({PREMIUM_PRICE_LABEL} value).
          </p>

          <div className="bg-white border border-border rounded-xl p-5 mb-6">
            <p className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-2">Your invite link</p>
            <ReferralClient link={link} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <Stat icon={<CheckCircle2 size={18} />} label="Months earned" value={stats.monthsEarned} />
            <Stat icon={<Clock size={18} />} label="Pending" value={stats.pending} />
            <Stat icon={<Gift size={18} />} label="Rewarded" value={stats.rewarded} />
          </div>

          {stats.review > 0 && (
            <p className="text-xs text-text-dim mb-6">
              {stats.review} referral{stats.review !== 1 ? "s are" : " is"} under review.
            </p>
          )}

          <div className="bg-white border border-border rounded-xl p-5">
            <h2 className="text-xs font-semibold text-navy mb-3">How it works</h2>
            <ol className="space-y-2 text-sm text-text-mid list-decimal pl-5">
              <li>Share your link with people in the trades.</li>
              <li>They sign up, complete their profile, and post a project with a photo.</li>
              <li>You automatically get a free month of Premium, up to 5 per month.</li>
            </ol>
            <p className="text-[11px] text-text-dim mt-3">
              Self-referrals and duplicate/fake accounts don&apos;t qualify.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/premium" className="text-sm font-semibold text-accent hover:underline">
              See what Premium unlocks →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
