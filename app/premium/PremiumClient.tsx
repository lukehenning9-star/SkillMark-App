"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession, createPortalSession } from "@/app/actions/billing";

export default function PremiumClient({
  loggedIn,
  enabled,
  hasStripeSub,
}: {
  loggedIn: boolean;
  enabled: boolean;
  hasStripeSub: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go(action: () => Promise<{ url?: string | null; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await action();
      if (res.url) window.location.href = res.url;
      else if (res.error) setError(res.error);
    });
  }

  if (!loggedIn) {
    return (
      <a href="/login" className="inline-flex items-center justify-center w-full text-sm font-semibold bg-accent text-white px-4 py-3 rounded-md hover:bg-[#1e3a8a] transition-colors">
        Log in to upgrade
      </a>
    );
  }

  if (hasStripeSub) {
    return (
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => go(createPortalSession)}
          className="w-full text-sm font-semibold border border-border text-navy px-4 py-3 rounded-md hover:border-border2 transition-colors disabled:opacity-50"
        >
          Manage billing
        </button>
        {error && <p className="text-xs text-red-600 mt-2 text-center">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending || !enabled}
        onClick={() => go(createCheckoutSession)}
        className="w-full text-sm font-semibold bg-accent text-white px-4 py-3 rounded-md hover:bg-[#1e3a8a] transition-colors disabled:opacity-60"
      >
        {enabled ? "Upgrade to Premium" : "Coming soon"}
      </button>
      {!enabled && (
        <p className="text-[11px] text-text-dim mt-2 text-center">
          Card payments aren&apos;t switched on yet — you can still earn free Premium months by inviting people.
        </p>
      )}
      {error && <p className="text-xs text-red-600 mt-2 text-center">{error}</p>}
    </div>
  );
}
