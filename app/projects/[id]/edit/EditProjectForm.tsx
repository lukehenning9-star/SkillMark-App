"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { updateProject, saveProjectCoverPhoto, saveProjectBeforePhoto, saveProjectAfterPhoto } from "@/app/actions/projects";
import { getProjectPhotoUploadUrl, getProjectBeforePhotoUploadUrl, getProjectAfterPhotoUploadUrl } from "@/app/actions/upload";
import { PROJECT_SKILLS, TRADES } from "@/lib/constants";
import SkillTagInput from "@/components/SkillTagInput";
import AutocompleteInput from "@/components/AutocompleteInput";
import type { Project } from "@/lib/types";

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5";

export default function EditProjectForm({ project }: { project: Project }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(project.specific_skills ?? []);
  const [coverUrl, setCoverUrl] = useState<string | null>(project.cover_photo_url);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(project.before_photo_url ?? null);
  const [afterUrl, setAfterUrl] = useState<string | null>(project.after_photo_url ?? null);
  const [beforeUploading, setBeforeUploading] = useState(false);
  const [afterUploading, setAfterUploading] = useState(false);
  const [beforeError, setBeforeError] = useState<string | null>(null);
  const [afterError, setAfterError] = useState<string | null>(null);
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);
  const [tradeCat, setTradeCat] = useState(project.trade_category ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be 5MB or smaller.");
      return;
    }

    setPhotoError(null);
    setPhotoUploading(true);

    try {
      const result = await getProjectPhotoUploadUrl(project.id);
      if (!result || "error" in result) {
        setPhotoError(result?.error ?? "Could not get upload URL.");
        return;
      }

      const uploadRes = await fetch(result.signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        setPhotoError("Upload failed. Please try again.");
        return;
      }

      const saveResult = await saveProjectCoverPhoto(project.id, result.publicUrl);
      if (saveResult?.error) {
        setPhotoError(saveResult.error);
        return;
      }

      setCoverUrl(result.publicUrl);
    } catch {
      setPhotoError("Upload failed. Please try again.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleBeforePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setBeforeError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setBeforeError("Image must be 5MB or smaller."); return; }
    setBeforeError(null);
    setBeforeUploading(true);
    try {
      const result = await getProjectBeforePhotoUploadUrl(project.id);
      if (!result || "error" in result) { setBeforeError(result?.error ?? "Could not get upload URL."); return; }
      const uploadRes = await fetch(result.signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) { setBeforeError("Upload failed. Please try again."); return; }
      const saveResult = await saveProjectBeforePhoto(project.id, result.publicUrl);
      if (saveResult?.error) { setBeforeError(saveResult.error); return; }
      setBeforeUrl(result.publicUrl);
    } catch { setBeforeError("Upload failed. Please try again."); }
    finally { setBeforeUploading(false); if (beforeFileRef.current) beforeFileRef.current.value = ""; }
  }

  async function handleAfterPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAfterError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setAfterError("Image must be 5MB or smaller."); return; }
    setAfterError(null);
    setAfterUploading(true);
    try {
      const result = await getProjectAfterPhotoUploadUrl(project.id);
      if (!result || "error" in result) { setAfterError(result?.error ?? "Could not get upload URL."); return; }
      const uploadRes = await fetch(result.signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) { setAfterError("Upload failed. Please try again."); return; }
      const saveResult = await saveProjectAfterPhoto(project.id, result.publicUrl);
      if (saveResult?.error) { setAfterError(saveResult.error); return; }
      setAfterUrl(result.publicUrl);
    } catch { setAfterError("Upload failed. Please try again."); }
    finally { setAfterUploading(false); if (afterFileRef.current) afterFileRef.current.value = ""; }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    selectedSkills.forEach((s) => data.append("specific_skills", s));

    setError(null);
    startTransition(async () => {
      const result = await updateProject(project.id, data);
      if (result && "error" in result) {
        setError(result.error ?? null);
      } else {
        router.push(`/projects/${project.id}`);
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-text-dim hover:text-navy flex items-center gap-1.5 mb-3"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Project
        </Link>
        <h1 className="font-serif text-2xl font-bold text-navy">Edit Project</h1>
        <p className="text-text-dim text-sm mt-1">Update your project details and photos.</p>
      </div>

      {/* Cover photo */}
      <div className="bg-white border border-border rounded-xl overflow-hidden mb-5">
        <div className="aspect-video bg-sm-bg flex flex-col items-center justify-center relative">
          {coverUrl ? (
            <Image src={coverUrl} alt={project.title} fill className="object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          )}
          <div className={`absolute inset-0 flex items-center justify-center ${coverUrl ? "bg-black/40 opacity-0 hover:opacity-100" : ""} transition-opacity`}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="bg-white/90 text-navy text-xs font-semibold px-4 py-2 rounded-md hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
            >
              {photoUploading ? "Uploading…" : coverUrl ? "Change Photo" : "Add Cover Photo"}
            </button>
          </div>
          {!coverUrl && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="mt-3 text-xs font-semibold text-accent hover:underline disabled:opacity-60 cursor-pointer"
            >
              {photoUploading ? "Uploading…" : "Add Cover Photo"}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
        {photoError && (
          <p className="text-xs text-red-600 px-4 py-2 border-t border-red-100 bg-red-50">{photoError}</p>
        )}
        <p className="text-xs text-text-dim px-4 py-2 border-t border-border bg-sm-bg">
          Cover photo — shown on your profile grid and as the project thumbnail
        </p>
      </div>

      {/* Before / After photos */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Before */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="aspect-video bg-sm-bg flex flex-col items-center justify-center relative">
            {beforeUrl ? (
              <Image src={beforeUrl} alt="Before" fill className="object-cover" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            )}
            <div className={`absolute inset-0 flex items-center justify-center ${beforeUrl ? "bg-black/40 opacity-0 hover:opacity-100" : ""} transition-opacity`}>
              <button type="button" onClick={() => beforeFileRef.current?.click()} disabled={beforeUploading}
                className="bg-white/90 text-navy text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white transition-colors disabled:opacity-60 cursor-pointer">
                {beforeUploading ? "Uploading…" : beforeUrl ? "Change" : "Add Photo"}
              </button>
            </div>
            {!beforeUrl && (
              <button type="button" onClick={() => beforeFileRef.current?.click()} disabled={beforeUploading}
                className="mt-2 text-xs font-semibold text-accent hover:underline disabled:opacity-60 cursor-pointer">
                {beforeUploading ? "Uploading…" : "Add Photo"}
              </button>
            )}
          </div>
          <input ref={beforeFileRef} type="file" accept="image/*" onChange={handleBeforePhotoChange} className="hidden" />
          {beforeError && <p className="text-xs text-red-600 px-3 py-1.5 border-t border-red-100 bg-red-50">{beforeError}</p>}
          <p className="text-xs font-semibold text-text-dim text-center px-3 py-2 border-t border-border bg-sm-bg">Before</p>
        </div>

        {/* After */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="aspect-video bg-sm-bg flex flex-col items-center justify-center relative">
            {afterUrl ? (
              <Image src={afterUrl} alt="After" fill className="object-cover" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            )}
            <div className={`absolute inset-0 flex items-center justify-center ${afterUrl ? "bg-black/40 opacity-0 hover:opacity-100" : ""} transition-opacity`}>
              <button type="button" onClick={() => afterFileRef.current?.click()} disabled={afterUploading}
                className="bg-white/90 text-navy text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white transition-colors disabled:opacity-60 cursor-pointer">
                {afterUploading ? "Uploading…" : afterUrl ? "Change" : "Add Photo"}
              </button>
            </div>
            {!afterUrl && (
              <button type="button" onClick={() => afterFileRef.current?.click()} disabled={afterUploading}
                className="mt-2 text-xs font-semibold text-accent hover:underline disabled:opacity-60 cursor-pointer">
                {afterUploading ? "Uploading…" : "Add Photo"}
              </button>
            )}
          </div>
          <input ref={afterFileRef} type="file" accept="image/*" onChange={handleAfterPhotoChange} className="hidden" />
          {afterError && <p className="text-xs text-red-600 px-3 py-1.5 border-t border-red-100 bg-red-50">{afterError}</p>}
          <p className="text-xs font-semibold text-text-dim text-center px-3 py-2 border-t border-border bg-sm-bg">After</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-navy text-sm">Project Details</h2>

          <div>
            <label className={labelClass}>Project Title</label>
            <input
              name="title"
              type="text"
              defaultValue={project.title}
              required
              className={inputClass}
            />
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
              <input
                name="location"
                type="text"
                defaultValue={project.location ?? ""}
                placeholder="Waco, TX"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Completion Date (optional)</label>
            <input
              name="completed_date"
              type="date"
              defaultValue={project.completed_date ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description (optional)</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={project.description ?? ""}
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
            href={`/projects/${project.id}`}
            className="flex-1 text-center py-3 border border-border rounded-md text-sm font-semibold text-navy hover:bg-sm-bg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-navy text-white font-semibold text-sm py-3 rounded-md hover:bg-navy-mid transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {pending ? "Saving…" : "Save Changes →"}
          </button>
        </div>
      </form>
    </div>
  );
}
