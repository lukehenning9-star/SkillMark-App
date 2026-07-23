"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/app/actions/auth";

export default function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-red-200 rounded-xl p-6">
      <h2 className="font-semibold text-red-700 text-sm">Danger Zone</h2>
      <p className="text-xs text-text-dim mt-1 mb-4">
        Permanently delete your account and all of your data — profile, projects,
        photos, work history, certifications, and messages. This cannot be undone.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-semibold text-red-600 border border-red-300 px-4 py-2 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
        >
          Delete Account
        </button>
      ) : (
        <div className="space-y-3">
          <label className="block text-[11px] font-semibold text-text-dim uppercase tracking-wide">
            Type <span className="font-mono text-red-600">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-red-400 focus:bg-white transition-all"
            autoFocus
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirmText(""); setError(null); }}
              className="flex-1 text-sm font-semibold text-text-dim border border-border py-2 rounded-md hover:bg-sm-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending || confirmText !== "DELETE"}
              className="flex-1 text-sm font-semibold text-white bg-red-600 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {pending ? "Deleting…" : "Permanently Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
