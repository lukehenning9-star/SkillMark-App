import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "SkillMark — The Skills Network for the Trades",
    template: "%s — SkillMark",
  },
  description:
    "SkillMark connects skilled tradespeople with contractors through real job photos and proven work, not resumes.",
  openGraph: {
    siteName: "SkillMark",
    type: "website",
    title: "SkillMark — The Skills Network for the Trades",
    description:
      "SkillMark connects skilled tradespeople with contractors through real job photos and proven work, not resumes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillMark — The Skills Network for the Trades",
    description:
      "SkillMark connects skilled tradespeople with contractors through real job photos and proven work, not resumes.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
