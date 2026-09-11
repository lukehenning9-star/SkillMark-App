import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How SkillMark uses cookies.",
};

const h2 = "font-semibold text-navy text-base mt-8 mb-2";
const p = "text-sm text-text-mid leading-relaxed mb-3";

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-sm-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="font-serif text-2xl font-bold text-navy">
          Skill<span className="text-accent">Mark</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy mt-6 mb-1">Cookie Policy</h1>
        <p className="text-xs text-text-dim mb-8">Last updated: September 2026</p>

        <div className="bg-white border border-border rounded-xl p-8">
          <p className={p}>
            This policy explains how SkillMark uses cookies and similar technologies. It should be
            read together with our <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
          </p>

          <h2 className={h2}>What cookies we use</h2>
          <p className={p}>
            We use only <strong>strictly necessary cookies</strong> — the session cookies our
            authentication provider (Supabase) sets to keep you securely signed in as you move
            between pages. Without them, core features like logging in wouldn&apos;t work.
          </p>

          <h2 className={h2}>What we don&apos;t use</h2>
          <p className={p}>
            We do <strong>not</strong> use advertising cookies, cross-site tracking, or third-party
            analytics cookies. We don&apos;t build advertising profiles or sell your data.
          </p>

          <h2 className={h2}>Do you need to consent?</h2>
          <p className={p}>
            Because we only use strictly necessary cookies, most privacy laws (including the GDPR and
            CCPA) do not require a consent banner for them. If we ever add analytics or marketing
            cookies, we will update this policy and provide the appropriate controls first.
          </p>

          <h2 className={h2}>Managing cookies</h2>
          <p className={p}>
            You can clear or block cookies in your browser settings at any time. Note that blocking
            our essential cookies will prevent you from staying logged in.
          </p>

          <h2 className={h2}>Contact</h2>
          <p className={p}>
            Questions? Reach us through the contact options at joinskillmark.com.
          </p>
        </div>
      </div>
    </main>
  );
}
