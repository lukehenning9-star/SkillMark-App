"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function ReferralClient({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(link).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {}
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Your referral link"
        className="flex-1 min-w-0 bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy focus:outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 text-sm font-semibold bg-accent text-white px-4 py-2.5 rounded-md hover:bg-[#1e3a8a] transition-colors shrink-0"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
