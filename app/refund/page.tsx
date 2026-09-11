import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "SkillMark's subscription and refund policy.",
};

const h2 = "font-semibold text-navy text-base mt-8 mb-2";
const p = "text-sm text-text-mid leading-relaxed mb-3";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-sm-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="font-serif text-2xl font-bold text-navy">
          Skill<span className="text-accent">Mark</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy mt-6 mb-1">Refund Policy</h1>
        <p className="text-xs text-text-dim mb-8">Last updated: September 2026</p>

        <div className="bg-white border border-border rounded-xl p-8">
          <p className={p}>
            SkillMark is free to use. SkillMark Premium is an optional paid subscription billed on a
            recurring monthly basis.
          </p>

          <h2 className={h2}>Cancel anytime</h2>
          <p className={p}>
            You can cancel your Premium subscription at any time from your account settings. When you
            cancel, your Premium features remain active through the end of the billing period you&apos;ve
            already paid for, and you won&apos;t be charged again after that.
          </p>

          <h2 className={h2}>Refunds</h2>
          <p className={p}>
            Payments are generally <strong>non-refundable</strong>, including for partial billing
            periods and unused time after a cancellation. We do not provide prorated refunds for the
            current period.
          </p>
          <p className={p}>
            If you were charged in error, or you believe there are exceptional circumstances, contact
            us and we&apos;ll review your request in good faith. Nothing in this policy limits any refund
            rights you may have under applicable consumer-protection law.
          </p>

          <h2 className={h2}>Free and promotional months</h2>
          <p className={p}>
            Free months earned through referrals or promotions have no cash value, are not refundable
            or exchangeable, and may expire.
          </p>

          <h2 className={h2}>Price changes</h2>
          <p className={p}>
            If we change the subscription price, we&apos;ll give you notice, and the new price will apply to
            billing periods after the change. You can cancel before it takes effect.
          </p>

          <h2 className={h2}>Contact</h2>
          <p className={p}>
            Questions about billing or this policy? Reach us through the contact options at
            joinskillmark.com.
          </p>
        </div>
      </div>
    </main>
  );
}
