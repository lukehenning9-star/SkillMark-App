"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addWorkExperience, deleteWorkExperience } from "@/app/actions/profile";
import type { WorkExperience } from "@/lib/types";

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5";

function formatMonth(d: string) {
  const iso = /^\d{4}-\d{2}$/.test(d) ? `${d}-01` : d;
  const date = new Date(iso + "T00:00:00");
  return isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function WorkExperienceSection({
  workExperience,
}: {
  workExperience: WorkExperience[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState("");

  function resetForm() {
    setJobTitle("");
    setCompanyName("");
    setStartDate("");
    setEndDate("");
    setIsCurrent(false);
    setDescription("");
    setError(null);
    setShowForm(false);
  }

  function handleAdd() {
    if (!jobTitle.trim()) { setError("Job title is required."); return; }
    if (!companyName.trim()) { setError("Company name is required."); return; }
    if (!startDate) { setError("Start date is required."); return; }
    if (!isCurrent && endDate && endDate < startDate) {
      setError("End date cannot be before start date.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addWorkExperience({
        job_title: jobTitle.trim(),
        company_name: companyName.trim(),
        start_date: startDate,
        end_date: isCurrent ? undefined : endDate || undefined,
        is_current: isCurrent,
        description: description.trim() || undefined,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        resetForm();
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Remove this job from your work history?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteWorkExperience(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy text-sm">Work Experience</h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold text-accent hover:underline cursor-pointer"
          >
            + Add Job
          </button>
        )}
      </div>

      {workExperience.length > 0 && (
        <ul className="space-y-2">
          {workExperience.map((job) => (
            <li key={job.id} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-semibold text-navy leading-tight">{job.job_title}</p>
                <p className="text-xs text-text-dim">{job.company_name}</p>
                <p className="text-xs text-text-dim">
                  {formatMonth(job.start_date)} – {job.is_current || !job.end_date ? "Present" : formatMonth(job.end_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(job.id)}
                disabled={deletingId === job.id}
                className="text-xs text-red-500 hover:text-red-700 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {deletingId === job.id ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {workExperience.length === 0 && !showForm && (
        <p className="text-sm text-text-dim">No work history added yet.</p>
      )}

      {showForm && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-sm-bg">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Job Title *</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Journeyman Electrician"
                className={inputClass}
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Waco Electric Co."
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start Date *</label>
              <input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isCurrent}
                className={`${inputClass} disabled:opacity-50`}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="accent-accent"
            />
            <span className="text-sm text-navy">I currently work here</span>
          </label>

          <div>
            <label className={labelClass}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              rows={2}
              placeholder="What kind of work did you do?"
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 text-sm font-semibold text-text-dim border border-border py-2 rounded-md hover:bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending}
              className="flex-1 text-sm font-semibold text-white bg-navy py-2 rounded-md hover:bg-navy-mid transition-colors disabled:opacity-50 cursor-pointer"
            >
              {pending ? "Saving…" : "Add Job"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
