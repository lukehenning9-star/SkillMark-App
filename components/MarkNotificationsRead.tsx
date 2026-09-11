"use client";

import { useEffect, useRef } from "react";
import { markNotificationsRead } from "@/app/actions/notifications";

// Marks the user's notifications read once the page is viewed.
export default function MarkNotificationsRead() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    markNotificationsRead().catch(() => {});
  }, []);
  return null;
}
