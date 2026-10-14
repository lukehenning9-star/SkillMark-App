"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

// Share a profile: the native share sheet on phones (so people can fire it
// straight into Messages / WhatsApp), with a copy-to-clipboard fallback on
// desktop browsers that don't support the Web Share API.
export default function ShareButton({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url.split("?")[0]; // clean link, no tracking query

  async function onShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${name} on SkillMark`,
          text: `Check out ${name}'s work on SkillMark`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // User dismissed the share sheet — don't fall through to copy.
        if (e instanceof Error && e.name === "AbortError") return;
        // Any other failure falls through to the clipboard copy below.
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — nothing more we can do silently.
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      title="Share profile"
      aria-label="Share profile"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy border border-border bg-white px-3 py-2 rounded-md hover:border-border2 transition-colors"
    >
      {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
      <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
    </button>
  );
}
