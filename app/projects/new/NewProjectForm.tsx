"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProject } from "@/app/actions/projects";
import { PROJECT_SKILLS, TRADES } from "@/lib/constants";
import SkillTagInput from "@/components/SkillTagInput";
import AutocompleteInput from "@/components/AutocompleteInput";

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
        // Land on the edit page so photos can be added immediately —
        // photo upload needs a project id, so it can't happen pre-create.
        router.push(`/projects/${result.id}/edit`);
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
        <p className="text-text-dim text-sm mt-1">Document your work and build your portfolio.</p>
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
              <input type="hidden" name="trade_category" value={tradeCat} />
              <AutocompleteInput
                value={tradeCat}
                onChange={setTradeCat}
                suggestions={TRADES}
                placeholder="e.g. Electrician, Welder…"
                className={inputClass}
              />
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
          <p className="text-xs text-text-dim mb-3">Type to search or add your own — press Enter to add.</p>
          <SkillTagInput
            value={selectedSkills}
            onChange={setSelectedSkills}
            suggestions={PROJECT_SKILLS}
          />
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
            {pending ? "Saving…" : "Save & Add Photos →"}
          </button>
        </div>
      </form>
    </div>
  );
}
