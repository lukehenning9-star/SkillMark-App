"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, UserMinus, Users } from "lucide-react";
import { acceptConnectionRequest, removeConnection } from "@/app/actions/connections";
import { respondToInvite } from "@/app/actions/collaborators";

type ProfileLite = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  trade: string | null;
};
export type ConnRow = { id: string; otherId: string; profile: ProfileLite };
export type InviteRow = { id: string; projectId: string; projectTitle: string };

function Avatar({ p }: { p: ProfileLite }) {
  const name = p.full_name || p.username;
  return (
    <div className="w-10 h-10 rounded-full bg-navy-mid overflow-hidden flex items-center justify-center relative shrink-0">
      {p.avatar_url ? (
        <Image src={p.avatar_url} alt={name} fill sizes="40px" className="object-cover" />
      ) : (
        <span className="text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

function PersonRow({ p, children }: { p: ProfileLite; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/${p.username}`} className="shrink-0">
        <Avatar p={p} />
      </Link>
      <Link href={`/${p.username}`} className="flex-1 min-w-0 hover:opacity-80">
        <p className="text-sm font-semibold text-navy truncate">{p.full_name || p.username}</p>
        <p className="text-xs text-text-dim truncate">
          @{p.username}
          {p.trade ? ` · ${p.trade}` : ""}
        </p>
      </Link>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

export default function ConnectionsClient({
  incoming,
  following,
  connected,
  invites,
}: {
  incoming: ConnRow[];
  following: ConnRow[];
  connected: ConnRow[];
  invites: InviteRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  const sectionTitle = "text-xs font-semibold text-text-dim uppercase tracking-wide mb-1 mt-6 flex items-center gap-2";

  return (
    <div className="bg-white border border-border rounded-xl px-5 py-2 divide-y divide-border">
      {invites.length > 0 && (
        <div className="pb-2">
          <p className={sectionTitle}>Project invites</p>
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Users size={16} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy">
                  Invited to collaborate on{" "}
                  <Link href={`/projects/${inv.projectId}`} className="font-semibold text-accent hover:underline">
                    {inv.projectTitle}
                  </Link>
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => respondToInvite(inv.id, true))}
                className="inline-flex items-center gap-1 text-xs font-semibold bg-accent text-white px-3 py-1.5 rounded-md hover:bg-[#1e3a8a] disabled:opacity-50"
              >
                <Check size={13} /> Join
              </button>
              <button
                type="button"
                disabled={pending}
                aria-label="Decline invite"
                onClick={() => run(() => respondToInvite(inv.id, false))}
                className="inline-flex items-center text-text-dim hover:text-red-600 px-2 py-1.5 disabled:opacity-50"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {incoming.length > 0 && (
        <div className="pb-2">
          <p className={sectionTitle}>Requests ({incoming.length})</p>
          {incoming.map((r) => (
            <PersonRow key={r.id} p={r.profile}>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => acceptConnectionRequest(r.otherId))}
                className="inline-flex items-center gap-1 text-xs font-semibold bg-accent text-white px-3 py-1.5 rounded-md hover:bg-[#1e3a8a] disabled:opacity-50"
              >
                <Check size={13} /> Accept
              </button>
              <button
                type="button"
                disabled={pending}
                aria-label="Decline request"
                onClick={() => run(() => removeConnection(r.otherId))}
                className="inline-flex items-center text-text-dim hover:text-red-600 px-2 py-1.5 disabled:opacity-50"
              >
                <X size={15} />
              </button>
            </PersonRow>
          ))}
        </div>
      )}

      <div className="pb-2">
        <p className={sectionTitle}>Connected ({connected.length})</p>
        {connected.length === 0 ? (
          <p className="text-sm text-text-dim py-3">No connections yet. Find people from Search or their profile.</p>
        ) : (
          connected.map((r) => (
            <PersonRow key={r.id} p={r.profile}>
              <button
                type="button"
                disabled={pending}
                aria-label="Disconnect"
                onClick={() => run(() => removeConnection(r.otherId))}
                className="inline-flex items-center gap-1 text-xs font-semibold text-text-dim border border-border px-3 py-1.5 rounded-md hover:border-red-300 hover:text-red-600 disabled:opacity-50"
              >
                <UserMinus size={13} /> Remove
              </button>
            </PersonRow>
          ))
        )}
      </div>

      {following.length > 0 && (
        <div className="pb-2">
          <p className={sectionTitle}>Following (pending) ({following.length})</p>
          {following.map((r) => (
            <PersonRow key={r.id} p={r.profile}>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeConnection(r.otherId))}
                className="inline-flex items-center gap-1 text-xs font-semibold text-text-dim border border-border px-3 py-1.5 rounded-md hover:border-border2 disabled:opacity-50"
              >
                Withdraw
              </button>
            </PersonRow>
          ))}
        </div>
      )}
    </div>
  );
}
