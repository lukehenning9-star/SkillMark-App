"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfileStep, addWorkExperience, completeOnboarding } from "@/app/actions/profile";
import { US_STATES } from "@/lib/constants";

function ZapIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function DropletIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
}
function WindIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>;
}
function HammerIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0v0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.35 7.35A5.5 5.5 0 0 0 11 11l1 1"/></svg>;
}
function FlameIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
}
function GearIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93a10 10 0 0 0 14.14 14.14"/></svg>;
}
function HouseIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function BrushIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1.02 3.5 1.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-2.5-3.02z"/></svg>;
}
function LayersIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
}
function TruckIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}
function WrenchIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
}

const TRADES = [
  { label: "Electrician", icon: <ZapIcon /> },
  { label: "Plumber", icon: <DropletIcon /> },
  { label: "HVAC Technician", icon: <WindIcon /> },
  { label: "Carpenter", icon: <HammerIcon /> },
  { label: "Welder", icon: <FlameIcon /> },
  { label: "Pipefitter", icon: <GearIcon /> },
  { label: "Roofer", icon: <HouseIcon /> },
  { label: "Painter", icon: <BrushIcon /> },
  { label: "Concrete Worker", icon: <LayersIcon /> },
  { label: "Heavy Equipment Operator", icon: <TruckIcon /> },
  { label: "Other", icon: <WrenchIcon /> },
];

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
  const [tradeCustom, setTradeCustom] = useState("");
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
        if (!trade) { handleError("Please select your trade."); return; }
        const effectiveTrade = trade === "Other" ? (tradeCustom.trim() || "Other") : trade;
        result = await saveProfileStep({ trade: effectiveTrade });
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
              <p className="text-text-dim text-sm mb-6">Select the primary trade you work in.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TRADES.map(({ label, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setTrade(label)}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      trade === label
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-border bg-sm-bg text-text-mid hover:border-border2 hover:bg-white"
                    }`}
                  >
                    {icon}
                    <span className="text-xs font-semibold text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
              {trade === "Other" && (
                <div className="mt-4">
                  <label className={labelClass}>Specify your trade</label>
                  <input
                    type="text"
                    value={tradeCustom}
                    onChange={(e) => setTradeCustom(e.target.value)}
                    placeholder="e.g. Ironworker, Glazier, Tile Setter"
                    className={inputClass}
                    autoFocus
                  />
                </div>
              )}
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
