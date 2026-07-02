"use client";

import Link from "next/link";
import { useActionState, useState, useEffect, useCallback, useRef } from "react";
import { signup } from "@/app/actions/auth";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [role, setRole] = useState<"worker" | "contractor">("worker");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const checkSeq = useRef(0);
  const checkUsername = useCallback(async (value: string) => {
    const seq = ++checkSeq.current;
    if (value.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/check-username?username=${encodeURIComponent(value)}`);
      const json = await res.json();
      if (seq !== checkSeq.current) return; // stale response — a newer check is in flight
      setUsernameStatus(json.available ? "available" : "taken");
    } catch {
      if (seq === checkSeq.current) setUsernameStatus("idle");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  if (state?.message) {
    return (
      <main className="min-h-screen bg-sm-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-border rounded-xl p-10 shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-navy font-bold mb-2">Check your email</h2>
            <p className="text-text-dim text-sm leading-relaxed">{state.message}</p>
            <Link href="/login" className="inline-block mt-6 text-accent text-sm font-semibold hover:underline">
              Go to Login →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sm-bg flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="https://joinskillmark.com" className="font-serif text-3xl font-bold text-navy">
            Skill<span className="text-accent">Mark</span>
          </Link>
          <p className="mt-2 text-text-dim text-sm">The skills network for the trades</p>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 border-b border-border">
            {(["worker", "contractor"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                  role === r
                    ? "bg-white text-navy border-b-2 border-accent"
                    : "bg-sm-bg text-text-dim hover:text-navy"
                }`}
              >
                {r === "worker" ? "I Work in the Trades" : "I Hire Trade Workers"}
              </button>
            ))}
          </div>

          <div className="p-8">
            <form action={action} className="space-y-4">
              <input type="hidden" name="role" value={role} />

              <div>
                <label className={labelClass}>Email Address</label>
                <input name="email" type="email" placeholder="marcus@email.com" required className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Username</label>
                <div className="relative">
                  <input
                    name="username"
                    type="text"
                    placeholder="marcus_rivera"
                    required
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30))
                    }
                    className={`${inputClass} pr-8 ${
                      usernameStatus === "taken"
                        ? "border-red-400 focus:border-red-400"
                        : usernameStatus === "available"
                        ? "border-emerald-400 focus:border-emerald-400"
                        : ""
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && (
                      <div className="w-3.5 h-3.5 border-2 border-text-dim border-t-transparent rounded-full animate-spin" />
                    )}
                    {usernameStatus === "available" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {usernameStatus === "taken" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                  </div>
                </div>
                {usernameStatus === "taken" && (
                  <p className="text-xs text-red-500 mt-1">That username is already taken.</p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-xs text-emerald-600 mt-1">Username is available.</p>
                )}
                <p className="text-[11px] text-text-dim mt-1">
                  Your profile: joinskillmark.com/<span className="font-mono">{username || "username"}</span>
                </p>
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" required minLength={8} className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-navy transition-colors">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <input name="confirm_password" type={showConfirm ? "text" : "password"} placeholder="Repeat your password" required minLength={8} className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-navy transition-colors">
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>

              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={pending || usernameStatus === "taken" || usernameStatus === "checking"}
                className="w-full bg-accent text-white font-semibold text-[15px] py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
              >
                {pending ? "Creating account…" : "Create Account →"}
              </button>

              <p className="text-center text-[11px] text-text-dim">Free forever. No credit card required.</p>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-text-dim mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
