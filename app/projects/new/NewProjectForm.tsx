"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProject } from "@/app/actions/projects";
import { PROJECT_SKILLS, TRADES } from "@/lib/constants";

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5";

export default function NewProjectForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [tradeCat, setTradeCat] = useState("");
  const [tradeCatCustom, setTradeCatCustom] = useState("");

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    selectedSkills.forEach((s) => data.append("specific_skills", s));

    setError(null);
    startTransition(async () => {
      const result = await createProject(data);
      if (result && "error" in result) {
        setError(result.error ?? null);
      } else if (result && "id" in result) {
        router.push(`/projects/${result.id}`);
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-text-dim hover:text-navy flex items-center gap-1.5 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="font-serif text-2xl font-bold text-navy">Add a Project</h1>
        <p className="text-text-dim text-sm mt-1">Document your work and build your verified portfolio.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-navy text-sm">Project Details</h2>

          <div>
            <label className={labelClass}>Project Title</label>
            <input name="title" type="text" placeholder="200A Panel Upgrade — residential" required className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Trade Category</label>
              <input type="hidden" name="trade_category" value={tradeCat === "Other" ? tradeCatCustom : tradeCat} />
              {tradeCat === "Other" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tradeCatCustom}
                    onChange={(e) => setTradeCatCustom(e.target.value)}
                    placeholder="e.g. Mason, Ironworker…"
                    className={inputClass}
                    autoFocus
                  />
                  <button type="button" onClick={() => { setTradeCat(""); setTradeCatCustom(""); }} className="shrink-0 text-xs text-text-dim hover:text-navy whitespace-nowrap">
                    ← back
                  </button>
                </div>
              ) : (
                <select value={tradeCat} onChange={(e) => setTradeCat(e.target.value)} className={inputClass}>
                  <option value="">Select trade...</option>
                  {TRADES.map((t) => <option key={t}>{t}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className={labelClass}>Location (optional)</label>
              <input name="location" type="text" placeholder="Waco, TX" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Completion Date (optional)</label>
            <input name="completed_date" type="date" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Description (optional)</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Describe what you did, the scope of work, any challenges you solved..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="font-semibold text-navy text-sm mb-1">Skills Used</h2>
          <p className="text-xs text-text-dim mb-3">Select all that apply.</p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors cursor-pointer ${
                  selectedSkills.includes(skill)
                    ? "bg-navy text-white border-navy"
                    : "bg-sm-bg text-text-dim border-border hover:border-border2 hover:text-navy"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 text-center py-3 border border-border rounded-md text-sm font-semibold text-navy hover:bg-sm-bg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-navy text-white font-semibold text-sm py-3 rounded-md hover:bg-navy-mid transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {pending ? "Saving…" : "Save Project →"}
          </button>
        </div>
      </form>
    </div>
  );
}
