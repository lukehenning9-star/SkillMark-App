import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of SkillMark.",
};

const h2 = "font-semibold text-navy text-base mt-8 mb-2";
const p = "text-sm text-text-mid leading-relaxed mb-3";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-sm-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="font-serif text-2xl font-bold text-navy">
          Skill<span className="text-accent">Mark</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy mt-6 mb-1">Terms of Service</h1>
        <p className="text-xs text-text-dim mb-8">Last updated: July 2026</p>

        <div className="bg-white border border-border rounded-xl p-8">
          <p className={p}>
            By creating an account or using SkillMark, you agree to these terms. If you don&apos;t
            agree, please don&apos;t use the service.
          </p>

          <h2 className={h2}>Your account</h2>
          <p className={p}>
            You&apos;re responsible for your account and for keeping your password secure. You must
            provide accurate information and be at least 16 years old to use SkillMark.
          </p>

          <h2 className={h2}>Your content</h2>
          <p className={p}>
            You own the photos and content you upload. By posting, you grant SkillMark a license to
            display that content on the platform — that&apos;s what makes your public profile work.
            Only upload photos you took or have the right to share, and don&apos;t include other
            people&apos;s personal information without their permission.
          </p>

          <h2 className={h2}>Acceptable use</h2>
          <p className={p}>
            Don&apos;t misrepresent your work or qualifications, impersonate others, harass other
            users, send spam, scrape the platform, or attempt to break or probe its security. We may
            remove content or suspend accounts that violate these rules.
          </p>

          <h2 className={h2}>No employment relationship</h2>
          <p className={p}>
            SkillMark connects workers and contractors but is not a party to any hiring decision,
            employment agreement, or work arrangement made between users. We don&apos;t verify or
            guarantee any user&apos;s qualifications, licensing, or work quality — do your own
            diligence.
          </p>

          <h2 className={h2}>Service changes</h2>
          <p className={p}>
            SkillMark is provided &quot;as is.&quot; We may change, suspend, or discontinue features
            as the product evolves, and we may update these terms — material changes will be posted
            here.
          </p>

          <h2 className={h2}>Contact</h2>
          <p className={p}>
            Questions about these terms? Reach us through the contact options at joinskillmark.com.
          </p>
        </div>
      </div>
    </main>
  );
}
