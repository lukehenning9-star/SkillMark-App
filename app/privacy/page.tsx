import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SkillMark collects, uses, shares, and protects your information, and the rights you have.",
};

const h2 = "font-semibold text-navy text-base mt-8 mb-2";
const p = "text-sm text-text-mid leading-relaxed mb-3";
const li = "text-sm text-text-mid leading-relaxed mb-1.5";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-sm-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="font-serif text-2xl font-bold text-navy">
          Skill<span className="text-accent">Mark</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy mt-6 mb-1">Privacy Policy</h1>
        <p className="text-xs text-text-dim mb-8">Last updated: September 2026</p>

        <div className="bg-white border border-border rounded-xl p-8">
          <p className={p}>
            This Privacy Policy explains how SkillMark (&quot;SkillMark&quot;, &quot;we&quot;,
            &quot;us&quot;, or &quot;our&quot;) collects, uses, shares, and protects information in
            connection with joinskillmark.com and the SkillMark application (together, the
            &quot;Service&quot;). By using the Service you agree to this Policy. If you do not agree,
            please do not use the Service.
          </p>
          <p className={p}>
            SkillMark is a professional portfolio network for people in the skilled trades. Much of
            the Service is <strong>public by design</strong>, so your profile and the work you post are
            meant to be found by contractors and peers. Please keep that in mind when deciding what to
            share.
          </p>

          <h2 className={h2}>1. Information we collect</h2>
          <p className={p}><strong>Information you provide:</strong></p>
          <ul className="list-disc pl-5 mb-3">
            <li className={li}><strong>Account:</strong> email address, username, and password. Passwords are hashed by our authentication provider and are never stored in plain text or visible to us.</li>
            <li className={li}><strong>Profile:</strong> name, trade, experience level, years of experience, location (city/state), union status, availability, headline, bio, avatar and banner images, work history, and certifications.</li>
            <li className={li}><strong>Projects & photos:</strong> project titles, descriptions, skills, locations, dates, and the photos you or your collaborators upload.</li>
            <li className={li}><strong>Social activity:</strong> connections you make, project collaborations, and the likes and comments you post.</li>
            <li className={li}><strong>Messages:</strong> the content of messages you exchange with other users.</li>
            <li className={li}><strong>Waitlist / forms:</strong> the email address and any details you submit through our marketing or waitlist forms.</li>
          </ul>
          <p className={p}>
            <strong>Information collected automatically:</strong> when you use the Service we and our
            infrastructure providers process limited technical data such as your IP address, browser
            type, and timestamps, for security, rate limiting, and reliability. We do not use
            third-party advertising or cross-site tracking cookies.
          </p>

          <h2 className={h2}>2. How we use information</h2>
          <ul className="list-disc pl-5 mb-3">
            <li className={li}>To create and operate your account and profile.</li>
            <li className={li}>To display your public profile, projects, and contributions to other users.</li>
            <li className={li}>To deliver messages, connection requests, and collaboration invitations.</li>
            <li className={li}>To rank and personalize your feed.</li>
            <li className={li}>To secure the Service, including authentication, abuse prevention, and rate limiting.</li>
            <li className={li}>To respond to you and, where you&apos;ve given it, to contact you about SkillMark.</li>
            <li className={li}>To comply with law and enforce our Terms.</li>
          </ul>
          <p className={p}>
            Where required (e.g., in the EU/UK), we rely on these legal bases: performance of our
            contract with you, our legitimate interests in operating and securing the Service, your
            consent (which you may withdraw), and compliance with legal obligations.
          </p>

          <h2 className={h2}>3. What is public</h2>
          <p className={p}>
            Your profile, projects, project photos, certifications, work history, co-contributors,
            and the likes and comments you make are <strong>publicly visible</strong> and may be
            indexed by search engines. Your email address and password are never public. Private
            messages are visible only to you and the other participant.
          </p>

          <h2 className={h2}>4. How we share information</h2>
          <p className={p}>
            We do <strong>not sell</strong> your personal information and we do not share it for
            cross-context behavioral advertising. We share information only:
          </p>
          <ul className="list-disc pl-5 mb-3">
            <li className={li}><strong>With service providers</strong> who process data on our behalf: <strong>Supabase</strong> (authentication, database, photo storage), <strong>Vercel</strong> (hosting), and <strong>Formspree</strong> (marketing/waitlist form delivery). They may process data only to provide their service to us.</li>
            <li className={li}><strong>Publicly</strong>, for the profile and content you choose to make public (see Section 3).</li>
            <li className={li}><strong>For legal reasons</strong>, if required by law or to protect the rights, safety, and security of our users or the Service.</li>
            <li className={li}><strong>In a business transfer</strong>, if SkillMark is involved in a merger, acquisition, or sale of assets, subject to this Policy.</li>
          </ul>

          <h2 className={h2}>5. Cookies</h2>
          <p className={p}>
            We use only <strong>strictly necessary cookies</strong>, the session cookies that keep
            you logged in. We do not use advertising or analytics tracking cookies. Because these
            cookies are essential to the Service, they do not require consent under applicable law.
            If we introduce analytics in the future, we will update this Policy and provide any
            required controls.
          </p>

          <h2 className={h2}>6. Data retention</h2>
          <p className={p}>
            We keep your information for as long as your account is active. When you delete your
            account, your profile, projects, photos, messages, connections, and related personal data
            are removed (some limited records may be retained where required by law or for security).
          </p>

          <h2 className={h2}>7. Your rights and choices</h2>
          <p className={p}>
            You can view, edit, or remove your profile details, projects, work history, and
            certifications at any time in <strong>Settings</strong>. You can permanently delete your
            account and its data from <strong>Settings → Danger Zone</strong>.
          </p>
          <p className={p}>
            Depending on where you live, you may also have the rights below. To exercise them, use the
            in-app tools or contact us; we will verify your request and respond within the time
            required by law. We will not discriminate against you for exercising your rights.
          </p>
          <ul className="list-disc pl-5 mb-3">
            <li className={li}><strong>California (CCPA/CPRA):</strong> to know, access, correct, and delete your personal information, and to opt out of &quot;sale&quot; or &quot;sharing&quot;. We do not sell or share personal information as those terms are defined.</li>
            <li className={li}><strong>Texas (TDPSA):</strong> to confirm, access, correct, delete, and obtain a portable copy of your personal data, to opt out of targeted advertising and sale (we do neither), and to appeal a decision.</li>
            <li className={li}><strong>EU/UK (GDPR):</strong> to access, rectify, erase, restrict, port, and object to processing, and to lodge a complaint with your local data protection authority.</li>
          </ul>

          <h2 className={h2}>8. Security</h2>
          <p className={p}>
            We protect data with authenticated sessions, database row-level security, transport
            encryption (HTTPS), rate limiting, and least-privilege access. No method of transmission
            or storage is perfectly secure, so please use a strong, unique password and keep it
            confidential.
          </p>

          <h2 className={h2}>9. Children</h2>
          <p className={p}>
            The Service is intended for working adults and is not directed to children. You must be at
            least 18 years old to create an account. We do not knowingly collect personal information
            from anyone under 16; if you believe a child has provided us information, contact us and
            we will delete it.
          </p>

          <h2 className={h2}>10. International users</h2>
          <p className={p}>
            SkillMark is operated in the United States. If you access the Service from outside the
            U.S., you understand your information will be processed in the U.S., which may have
            different data-protection laws than your country.
          </p>

          <h2 className={h2}>11. Changes to this Policy</h2>
          <p className={p}>
            We may update this Policy from time to time. When we do, we will revise the &quot;Last
            updated&quot; date above and, for material changes, provide a more prominent notice. Your
            continued use of the Service after an update means you accept the revised Policy.
          </p>

          <h2 className={h2}>12. Contact</h2>
          <p className={p}>
            Questions or requests about this Policy or your data? Reach us through the contact options
            at joinskillmark.com and we&apos;ll be glad to help.
          </p>

          <p className="text-xs text-text-dim leading-relaxed mt-6 pt-4 border-t border-border">
            This policy is provided for general information and is not legal advice. As SkillMark grows
            we may adapt it to reflect new features and legal requirements.
          </p>
        </div>
      </div>
    </main>
  );
}
