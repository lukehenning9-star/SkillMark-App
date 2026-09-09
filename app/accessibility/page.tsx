import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "SkillMark's commitment to an accessible experience for everyone.",
};

const h2 = "font-semibold text-navy text-base mt-8 mb-2";
const p = "text-sm text-text-mid leading-relaxed mb-3";

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-sm-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="font-serif text-2xl font-bold text-navy">
          Skill<span className="text-accent">Mark</span>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-navy mt-6 mb-1">Accessibility Statement</h1>
        <p className="text-xs text-text-dim mb-8">Last updated: September 2026</p>

        <div className="bg-white border border-border rounded-xl p-8">
          <p className={p}>
            SkillMark is committed to making our website and application accessible to everyone,
            including people with disabilities. We want the trades community to be able to build a
            profile and show their work regardless of how they browse the web.
          </p>

          <h2 className={h2}>Our standard</h2>
          <p className={p}>
            We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These
            guidelines explain how to make web content more accessible to people with a wide range of
            abilities. Accessibility is an ongoing effort, and we work to improve the experience over
            time.
          </p>

          <h2 className={h2}>What we&apos;ve done</h2>
          <p className={p}>
            We build with semantic HTML and landmark regions, provide a &quot;skip to content&quot;
            link and visible keyboard focus indicators, label interactive controls for screen
            readers, honor the &quot;reduce motion&quot; setting, and aim for readable color contrast.
          </p>

          <h2 className={h2}>Known limitations</h2>
          <p className={p}>
            Some areas are still being improved, and content uploaded by users (such as project
            photos) may not always include descriptive text. We are actively working to close
            remaining gaps.
          </p>

          <h2 className={h2}>Feedback</h2>
          <p className={p}>
            If you run into an accessibility barrier on SkillMark, please tell us through the contact
            options at joinskillmark.com. Let us know the page and the problem, and we&apos;ll do our
            best to fix it promptly and provide the information you need in an accessible way.
          </p>
        </div>
      </div>
    </main>
  );
}
