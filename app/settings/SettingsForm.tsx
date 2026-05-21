"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { saveProfileStep, saveAvatarUrl, saveBannerUrl } from "@/app/actions/profile";
import { getAvatarUploadUrl, getBannerUploadUrl } from "@/app/actions/upload";
import { US_STATES, TRADES, UNION_STATUS_OPTIONS } from "@/lib/constants";
import AvatarCropModal from "@/components/AvatarCropModal";
import type { Profile } from "@/lib/types";

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5";

export default function SettingsForm({ profile }: { profile: Profile }) {
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
          className="w-full bg-navy text-white font-semibold text-sm py-3 rounded-md hover:bg-navy-mid transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </form>

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
