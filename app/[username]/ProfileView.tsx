"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Wrench, Clock, Award, Plus, Pencil, Camera, X } from "lucide-react";
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
  const knownTrades = TRADES as readonly string[];
  const savedCustomTrade = profile.trade && !knownTrades.includes(profile.trade) ? profile.trade : null;
  const [tradeVal, setTradeVal] = useState(profile.trade ?? "");
  const [tradeCustom, setTradeCustom] = useState("");

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
      <div className="h-52 sm:h-80 bg-navy relative">
        {bannerUrl && (
          <Image src={bannerUrl} alt="Profile banner" fill className="object-cover" priority />
        )}
        {isOwner && (
          <input
            ref={bannerFileRef}
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); }}
            className="hidden"
          />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Avatar + actions row */}
        <div className="relative -mt-16 sm:-mt-24 mb-4 flex items-end justify-between gap-4">
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-sm-bg bg-white overflow-hidden flex items-center justify-center relative shadow-md">
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
                <Camera size={13} className="text-text-mid" />
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
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-accent px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                >
                  <Pencil size={13} />
                  Edit Profile
                </button>
              </>
            ) : (
              <Link
                href={`/messages?to=${profile.username}`}
                className="text-sm font-semibold text-white bg-accent px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              >
                Send Message
              </Link>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="mb-4">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-navy leading-tight tracking-tight">
            {profile.full_name ?? profile.username}
          </h1>
          <p className="text-text-dim text-sm mt-0.5">@{profile.username}</p>
          {profile.headline && (
            <p className="text-text-mid text-base mt-1.5">{profile.headline}</p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(profile.trade || profile.years_experience > 0) && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-border text-navy px-2.5 py-1 rounded-full">
              <Wrench size={11} />
              {[
                profile.experience_level ? expLabel[profile.experience_level] : null,
                profile.trade,
                profile.years_experience > 0 ? `· ${profile.years_experience} yr${profile.years_experience !== 1 ? "s" : ""}` : null,
              ].filter(Boolean).join(" ")}
            </span>
          )}
          {profile.is_available && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Open to Work
            </span>
          )}
        </div>

        {/* Completion nudge */}
        {isOwner && !profileIsComplete && (
          <p className="text-xs text-text-dim mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            Profile incomplete —{" "}
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="text-navy underline underline-offset-2 hover:no-underline"
            >
              add{" "}
              {[
                !avatarUrl && "a photo",
                !profile.bio && "a bio",
                !profile.trade && "your trade",
                !profile.city && !profile.state && "location",
                projects.length === 0 && "a project",
              ]
                .filter(Boolean)
                .join(", ")}
            </button>{" "}
            to attract contractors.
          </p>
        )}

        {/* Owner stats */}
        {isOwner && (
          <p className="text-xs text-text-dim mb-5">
            <span className="font-semibold text-navy">{profile.profile_views ?? 0}</span> profile view{(profile.profile_views ?? 0) !== 1 ? "s" : ""}
            {" · "}
            <span className="font-semibold text-navy">{projects.length}</span> project{projects.length !== 1 ? "s" : ""}
            {unreadCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-accent">{unreadCount}</span> new message{unreadCount !== 1 ? "s" : ""}
              </>
            )}
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-6 pb-12">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-5">
            {(profile.bio || profile.city || profile.state || profile.trade || isOwner) && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-semibold text-navy whitespace-nowrap">About</h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                {profile.bio ? (
                  <p className="text-sm text-text-mid leading-relaxed whitespace-pre-line mb-3">{profile.bio}</p>
                ) : isOwner ? (
                  <p className="text-xs text-text-dim mb-3">Add a bio to tell contractors about yourself.</p>
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
                  {profile.union_status && (
                    <div className="flex items-center gap-2 text-sm text-text-mid">
                      <Award size={14} className="text-text-dim shrink-0" />
                      {profile.union_status}
                    </div>
                  )}
                </div>
              </div>
            )}

            {certifications.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xs font-semibold text-navy whitespace-nowrap">Certifications</h2>
                  <div className="h-px bg-border flex-1" />
                </div>
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
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xs font-semibold text-navy whitespace-nowrap">Projects</h2>
                  <div className="h-px bg-border flex-1" />
                  {isOwner && projects.length > 0 && (
                    <Link href="/projects/new" className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                      <Plus size={12} />Add
                    </Link>
                  )}
                </div>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {projects.map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`} className="group border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-border2 transition-all block">
                        <div className="aspect-[4/3] bg-sm-bg flex items-center justify-center relative">
                          {project.cover_photo_url ? (
                            <Image src={project.cover_photo_url} alt={project.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                          ) : (
                            <Camera size={20} className="text-text-dim" />
                          )}
                          {project.specific_skills?.length > 0 && (
                            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                              {project.specific_skills.slice(0, 2).map((skill) => (
                                <span key={skill} className="text-[9px] font-semibold bg-black/50 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">{skill}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="px-3 py-2.5 border-t border-border">
                          <p className="text-sm font-semibold text-navy leading-tight">{project.title}</p>
                          {project.trade_category && <p className="text-xs text-text-dim mt-0.5">{project.trade_category}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border2 rounded-lg p-6 text-center">
                    <p className="text-sm text-text-dim mb-3">No projects yet. Show off your work!</p>
                    <Link href="/projects/new" className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                      <Plus size={13} />Add First Project
                    </Link>
                  </div>
                )}
              </div>
            )}

            {(workExperience.length > 0 || isOwner) && (
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xs font-semibold text-navy whitespace-nowrap">Work Experience</h2>
                  <div className="h-px bg-border flex-1" />
                  {isOwner && (
                    <Link href="/settings" className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                      <Plus size={12} />Add
                    </Link>
                  )}
                </div>
                {workExperience.length > 0 ? (
                  <ul className="relative border-l-2 border-border ml-2 space-y-0">
                    {workExperience.map((job) => (
                      <li key={job.id} className="relative pl-6 pb-6 last:pb-0">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${job.is_current ? "border-accent" : "border-border2"}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${job.is_current ? "bg-accent" : "bg-border2"}`} />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-navy leading-tight">{job.job_title}</p>
                            <p className="text-sm text-text-mid">{job.company_name}</p>
                          </div>
                          {job.is_current && (
                            <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">Current</span>
                          )}
                        </div>
                        <p className="text-xs text-text-dim mt-0.5">{formatDateRange(job.start_date, job.end_date, job.is_current)}</p>
                        {job.description && <p className="text-xs text-text-dim mt-1.5 leading-relaxed">{job.description}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="border border-dashed border-border2 rounded-lg p-5 text-center">
                    <p className="text-sm text-text-dim mb-3">No work history yet.</p>
                    <Link href="/settings" className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                      <Plus size={13} />Add Experience
                    </Link>
                  </div>
                )}
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
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-5">
              {/* Banner */}
              <div>
                <label className={labelClass}>Banner Photo</label>
                <div className="relative h-24 rounded-lg overflow-hidden bg-navy border border-border">
                  {bannerUrl && (
                    <Image src={bannerUrl} alt="Banner" fill className="object-cover" sizes="100vw" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <button
                      type="button"
                      onClick={() => bannerFileRef.current?.click()}
                      disabled={bannerUploading}
                      className="text-white text-xs font-semibold border border-white/50 px-3 py-1.5 rounded-md bg-black/20 hover:bg-black/50 transition-colors disabled:opacity-50"
                    >
                      {bannerUploading ? "Uploading…" : bannerUrl ? "Change Banner" : "Add Banner Photo"}
                    </button>
                  </div>
                </div>
              </div>

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
                  className="flex-1 bg-accent text-white font-semibold text-sm py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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
