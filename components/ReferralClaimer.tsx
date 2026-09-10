"use client";

import { useEffect, useRef } from "react";
import { claimReferral } from "@/app/actions/referrals";

// Invisible: once a signed-in user lands, record any referral code captured at
// signup (cookie) exactly once. Safe no-op if there's nothing to claim.
export default function ReferralClaimer() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    claimReferral().catch(() => {});
  }, []);
  return null;
}
