"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfileStep, addWorkExperience, completeOnboarding } from "@/app/actions/profile";
import { US_STATES, TRADES } from "@/lib/constants";
import AutocompleteInput from "@/components/AutocompleteInput";

const LEVELS = [
  {
    value: "apprentice",
    label: "Apprentice",
    description:
      "You're learning the trade, working under supervision, and earning while you learn. This is where every great tradesperson starts.",
  },
  {
    value: "journeyman",
    label: "Journeyman",
    description:
      "You're licensed and working independently. You've put in the years and earned the right to work on your own.",
  },
  {
    value: "master",
    label: "Master",
    description:
      "You're licensed to supervise crews, pull permits, and take full accountability for a job. The highest level in the trade.",
  },
];

const TOTAL_STEPS = 5;

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [trade, setTrade] = useState("");
  const [level, setLevel] = useState("");
  const [years, setYears] = useState(0);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [bio, setBio] = useState("");
  const [available, setAvailable] = useState(true);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  function handleError(msg: string) {
    setError(msg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish(username: string | null) {
    router.push(username ? `/${username}` : "/");
  }

  function handleNext() {
    setError(null);
    startTransition(async () => {
      let result: { error?: string; success?: boolean } | undefined;

      if (step === 1) {
        if (!fullName.trim()) { handleError("Please enter your full name."); return; }
        result = await saveProfileStep({ full_name: fullName.trim() });
      } else if (step === 2) {
        if (!trade.trim()) { handleError("Please enter your trade."); return; }
        result = await saveProfileStep({ trade: trade.trim() });
      } else if (step === 3) {
        if (!level) { handleError("Please select your experience level."); return; }
        result = await saveProfileStep({ experience_level: level });
      } else if (step === 4) {
        if (!city.trim() || !state) { handleError("Please enter your city and state."); return; }
        result = await saveProfileStep({
          years_experience: years,
          city: city.trim(),
          state,
          bio: bio.trim(),
          is_available: available,
        });
      } else if (step === 5) {
        if (jobTitle && companyName && startDate) {
          result = await addWorkExperience({
            job_title: jobTitle,
            company_name: companyName,
            start_date: startDate,
            end_date: isCurrent ? undefined : endDate || undefined,
            is_current: isCurrent,
          });
          if (result?.error) { handleError(result.error); return; }
        }
        const done = await completeOnboarding();
        if (done?.error) { handleError(done.error); return; }
        finish(done?.username ?? null);
        return;
      }

      if (result?.error) { handleError(result.error); return; }
      setStep((s) => s + 1);
    });
  }

  async function handleSkip() {
    startTransition(async () => {
      const done = await completeOnboarding();
      finish(done?.username ?? null);
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
        <span className="ml-4 text-sm text-text-dim">Set up your profile</span>
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
              <h1 className="font-serif text-2xl font-bold text-navy mb-1">What&apos;s your name?</h1>
              <p className="text-text-dim text-sm mb-6">This is how contractors will see you on your profile.</p>
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-navy/10 border-2 border-dashed border-border2 flex items-center justify-center mb-2">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9aa3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <p className="text-xs text-text-dim">Profile photo &mdash; add after setup</p>
              </div>
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Marcus Rivera"
                  className={inputClass}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white border border-border rounded-xl shadow-sm p-8">
              <h1 className="font-serif text-2xl font-bold text-navy mb-1">What&apos;s your trade?</h1>
              <p className="text-text-dim text-sm mb-6">Type to search, or enter your own if it&apos;s not listed.</p>
              <AutocompleteInput
                value={trade}
                onChange={setTrade}
                suggestions={TRADES}
                placeholder="e.g. Electrician, Welder, Pipefitter…"
                className={inputClass}
                autoFocus
              />
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border border-border rounded-xl shadow-sm p-8">
              <h1 className="font-serif text-2xl font-bold text-navy mb-1">What&apos;s your experience level?</h1>
              <p className="text-text-dim text-sm mb-6">Be honest &mdash; contractors respect tradespeople at every level.</p>
              <div className="space-y-3">
                {LEVELS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLevel(value)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
                      level === value
                        ? "border-accent bg-accent/5"
                        : "border-border bg-sm-bg hover:border-border2 hover:bg-white"
                    }`}
                  >
                    <div className={`text-sm font-bold mb-1 ${level === value ? "text-accent" : "text-navy"}`}>{label}</div>
                    <div className="text-xs text-text-dim leading-relaxed">{description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-white border border-border rounded-xl shadow-sm p-8 space-y-5">
              <div>
                <h1 className="font-serif text-2xl font-bold text-navy mb-1">Your details</h1>
                <p className="text-text-dim text-sm">Help contractors know where you are and what you&apos;re looking for.</p>
              </div>
              <div>
                <label className={labelClass}>Years of Experience</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setYears((y) => Math.max(0, y - 1))}
                    className="w-9 h-9 rounded-md border border-border bg-sm-bg text-navy font-bold text-lg hover:bg-white transition-colors cursor-pointer flex items-center justify-center">−</button>
                  <span className="text-2xl font-bold text-navy w-10 text-center">{years}</span>
                  <button type="button" onClick={() => setYears((y) => Math.min(50, y + 1))}
                    className="w-9 h-9 rounded-md border border-border bg-sm-bg text-navy font-bold text-lg hover:bg-white transition-colors cursor-pointer flex items-center justify-center">+</button>
                </div>
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
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`${labelClass} mb-0`}>Bio</label>
                  <span className="text-[11px] text-text-dim font-mono">{bio.length}/300</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 300))}
                  rows={3}
                  placeholder="Tell contractors what you do best and what kind of work you're looking for..."
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-sm-bg rounded-xl border border-border">
                <div>
                  <p className="text-sm font-semibold text-navy">Available for new work</p>
                  <p className="text-xs text-text-dim mt-0.5">Contractors can see you&apos;re open to hire</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAvailable((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${available ? "bg-emerald-500" : "bg-border2"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${available ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="bg-white border border-border rounded-xl shadow-sm p-8 space-y-5">
              <div>
                <h1 className="font-serif text-2xl font-bold text-navy mb-1">Add your first job</h1>
                <p className="text-text-dim text-sm">Optional &mdash; but profiles with work history get significantly more contractor attention.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Job Title</label>
                  <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Journeyman Electrician" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Waco Electric Co." className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start Date</label>
                  <input type="month" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>End Date</label>
                  <input type="month" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isCurrent} className={`${inputClass} disabled:opacity-50`} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="accent-accent" />
                <span className="text-sm text-navy">I currently work here</span>
              </label>
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
