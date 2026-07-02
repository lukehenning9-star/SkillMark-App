"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type FeedProject = {
  id: string;
  title: string;
  description: string | null;
  cover_photo_url: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  specific_skills: string[];
  trade_category: string | null;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    trade: string | null;
  };
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PHOTO_LABELS = ["Cover", "Before", "After"];

function PhotoCarousel({ project }: { project: FeedProject }) {
  const entries = [
    { url: project.cover_photo_url, label: PHOTO_LABELS[0] },
    { url: project.before_photo_url, label: PHOTO_LABELS[1] },
    { url: project.after_photo_url, label: PHOTO_LABELS[2] },
  ].filter((e): e is { url: string; label: string } => Boolean(e.url));

  const [idx, setIdx] = useState(0);

  if (entries.length === 0) return null;
  const current = entries[Math.min(idx, entries.length - 1)];

  return (
    <div className="relative aspect-video bg-sm-bg">
      <Image
        src={current.url}
        alt={`${project.title} — ${current.label}`}
        fill
        sizes="(max-width: 640px) 100vw, 470px"
        className="object-cover"
      />
      {entries.length > 1 && (
        <>
          <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full">
            {current.label}
          </span>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => setIdx((i) => (i - 1 + entries.length) % entries.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0f1f3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setIdx((i) => (i + 1) % entries.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0f1f3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {entries.map((e, i) => (
              <button
                key={e.label}
                type="button"
                aria-label={`Go to ${e.label} photo`}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${
                  i === idx ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FeedCard({ project }: { project: FeedProject }) {
  const { profiles: author } = project;
  const displayName = author.full_name || author.username;

  return (
    <article className="bg-white border border-border rounded-xl overflow-hidden">
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/${author.username}`} className="shrink-0">
          <div className="w-9 h-9 rounded-full bg-navy-mid overflow-hidden flex items-center justify-center relative">
            {author.avatar_url ? (
              <Image src={author.avatar_url} alt={displayName} fill sizes="36px" className="object-cover" />
            ) : (
              <span className="text-sm font-bold text-white select-none">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/${author.username}`} className="text-sm font-semibold text-navy hover:underline truncate block">
            {displayName}
          </Link>
          <p className="text-xs text-text-dim truncate">
            {[author.trade, timeAgo(project.created_at)].filter(Boolean).join(" · ")}
          </p>
        </div>
        {project.trade_category && (
          <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
            {project.trade_category}
          </span>
        )}
      </div>

      {/* Title + description */}
      <div className="px-4 pb-3">
        <Link href={`/projects/${project.id}`}>
          <h2 className="text-sm font-bold text-navy leading-snug hover:underline">{project.title}</h2>
        </Link>
        {project.description && (
          <p className="text-sm text-text-mid mt-1 leading-relaxed line-clamp-4">{project.description}</p>
        )}
      </div>

      <PhotoCarousel project={project} />

      {/* Skills + link */}
      <div className="px-4 py-3 space-y-2.5">
        {project.specific_skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.specific_skills.slice(0, 6).map((skill) => (
              <span key={skill} className="text-[11px] bg-sm-bg border border-border text-navy px-2.5 py-0.5 rounded-full font-medium">
                {skill}
              </span>
            ))}
            {project.specific_skills.length > 6 && (
              <span className="text-[11px] text-text-dim px-1 py-0.5">
                +{project.specific_skills.length - 6} more
              </span>
            )}
          </div>
        )}
        <Link
          href={`/projects/${project.id}`}
          className="inline-block text-xs font-semibold text-accent hover:underline"
        >
          View full project →
        </Link>
      </div>
    </article>
  );
}

export default function FeedClient({ projects }: { projects: FeedProject[] }) {
  if (projects.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl p-10 text-center">
        <svg className="mx-auto text-text-dim mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <p className="text-sm font-semibold text-navy">No projects yet</p>
        <p className="text-xs text-text-dim mt-1 mb-4">Be the first to share your work with the community.</p>
        <Link
          href="/projects/new"
          className="inline-block text-sm font-semibold text-white bg-navy px-4 py-2 rounded-md hover:bg-navy-mid transition-colors"
        >
          Add Your First Project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((p) => (
        <FeedCard key={p.id} project={p} />
      ))}
    </div>
  );
}
