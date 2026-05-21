"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Wrench, Clock, Briefcase, Award, Plus, Pencil, MessageCircle, Eye, FolderOpen } from "lucide-react";
import { saveProfileStep, saveAvatarUrl, saveBannerUrl } from "@/app/actions/profile";
import { getAvatarUploadUrl, getBannerUploadUrl } from "@/app/actions/upload";
import { US_STATES, TRADES, UNION_STATUS_OPTIONS } from "@/lib/constants";
import AvatarCropModal from "@/components/AvatarCropModal";
import type { Profile, WorkExperience, Project, Certification } from "@/lib/types";

interface Props {
  profile: Profile;
  projects: Project[];
  workExperience: WorkExperience[];
  certifications: Certification[];
  isOwner: boolean;
  unreadCount: number;
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean) {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return `${fmt(start)} – ${isCurrent ? "Present" : end ? fmt(end) : ""}`;
}

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5";

export default function ProfileView({
  profile,
  projects,
  workExperience,
  certifications,
  isOwner,
  unreadCount,
}: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState<string | null>(profile.banner_url);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(profile.bio ?? "");
  const [isAvailable, setIsAvailable] = useState(profile.is_available);
  const [tradeVal, setTradeVal] = useState(
    profile.trade
      ? (TRADES as readonly string[]).includes(profile.trade)
        ? profile.trade
        : "Other"
      : ""
  );
  const [tradeCustom, setTradeCustom] = useState(
    profile.trade && !(TRADES as readonly string[]).includes(profile.trade)
      ? profile.trade
      : ""
  );

  const profileIsComplete =
    !!(avatarUrl && profile.bio && profile.trade && (profile.city || profile.state) && projects.length > 0);

  const handleAvatarFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    if (avatarFileRef.current) avatarFileRef.current.value = "";
  }, []);

  const handleCropApply = useCallback(
    async (blob: Blob) => {
      setCropSrc(null);
      setAvatarUploading(true);
      try {
        const urlResult = await getAvatarUploadUrl();
        if (!urlResult || "error" in urlResult) return;
        const res = await fetch(urlResult.signedUrl, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": "image/jpeg" },
        });
        if (!res.ok) return;
        await saveAvatarUrl(urlResult.publicUrl);
        setAvatarUrl(urlResult.publicUrl);
        router.refresh();
      } finally {
        setAvatarUploading(false);
      }
    },
    [router]
  );

  const handleBannerUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setBannerUploading(true);
      try {
        const urlResult = await getBannerUploadUrl();
        if (!urlResult || "error" in urlResult) return;
        const res = await fetch(urlResult.signedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!res.ok) return;
        await saveBannerUrl(urlResult.publicUrl);
        setBannerUrl(urlResult.publicUrl);
        router.refresh();
      } finally {
        setBannerUploading(false);
        if (bannerFileRef.current) bannerFileRef.current.value = "";
      }
    },
    [router]
  );

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaveError(null);
    startTransition(async () => {
      const effectiveTrade =
        tradeVal === "Other" ? (tradeCustom.trim() || "Other") : tradeVal || undefined;
      const result = await saveProfileStep({
        full_name: (fd.get("full_name") as string).trim() || undefined,
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
      if (result?.error) {
        setSaveError(result.error);
      } else {
        setEditOpen(false);
        router.refresh();
      }
    });
  }

  const expLabel: Record<string, string> = {
    apprentice: "Apprentice",
    journeyman: "Journeyman",
    master: "Master",
  };

  return (
    <main className="min-h-screen bg-sm-bg">
      {/* Banner */}
      <div className="h-48 sm:h-64 bg-navy relative group">
        {bannerUrl && (
          <Image src={bannerUrl} alt="Profile banner" fill className="object-cover" priority />
        )}
        {isOwner && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-navy/50">
            <button
              type="button"
              onClick={() => bannerFileRef.current?.click()}
              disabled={bannerUploading}
              className="text-white text-xs font-semibold border border-white/50 px-3 py-1.5 rounded-md bg-black/20 hover:bg-black/40 transition-colors"
            >
              {bannerUploading ? "Uploading…" : "Change Banner"}
            </button>
            <input
              ref={bannerFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); }}
              className="hidden"
            />
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Avatar + actions row */}
        <div className="relative -mt-14 sm:-mt-18 mb-4 flex items-end justify-between gap-4">
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-sm-bg bg-white overflow-hidden flex items-center justify-center relative shadow-md">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.full_name ?? profile.username}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <span className="text-4xl sm:text-5xl font-bold text-navy-mid select-none">
                  {(profile.full_name ?? profile.username).charAt(0).toUpperCase()}
                </span>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-white border border-border rounded-full flex items-center justify-center shadow-sm hover:border-accent transition-colors"
                title="Change photo"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3d4f6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            )}
            <input
              ref={avatarFileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </div>

          <div className="flex gap-2 pb-1 flex-wrap justify-end">
            {isOwner ? (
              <>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy border border-border bg-white px-4 py-2 rounded-md hover:border-border2 transition-colors"
                >
                  <Plus size={14} />
                  Add Project
                </Link>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-navy px-4 py-2 rounded-md hover:bg-navy-mid transition-colors"
                >
                  <Pencil size={13} />
                  Edit Profile
                </button>
              </>
            ) : (
              <Link
                href={`/messages?to=${profile.username}`}
                className="text-sm font-semibold text-white bg-navy px-4 py-2 rounded-md hover:bg-navy-mid transition-colors"
              >
                Send Message
              </Link>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="mb-4">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy leading-tight">
            {profile.full_name ?? profile.username}
          </h1>
          <p className="text-text-dim text-sm mt-0.5">@{profile.username}</p>
          {profile.headline && (
            <p className="text-text-mid text-base mt-1.5">{profile.headline}</p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {profile.trade && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-border text-navy px-2.5 py-1 rounded-full">
              <Wrench size={11} />
              {profile.experience_level
                ? `${expLabel[profile.experience_level] ?? ""} ${profile.trade}`
                : profile.trade}
            </span>
          )}
          {profile.years_experience > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-border text-navy px-2.5 py-1 rounded-full">
              <Clock size={11} />
              {profile.years_experience} yr{profile.years_experience !== 1 ? "s" : ""} exp
            </span>
          )}
          {profile.is_available && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Open to Work
            </span>
          )}
          {profile.union_status && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              {profile.union_status}
            </span>
          )}
        </div>

        {/* Completion nudge */}
        {isOwner && !profileIsComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add{" "}
                {[
                  !avatarUrl && "a profile photo",
                  !profile.bio && "a bio",
                  !profile.trade && "your trade",
                  !profile.city && !profile.state && "your location",
                  projects.length === 0 && "a project",
                ]
                  .filter(Boolean)
                  .join(", ")}{" "}
                to stand out to contractors.
              </p>
            </div>
          </div>
        )}

        {/* Owner stats */}
        {isOwner && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1"><Eye size={16} className="text-text-dim" /></div>
              <p className="text-xl font-bold text-navy">{profile.profile_views ?? 0}</p>
              <p className="text-[11px] text-text-dim font-medium uppercase tracking-wide mt-0.5">Profile Views</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1"><FolderOpen size={16} className="text-text-dim" /></div>
              <p className="text-xl font-bold text-navy">{projects.length}</p>
              <p className="text-[11px] text-text-dim font-medium uppercase tracking-wide mt-0.5">Projects</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1"><MessageCircle size={16} className="text-text-dim" /></div>
              <p className="text-xl font-bold text-navy">{unreadCount}</p>
              <p className="text-[11px] text-text-dim font-medium uppercase tracking-wide mt-0.5">New Messages</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 pb-12">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-5">
            {(profile.bio || profile.city || profile.state || profile.trade || isOwner) && (
              <div className="bg-white border border-border rounded-xl p-5">
                <h2 className="font-semibold text-[11px] uppercase tracking-widest text-text-dim mb-4">About</h2>
                {profile.bio ? (
                  <p className="text-sm text-text-mid leading-relaxed whitespace-pre-line mb-4">{profile.bio}</p>
                ) : isOwner ? (
                  <p className="text-xs text-text-dim mb-4">Add a bio to tell contractors about yourself.</p>
                ) : null}
                <div className="space-y-2.5">
                  {(profile.city || profile.state) && (
                    <div className="flex items-center gap-2 text-sm text-text-mid">
                      <MapPin size={14} className="text-text-dim shrink-0" />
                      {[profile.city, profile.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {profile.trade && (
                    <div className="flex items-center gap-2 text-sm text-text-mid">
                      <Wrench size={14} className="text-text-dim shrink-0" />
                      {profile.trade}
                    </div>
                  )}
                  {profile.years_experience > 0 && (
                    <div className="flex items-center gap-2 text-sm text-text-mid">
                      <Clock size={14} className="text-text-dim shrink-0" />
                      {profile.years_experience} year{profile.years_experience !== 1 ? "s" : ""} of experience
                    </div>
                  )}
                </div>
              </div>
            )}

            {certifications.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-5">
                <h2 className="font-semibold text-[11px] uppercase tracking-widest text-text-dim mb-4">Certifications</h2>
                <ul className="space-y-3">
                  {certifications.map((cert) => (
                    <li key={cert.id} className="flex items-start gap-2">
                      <Award size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-navy leading-tight">{cert.name}</p>
                        {cert.issuing_org && <p className="text-xs text-text-dim">{cert.issuing_org}</p>}
                        {cert.date_earned && (
                          <p className="text-xs text-text-dim">
                            {new Date(cert.date_earned + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            {cert.expiry_date && ` – ${new Date(cert.expiry_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Main column */}
          <div className="md:col-span-2 space-y-6">
            {(projects.length > 0 || isOwner) && (
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[11px] uppercase tracking-widest text-text-dim">Projects</h2>
                  {isOwner && projects.length > 0 && (
                    <Link href="/projects/new" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                      <Plus size={12} />Add
                    </Link>
                  )}
                </div>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <div key={project.id} className="border border-border rounded-lg overflow-hidden hover:border-border2 hover:shadow-sm transition-all">
                        <div className="aspect-video bg-sm-bg flex items-center justify-center relative">
                          {project.cover_photo_url ? (
                            <Image src={project.cover_photo_url} alt={project.title} fill className="object-cover" />
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold text-navy leading-tight">{project.title}</p>
                          {project.trade_category && <p className="text-xs text-text-dim mt-0.5">{project.trade_category}</p>}
                          {project.description && <p className="text-xs text-text-dim mt-1.5 line-clamp-2">{project.description}</p>}
                          {project.specific_skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {project.specific_skills.slice(0, 3).map((skill) => (
                                <span key={skill} className="text-[10px] bg-sm-bg border border-border text-text-dim px-1.5 py-0.5 rounded">{skill}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border2 rounded-lg p-6 text-center">
                    <p className="text-sm text-text-dim mb-3">No projects yet. Show off your work!</p>
                    <Link href="/projects/new" className="inline-flex items-center gap-1.5 bg-navy text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-navy-mid transition-colors">
                      <Plus size={13} />Add First Project
                    </Link>
                  </div>
                )}
              </div>
            )}

            {workExperience.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-5">
                <h2 className="font-semibold text-[11px] uppercase tracking-widest text-text-dim mb-4">Work Experience</h2>
                <ul className="space-y-5">
                  {workExperience.map((job) => (
                    <li key={job.id} className="flex gap-3">
                      <div className="w-9 h-9 bg-sm-bg border border-border rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase size={14} className="text-text-dim" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy leading-tight">{job.job_title}</p>
                        <p className="text-sm text-text-mid">{job.company_name}</p>
                        <p className="text-xs text-text-dim mt-0.5">{formatDateRange(job.start_date, job.end_date, job.is_current)}</p>
                        {job.description && <p className="text-xs text-text-dim mt-1.5 leading-relaxed">{job.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onApply={handleCropApply}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Edit Profile modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg font-bold text-navy">Edit Profile</h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sm-bg transition-colors text-text-dim"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-navy-mid border border-border flex items-center justify-center overflow-hidden shrink-0 relative">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="56px" />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {(profile.full_name ?? profile.username).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={avatarUploading}
                    className="text-xs font-semibold text-navy border border-border px-3 py-1.5 rounded-md hover:bg-sm-bg transition-colors disabled:opacity-50"
                  >
                    {avatarUploading ? "Uploading…" : "Change Photo"}
                  </button>
                  <p className="text-[11px] text-text-dim mt-1">JPG, PNG · Max 5MB</p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Full Name</label>
                <input name="full_name" type="text" defaultValue={profile.full_name ?? ""} placeholder="Marcus Rivera" required className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Headline</label>
                <input name="headline" type="text" defaultValue={profile.headline ?? ""} placeholder="Master Electrician · 12 years commercial" maxLength={120} className={inputClass} />
                <p className="text-[11px] text-text-dim mt-1">Shows below your name · 120 chars max</p>
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
                      <button type="button" onClick={() => { setTradeVal(""); setTradeCustom(""); }} className="shrink-0 text-xs text-text-dim hover:text-navy whitespace-nowrap">
                        ← back
                      </button>
                    </div>
                  ) : (
                    <select value={tradeVal} onChange={(e) => setTradeVal(e.target.value)} className={inputClass}>
                      <option value="">Select trade...</option>
                      {TRADES.map((t) => <option key={t}>{t}</option>)}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`${labelClass} mb-0`}>Bio</label>
                  <span className="text-[11px] text-text-dim font-mono">{bio.length}/300</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Journeyman electrician with 8 years in commercial and residential work..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Union Status</label>
                <select name="union_status" defaultValue={profile.union_status ?? ""} className={inputClass}>
                  <option value="">Not specified</option>
                  {UNION_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-sm-bg rounded-xl border border-border">
                <div>
                  <p className="text-sm font-semibold text-navy">Open to Work</p>
                  <p className="text-xs text-text-dim mt-0.5">Show contractors you&apos;re available</p>
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

              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{saveError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 border border-border text-sm font-semibold text-text-mid py-3 rounded-lg hover:bg-sm-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-navy text-white font-semibold text-sm py-3 rounded-lg hover:bg-navy-mid transition-colors disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
