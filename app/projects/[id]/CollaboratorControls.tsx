"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, X, UserPlus, LogOut } from "lucide-react";
import {
  inviteCollaborator,
  requestToJoin,
  respondToJoinRequest,
  respondToInvite,
  removeCollaborator,
  updateContribution,
} from "@/app/actions/collaborators";

type PersonLite = { id: string; username: string; full_name: string | null; avatar_url: string | null };
type PendingRow = { id: string; profile: PersonLite };

export type MyCollab = { id: string; status: "invited" | "requested" | "accepted"; contribution: string | null };

function MiniAvatar({ p }: { p: PersonLite }) {
  const name = p.full_name || p.username;
  return (
    <div className="w-8 h-8 rounded-full bg-navy-mid overflow-hidden flex items-center justify-center relative shrink-0">
      {p.avatar_url ? (
        <Image src={p.avatar_url} alt={name} fill sizes="32px" className="object-cover" />
      ) : (
        <span className="text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export default function CollaboratorControls({
  projectId,
  isOwner,
  inviteCandidates,
  pendingRequests,
  myCollab,
  canRequestToJoin,
}: {
  projectId: string;
  isOwner: boolean;
  inviteCandidates: PersonLite[];
  pendingRequests: PendingRow[];
  myCollab: MyCollab | null;
  canRequestToJoin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [contribution, setContribution] = useState(myCollab?.contribution ?? "");
  const [saved, setSaved] = useState(false);

  function act(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Owner: pending join requests */}
      {isOwner && pendingRequests.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-navy mb-3">Join requests</h3>
          <div className="space-y-2">
            {pendingRequests.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <MiniAvatar p={r.profile} />
                <span className="text-sm text-navy flex-1 min-w-0 truncate">{r.profile.full_name || r.profile.username}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act(() => respondToJoinRequest(r.id, true))}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-accent text-white px-2.5 py-1 rounded-md hover:bg-[#1e3a8a] disabled:opacity-50"
                >
                  <Check size={12} /> Approve
                </button>
                <button
                  type="button"
                  disabled={pending}
                  aria-label="Deny request"
                  onClick={() => act(() => respondToJoinRequest(r.id, false))}
                  className="text-text-dim hover:text-red-600 disabled:opacity-50"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Owner: invite a connection */}
      {isOwner && inviteCandidates.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-navy mb-3">Invite a connection</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {inviteCandidates.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <MiniAvatar p={p} />
                <span className="text-sm text-navy flex-1 min-w-0 truncate">{p.full_name || p.username}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act(() => inviteCollaborator(projectId, p.id))}
                  className="inline-flex items-center gap-1 text-xs font-semibold border border-border text-navy px-2.5 py-1 rounded-md hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  <UserPlus size={12} /> Invite
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-owner: request to join */}
      {!isOwner && canRequestToJoin && (
        <button
          type="button"
          disabled={pending}
          onClick={() => act(() => requestToJoin(projectId))}
          className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold bg-accent text-white px-4 py-2.5 rounded-md hover:bg-[#1e3a8a] disabled:opacity-50"
        >
          <UserPlus size={15} /> Request to join
        </button>
      )}

      {/* Invitee: respond to an invite */}
      {myCollab?.status === "invited" && (
        <div className="bg-accent/5 border border-accent-border rounded-xl p-4">
          <p className="text-sm text-navy mb-3">You&apos;ve been invited to collaborate on this project.</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => act(() => respondToInvite(myCollab.id, true))}
              className="inline-flex items-center gap-1 text-sm font-semibold bg-accent text-white px-4 py-2 rounded-md hover:bg-[#1e3a8a] disabled:opacity-50"
            >
              <Check size={14} /> Join project
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => act(() => respondToInvite(myCollab.id, false))}
              className="inline-flex items-center gap-1 text-sm font-semibold border border-border text-text-dim px-4 py-2 rounded-md hover:border-border2 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Requester: pending */}
      {myCollab?.status === "requested" && (
        <div className="bg-white border border-border rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-text-dim">Join request pending…</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => act(() => removeCollaborator(myCollab.id))}
            className="text-xs font-semibold text-text-dim hover:text-red-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Accepted collaborator: edit own contribution + leave */}
      {myCollab?.status === "accepted" && (
        <div className="bg-white border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-navy mb-2">Your contribution</h3>
          <p className="text-[11px] text-text-dim mb-2">Shown on your profile for this project.</p>
          <textarea
            value={contribution}
            onChange={(e) => { setContribution(e.target.value); setSaved(false); }}
            rows={3}
            maxLength={2000}
            placeholder="What did you do on this project?"
            className="w-full bg-sm-bg border border-border rounded-md px-3 py-2 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => act(async () => { await updateContribution(myCollab.id, contribution); setSaved(true); })}
              className="text-sm font-semibold bg-navy text-white px-3 py-1.5 rounded-md hover:bg-navy-mid disabled:opacity-50"
            >
              {saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => act(() => removeCollaborator(myCollab.id))}
              className="inline-flex items-center gap-1 text-xs font-semibold text-text-dim hover:text-red-600 disabled:opacity-50"
            >
              <LogOut size={13} /> Leave project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
