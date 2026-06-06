"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { saveProfileStep, saveAvatarUrl, saveBannerUrl, addWorkExperience, deleteWorkExperience } from "@/app/actions/profile";
import { getAvatarUploadUrl, getBannerUploadUrl } from "@/app/actions/upload";
import { US_STATES, TRADES, UNION_STATUS_OPTIONS } from "@/lib/constants";
import AvatarCropModal from "@/components/AvatarCropModal";
import type { Profile, WorkExperience } from "@/lib/types";

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5";

export default function SettingsForm({ profile, workExperience }: { profile: Profile; workExperience: WorkExperience[] }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [isAvailable, setIsAvailable] = useState(profile.is_available);

  const knownTrades = TRADES as readonly string[];
  const savedCustomTrade = profile.trade && !knownTrades.includes(profile.trade) ? profile.trade : null;
  const [tradeVal, setTradeVal] = useState(profile.trade ?? "");
  const [tradeCustom, setTradeCustom] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState<string | null>(profile.banner_url);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleCropApply(blob: Blob) {
    setCropSrc(null);
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const urlResult = await getAvatarUploadUrl();
      if (!urlResult || "error" in urlResult) {
        setAvatarError(urlResult?.error ?? "Could not get upload URL.");
        return;
      }
      const uploadRes = await fetch(urlResult.signedUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!uploadRes.ok) { setAvatarError("Upload failed. Please try again."); return; }
      const saveResult = await saveAvatarUrl(urlResult.publicUrl);
      if (saveResult?.error) { setAvatarError(saveResult.error); return; }
      setAvatarUrl(urlResult.publicUrl);
    } catch {
      setAvatarError("Upload failed. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleBannerUpload(file: File) {
    if (!file.type.startsWith("image/")) { setBannerError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setBannerError("Image must be 5MB or smaller."); return; }
    setBannerError(null);
    setBannerUploading(true);
    try {
      const urlResult = await getBannerUploadUrl();
      if (!urlResult || "error" in urlResult) { setBannerError(urlResult?.error ?? "Could not get upload URL."); return; }
      const uploadRes = await fetch(urlResult.signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) { setBannerError("Upload failed. Please try again."); return; }
      const saveResult = await saveBannerUrl(urlResult.publicUrl);
      if (saveResult?.error) { setBannerError(saveResult.error); return; }
      setBannerUrl(urlResult.publicUrl);
    } catch {
      setBannerError("Upload failed. Please try again.");
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const effectiveTrade =
        tradeVal === "Other" ? (tradeCustom.trim() || "Other") : tradeVal || undefined;
      const result = await saveProfileStep({
        full_name: (fd.get("full_name") as string).trim(),
        headline: (fd.get("headline") as string).trim() || undefined,
        trade: effectiveTrade,
        experience_level: (fd.get("experience_level") as Profile["experience_level"]) || undefined,
        years_experience: Number(fd.get("years_experience")) || 0,
        city: (fd.get("city") as string).trim() || undefined,
        state: (fd.get("state") as string) || undefined,
        bio: bio.trim() || undefined,
        is_available: isAvailable,
        union_status: (fd.get("union_status") as string) || undefined,
      });
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/${profile.username}`} className="text-sm text-text-dim hover:text-navy flex items-center gap-1.5 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Profile
        </Link>
        <h1 className="font-serif text-2xl font-bold text-navy">Profile Settings</h1>
        <p className="text-text-dim text-sm mt-1">Update your public profile information.</p>
      </div>

      {/* Photos */}
      <div className="bg-white border border-border rounded-xl p-6 space-y-5 mb-5">
        <h2 className="font-semibold text-navy text-sm">Photos</h2>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-navy-mid border border-border flex items-center justify-center overflow-hidden shrink-0 relative">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="64px" />
            ) : (
              <span className="text-xl font-bold text-white">
                {(profile.full_name ?? profile.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy mb-1">Profile Photo</p>
            <p className="text-xs text-text-dim mb-2">JPG, PNG or WEBP · Max 5MB</p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="text-xs font-semibold text-navy border border-border px-3 py-1.5 rounded-md hover:border-border2 hover:bg-sm-bg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {avatarUploading ? "Uploading…" : "Change Photo"}
            </button>
            {avatarError && <p className="text-xs text-red-600 mt-1">{avatarError}</p>}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCropSrc(URL.createObjectURL(file));
                  if (avatarInputRef.current) avatarInputRef.current.value = "";
                }
              }}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-navy mb-1">Banner Image</p>
          <div className="h-20 bg-sm-bg border border-border rounded-lg overflow-hidden relative mb-2">
            {bannerUrl ? (
              <Image src={bannerUrl} alt="Banner" fill className="object-cover" sizes="100vw" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-text-dim mb-2">Recommended: 1500×500px · Max 5MB</p>
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerUploading}
            className="text-xs font-semibold text-navy border border-border px-3 py-1.5 rounded-md hover:border-border2 hover:bg-sm-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {bannerUploading ? "Uploading…" : bannerUrl ? "Change Banner" : "Upload Banner"}
          </button>
          {bannerError && <p className="text-xs text-red-600 mt-1">{bannerError}</p>}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); }}
            className="hidden"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-navy text-sm">Basic Info</h2>

          <div>
            <label className={labelClass}>Full Name</label>
            <input name="full_name" type="text" defaultValue={profile.full_name ?? ""} placeholder="Marcus Rivera" required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Headline</label>
            <input name="headline" type="text" defaultValue={profile.headline ?? ""} placeholder="Master Electrician · 12 years commercial" maxLength={120} className={inputClass} />
            <p className="text-[11px] text-text-dim mt-1">Shows below your name on your profile · 120 chars max</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Trade</label>
              {tradeVal === "Other" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tradeCustom}
                    onChange={(e) => setTradeCustom(e.target.value)}
                    placeholder="e.g. Mason, Ironworker…"
                    className={inputClass}
                    autoFocus
                  />
                  <button type="button" onClick={() => { setTradeVal(savedCustomTrade ?? ""); setTradeCustom(""); }} className="shrink-0 text-xs text-text-dim hover:text-navy whitespace-nowrap">
                    ← back
                  </button>
                </div>
              ) : (
                <select value={tradeVal} onChange={(e) => setTradeVal(e.target.value)} className={inputClass}>
                  <option value="">Select trade...</option>
                  {TRADES.filter(t => t !== "Other").map((t) => <option key={t}>{t}</option>)}
                  {savedCustomTrade && <option key={savedCustomTrade} value={savedCustomTrade}>{savedCustomTrade}</option>}
                  <option value="Other">Other</option>
                </select>
              )}
            </div>
            <div>
              <label className={labelClass}>Experience Level</label>
              <select name="experience_level" defaultValue={profile.experience_level ?? ""} className={inputClass}>
                <option value="">Select level...</option>
                <option value="apprentice">Apprentice</option>
                <option value="journeyman">Journeyman</option>
                <option value="master">Master</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Years of Experience</label>
            <input name="years_experience" type="number" min={0} max={60} defaultValue={profile.years_experience} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>City</label>
              <input name="city" type="text" defaultValue={profile.city ?? ""} placeholder="Waco" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <select name="state" defaultValue={profile.state ?? ""} className={inputClass}>
                <option value="">State...</option>
                {US_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Union Status</label>
            <select name="union_status" defaultValue={profile.union_status ?? ""} className={inputClass}>
              <option value="">Not specified</option>
              {UNION_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-navy text-sm">Bio</h2>
          <div>
            <label className={labelClass}>About You</label>
            <textarea
              name="bio"
              rows={4}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Journeyman electrician with 8 years in commercial and residential work..."
              className={`${inputClass} resize-none`}
            />
            <p className="text-[11px] text-text-dim mt-1 text-right">{bio.length}/300</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-navy">Open to Work</p>
            <p className="text-xs text-text-dim mt-0.5">Show contractors you&apos;re available for new opportunities.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAvailable((v) => !v)}
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
              isAvailable ? "bg-accent" : "bg-border2"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isAvailable ? "translate-x-4" : ""
              }`}
            />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">Profile saved successfully.</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-accent text-white font-semibold text-sm py-3 rounded-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <WorkExperienceSection initial={workExperience} />

      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onApply={handleCropApply}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}

function WorkExperienceSection({ initial }: { initial: WorkExperience[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // form state
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState("");

  function resetForm() {
    setJobTitle(""); setCompany(""); setStartDate(""); setEndDate(""); setIsCurrent(false); setDescription(""); setAdding(false); setErr(null);
  }

  async function handleAdd() {
    if (!jobTitle.trim() || !company.trim() || !startDate) { setErr("Job title, company, and start date are required."); return; }
    setSaving(true); setErr(null);
    const result = await addWorkExperience({ job_title: jobTitle.trim(), company_name: company.trim(), start_date: startDate, end_date: isCurrent ? undefined : endDate || undefined, is_current: isCurrent, description: description.trim() || undefined });
    setSaving(false);
    if (result?.error) { setErr(result.error); return; }
    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteWorkExperience(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="bg-white border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy text-sm">Work Experience</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
            + Add Job
          </button>
        )}
      </div>

      {jobs.length > 0 && (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy leading-tight">{job.job_title}</p>
                <p className="text-sm text-text-mid">{job.company_name}</p>
                <p className="text-xs text-text-dim mt-0.5">
                  {fmt(job.start_date)} – {job.is_current ? "Present" : job.end_date ? fmt(job.end_date) : ""}
                </p>
                {job.description && <p className="text-xs text-text-dim mt-1 leading-relaxed line-clamp-2">{job.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(job.id)}
                className="shrink-0 text-xs text-red-500 hover:text-red-700 font-medium hover:underline mt-0.5"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-sm-bg">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Job Title *</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Journeyman Electrician" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Company *</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Electric Co." className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start Date *</label>
              <input type="month" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            {!isCurrent && (
              <div>
                <label className={labelClass}>End Date</label>
                <input type="month" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="accent-[#0c6e74]" />
            <span className="text-sm text-navy">I currently work here</span>
          </label>
          <div>
            <label className={labelClass}>Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} placeholder="Brief description of your role and work..." className={`${inputClass} resize-none`} />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={saving} className="bg-accent text-white text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 cursor-pointer">{saving ? "Saving…" : "Save Job"}</button>
            <button type="button" onClick={resetForm} className="text-xs font-semibold text-text-dim hover:text-navy px-4 py-2 border border-border rounded-md cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {jobs.length === 0 && !adding && (
        <p className="text-sm text-text-dim">No work experience added yet.</p>
      )}
    </div>
  );
}
