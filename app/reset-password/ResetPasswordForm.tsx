"use client";

import { useActionState, useState } from "react";
import { updatePassword } from "@/app/actions/auth";

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-mid uppercase tracking-wide mb-1.5";

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  const [show, setShow] = useState(false);

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm p-8">
      <form action={action} className="space-y-4">
        <div>
          <label className={labelClass}>New Password</label>
          <div className="relative">
            <input
              name="password"
              type={show ? "text" : "password"}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-dim hover:text-navy transition-colors"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Confirm New Password</label>
          <input
            name="confirm_password"
            type={show ? "text" : "password"}
            placeholder="Repeat your new password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-accent text-white font-semibold text-[15px] py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
        >
          {pending ? "Updating…" : "Update Password →"}
        </button>
      </form>
    </div>
  );
}
