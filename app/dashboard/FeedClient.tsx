"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function PhotoCarousel({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  if (photos.length === 0) return null;

  return (
    <div className="relative bg-black select-none" style={{ aspectRatio: "1 / 1" }}>
      <Image src={photos[idx]} alt="" fill className="object-cover" sizes="470px" />
      {photos.length > 1 && (
        <>
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {idx < photos.length - 1 && (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === idx ? "bg-white" : "bg-white/40"
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
  const photos = [
    project.cover_photo_url,
    project.before_photo_url,
    project.after_photo_url,
  ].filter(Boolean) as string[];

  const p = project.profiles;
  const initials = (p.full_name ?? p.username).charAt(0).toUpperCase();
  const displayName = p.full_name ?? p.username;

  return (
    <article className="bg-white border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/${p.username}`} className="shrink-0">
          <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center overflow-hidden relative">
            {p.avatar_url ? (
              <Image src={p.avatar_url} alt="" fill className="object-cover" sizes="36px" />
            ) : (
              <span className="text-sm font-bold text-white">{initials}</span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/${p.username}`}
            className="font-semibold text-sm text-navy hover:underline block"
          >
            {displayName}
          </Link>
          <div className="text-xs text-text-dim flex items-center gap-1.5">
            {p.trade && <span>{p.trade}</span>}
            {p.trade && <span>·</span>}
            <span>{timeAgo(project.created_at)}</span>
          </div>
        </div>
        {project.trade_category && (
          <span className="text-[10px] font-semibold text-accent bg-[#e6f4f4] border border-[#9dd0ce] px-2 py-0.5 rounded-full shrink-0">
            {project.trade_category}
          </span>
        )}
      </div>

      {/* Description / title */}
      <div className="px-4 pb-3">
        <p className="text-sm font-semibold text-navy leading-snug">{project.title}</p>
        {project.description && (
          <p className="text-sm text-text-mid mt-1 leading-relaxed line-clamp-4">
            {project.description}
          </p>
        )}
      </div>

      {/* Photo carousel */}
      {photos.length > 0 && <PhotoCarousel photos={photos} />}

      {/* Footer */}
      <div className="px-4 py-3">
        {project.specific_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {project.specific_skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="text-[11px] text-text-dim bg-sm-bg border border-border px-2 py-0.5 rounded-full"
              >
                {skill}
              </span>
            ))}
            {project.specific_skills.length > 5 && (
              <span className="text-[11px] text-text-dim">
                +{project.specific_skills.length - 5} more
              </span>
            )}
          </div>
        )}
        <Link
          href={`/projects/${project.id}`}
          className="text-xs font-semibold text-accent hover:underline"
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
      <div className="text-center py-20">
        <p className="text-text-dim text-sm mb-4">
          No projects in the feed yet. Be the first to add one!
        </p>
        <Link
          href="/projects/new"
          className="inline-block text-accent text-sm font-semibold hover:underline"
        >
          Add your first project →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <FeedCard key={project.id} project={project} />
      ))}
    </div>
  );
}
