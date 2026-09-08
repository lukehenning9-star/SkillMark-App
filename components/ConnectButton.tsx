"use client";

import { useState, useTransition } from "react";
import { UserPlus, Check, Clock, UserMinus } from "lucide-react";
import { sendConnectionRequest, removeConnection } from "@/app/actions/connections";

export type ConnectionState = "none" | "pending_out" | "pending_in" | "connected";

export default function ConnectButton({
  targetId,
  initialState,
  size = "md",
}: {
  targetId: string;
  initialState: ConnectionState;
  size?: "sm" | "md";
}) {
  const [state, setState] = useState<ConnectionState>(initialState);
  const [pending, startTransition] = useTransition();

  const base =
    size === "sm"
      ? "text-xs px-3 py-1.5 gap-1.5"
      : "text-sm px-4 py-2 gap-2";
  const iconSize = size === "sm" ? 13 : 15;

  function connect() {
    startTransition(async () => {
      const res = await sendConnectionRequest(targetId);
      if ("error" in res && res.error) return;
      if ("status" in res) setState(res.status === "accepted" ? "connected" : "pending_out");
    });
  }

  function disconnect() {
    startTransition(async () => {
      const res = await removeConnection(targetId);
      if (!("error" in res && res.error)) setState("none");
    });
  }

  if (state === "connected") {
    return (
      <button
        type="button"
        onClick={disconnect}
        disabled={pending}
        className={`inline-flex items-center rounded-md font-semibold border border-border bg-white text-navy hover:border-border2 transition-colors disabled:opacity-50 ${base} group`}
      >
        <Check size={iconSize} className="text-accent group-hover:hidden" />
        <UserMinus size={iconSize} className="hidden group-hover:inline text-red-600" />
        <span className="group-hover:hidden">Connected</span>
        <span className="hidden group-hover:inline">Disconnect</span>
      </button>
    );
  }

  if (state === "pending_out") {
    return (
      <button
        type="button"
        onClick={disconnect}
        disabled={pending}
        className={`inline-flex items-center rounded-md font-semibold border border-border bg-white text-text-dim hover:border-border2 transition-colors disabled:opacity-50 ${base}`}
      >
        <Clock size={iconSize} />
        Requested
      </button>
    );
  }

  if (state === "pending_in") {
    // They already requested us — sending "connect" accepts it.
    return (
      <button
        type="button"
        onClick={connect}
        disabled={pending}
        className={`inline-flex items-center rounded-md font-semibold bg-accent text-white hover:bg-[#1e3a8a] transition-colors disabled:opacity-50 ${base}`}
      >
        <Check size={iconSize} />
        Accept
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={pending}
      className={`inline-flex items-center rounded-md font-semibold bg-accent text-white hover:bg-[#1e3a8a] transition-colors disabled:opacity-50 ${base}`}
    >
      <UserPlus size={iconSize} />
      Connect
    </button>
  );
}
