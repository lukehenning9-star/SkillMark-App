"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";

const labelClass =
  "block text-[11px] font-semibold text-text-mid uppercase tracking-wide mb-1.5";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main className="min-h-screen bg-sm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="https://joinskillmark.com"
            className="font-serif text-3xl font-bold text-navy"
          >
            Skill<span className="text-accent">Mark</span>
          </Link>
          <p className="mt-2 text-text-mid text-sm">Welcome back</p>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm p-8">
          <form action={action} className="space-y-4">
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="marcus@email.com"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                name="password"
                type="password"
                placeholder="Your password"
                required
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
              className="w-full bg-navy text-white font-semibold text-[15px] py-3 rounded-md hover:bg-navy-mid transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none cursor-pointer mt-1"
            >
              {pending ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-dim mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-accent font-semibold hover:underline"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  );
}
