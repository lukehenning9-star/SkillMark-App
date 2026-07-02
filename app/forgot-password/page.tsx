"use client";

import Link from "next/link";
import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset } from "@/app/actions/auth";

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-mid uppercase tracking-wide mb-1.5";

function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "expired";

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm p-8">
      {state?.message ? (
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-sm text-text-mid leading-relaxed">{state.message}</p>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          {linkExpired && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              That reset link has expired or was already used. Request a new one below.
            </p>
          )}
          <div>
            <label className={labelClass}>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="marcus@email.com"
              required
              autoComplete="email"
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
            {pending ? "Sending…" : "Send Reset Link →"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-sm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-bold text-navy">
            Skill<span className="text-accent">Mark</span>
          </Link>
          <p className="mt-2 text-text-mid text-sm">Reset your password</p>
        </div>

        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>

        <p className="text-center text-sm text-text-dim mt-6">
          Remembered it?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
