import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SkillMark collects, uses, and protects your information.",
};

const h2 = "font-semibold text-navy text-base mt-8 mb-2";
const p = "text-sm text-text-mid leading-relaxed mb-3";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-sm-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="font-serif text-2xl font-bold text-navy">
          Skill<span className="text-accent">Mark</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy mt-6 mb-1">Privacy Policy</h1>
        <p className="text-xs text-text-dim mb-8">Last updated: July 2026</p>

        <div className="bg-white border border-border rounded-xl p-8">
          <p className={p}>
            SkillMark (&quot;we&quot;, &quot;us&quot;) operates joinskillmark.com and the SkillMark
            application. This policy explains what we collect, why, and the choices you have.
          </p>

          <h2 className={h2}>What we collect</h2>
          <p className={p}>
            <strong>Account information:</strong> your email address, username, and password
            (passwords are hashed by our authentication provider and never stored in plain text).
          </p>
          <p className={p}>
            <strong>Profile content you choose to share:</strong> your name, trade, experience,
            location (city/state), bio, work history, certifications, and the project photos you
            upload. Profile content is public by design — that&apos;s how contractors find you.
          </p>
          <p className={p}>
            <strong>Messages:</strong> messages you exchange with other users are stored so we can
            deliver them. They are visible only to the sender and recipient.
          </p>

          <h2 className={h2}>How we use it</h2>
          <p className={p}>
            To operate the service: showing your profile in search, delivering messages, and
            maintaining your portfolio. We use the waitlist email you provide only to contact you
            about SkillMark. We do not sell your personal information.
          </p>

          <h2 className={h2}>Service providers</h2>
          <p className={p}>
            We use Supabase for authentication, database, and photo storage; Vercel for hosting;
            and Formspree for waitlist form submissions. Each processes data only to provide their
            service to us.
          </p>

          <h2 className={h2}>Your choices</h2>
          <p className={p}>
            You can edit or remove your profile details, projects, work history, and
            certifications at any time in Settings. To delete your account and its data entirely,
            contact us and we&apos;ll process the request.
          </p>

          <h2 className={h2}>Security</h2>
          <p className={p}>
            Access to data is enforced with row-level security policies, authenticated sessions,
            and rate limiting. No system is perfectly secure — please use a strong, unique
            password.
          </p>

          <h2 className={h2}>Contact</h2>
          <p className={p}>
            Questions about this policy? Reach us through the contact options at joinskillmark.com.
          </p>
        </div>
      </div>
    </main>
  );
}
