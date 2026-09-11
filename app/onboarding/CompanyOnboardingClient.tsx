"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfileStep, completeOnboarding } from "@/app/actions/profile";
import { US_STATES, TRADES, COMPANY_SIZES } from "@/lib/constants";
import AutocompleteInput from "@/components/AutocompleteInput";
import SkillTagInput from "@/components/SkillTagInput";

const TOTAL_STEPS = 3;

export default function CompanyOnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState("");
  const [size, setSize] = useState("");
  const [hiring, setHiring] = useState(true);
  const [hiringTrades, setHiringTrades] = useState<string[]>([]);

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  function handleError(msg: string) {
    setError(msg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      let result: { error?: string; success?: boolean } | undefined;

      if (step === 1) {
        if (!companyName.trim()) { handleError("Please enter your company name."); return; }
        result = await saveProfileStep({ full_name: companyName.trim() });
      } else if (step === 2) {
        if (!industry.trim()) { handleError("Please enter your primary trade or industry."); return; }
        if (!city.trim() || !state) { handleError("Please enter your city and state."); return; }
        result = await saveProfileStep({ trade: industry.trim(), city: city.trim(), state });
      } else if (step === 3) {
        result = await saveProfileStep({
          bio: about.trim() || null,
          website: website.trim() || null,
          company_size: size || null,
          is_available: hiring,
          hiring_trades: hiringTrades,
        });
        if (result?.error) { handleError(result.error); return; }
        const done = await completeOnboarding();
        if (done?.error || !done?.username) {
          handleError(done?.error ?? "Something went wrong. Please try again.");
          return;
        }
        router.push(`/${done.username}`);
        return;
      }

      if (result?.error) { handleError(result.error); return; }
      setStep((s) => s + 1);
    });
  }

  async function handleSkip() {
    if (isPending) return;
    startTransition(async () => {
      const done = await completeOnboarding();
      if (done?.error || !done?.username) {
        handleError(done?.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(`/${done.username}`);
    });
  }

  const inputClass = "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
  const labelClass = "block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5";

  return (
    <main className="min-h-screen bg-sm-bg flex flex-col">
      <nav className="bg-white border-b border-border h-14 flex items-center px-6 flex-shrink-0">
        <span className="font-serif text-xl font-bold text-navy">
          Skill<span className="text-accent">Mark</span>
        </span>
        <span className="ml-4 text-sm text-text-dim">Set up your company</span>
      </nav>

      <div className="h-1 bg-border">
        <div className="h-1 bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-lg">
          <p className="text-xs text-text-dim mb-2 font-mono">Step {step} of {TOTAL_STEPS}</p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="bg-white border border-border rounded-xl shadow-sm p-8">
              <h1 className="font-serif text-2xl font-bold text-navy mb-1">What&apos;s your company called?</h1>
              <p className="text-text-dim text-sm mb-6">This is the name tradespeople will see on your business page.</p>
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-xl bg-navy/10 border-2 border-dashed border-border2 flex items-center justify-center mb-2">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9aa3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/>
                  </svg>
                </div>
                <p className="text-xs text-text-dim">Add a company logo after setup</p>
              </div>
              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Waco Electric Co."
                  className={inputClass}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white border border-border rounded-xl shadow-sm p-8 space-y-5">
              <div>
                <h1 className="font-serif text-2xl font-bold text-navy mb-1">What do you do, and where?</h1>
                <p className="text-text-dim text-sm">Your primary trade and location help the right professionals find you.</p>
              </div>
              <div>
                <label className={labelClass}>Primary Trade / Industry</label>
                <AutocompleteInput
                  value={industry}
                  onChange={setIndustry}
                  suggestions={TRADES}
                  placeholder="e.g. Electrical, Plumbing, HVAC…"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Waco" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <select value={state} onChange={(e) => setState(e.target.value)} className={`${inputClass} cursor-pointer appearance-none`}>
                    <option value="">Select...</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border border-border rounded-xl shadow-sm p-8 space-y-5">
              <div>
                <h1 className="font-serif text-2xl font-bold text-navy mb-1">Tell professionals about you</h1>
                <p className="text-text-dim text-sm">All optional, but a fuller page gets more interest from tradespeople.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`${labelClass} mb-0`}>About</label>
                  <span className="text-[11px] text-text-dim font-mono">{about.length}/300</span>
                </div>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value.slice(0, 300))}
                  rows={3}
                  placeholder="What your company does, the kind of jobs you run, and what you look for in the crews you hire..."
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="wacoelectric.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Company Size</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)} className={`${inputClass} cursor-pointer appearance-none`}>
                    <option value="">Select...</option>
                    {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} people</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Trades You Hire For</label>
                <SkillTagInput
                  value={hiringTrades}
                  onChange={setHiringTrades}
                  suggestions={TRADES}
                  placeholder="Add trades and press Enter…"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-sm-bg rounded-xl border border-border">
                <div>
                  <p className="text-sm font-semibold text-navy">Actively hiring</p>
                  <p className="text-xs text-text-dim mt-0.5">Show a badge so professionals know you&apos;re looking</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHiring((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${hiring ? "bg-emerald-500" : "bg-border2"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${hiring ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-5">
            {step > 1 && (
              <button type="button" onClick={() => { setError(null); setStep((s) => s - 1); }}
                className="px-5 py-2.5 text-sm font-semibold border border-border text-text-mid rounded-md hover:bg-white transition-colors cursor-pointer">
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              className="flex-1 bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-mid transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none cursor-pointer text-sm"
            >
              {isPending ? "Saving…" : step === TOTAL_STEPS ? "Finish Setup →" : "Save & Continue →"}
            </button>
            {step === TOTAL_STEPS && (
              <button type="button" onClick={handleSkip} disabled={isPending}
                className="px-5 py-2.5 text-sm font-semibold text-text-dim hover:text-navy transition-colors cursor-pointer">
                Skip →
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
