"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { toggleLike, addComment, deleteComment } from "@/app/actions/social";
import type { ProjectComment } from "@/lib/types";

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProjectSocial({
  projectId,
  initialLiked,
  initialLikeCount,
  initialComments,
  currentUserId,
  isOwner,
}: {
  projectId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  initialComments: ProjectComment[];
  currentUserId: string | null;
  isOwner: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState<ProjectComment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onLike() {
    if (!currentUserId) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleLike(projectId);
      if ("error" in res && res.error) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setError(null);
    startTransition(async () => {
      const res = await addComment(projectId, content);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      if ("comment" in res && res.comment) {
        setComments((c) => [...c, res.comment as unknown as ProjectComment]);
        setDraft("");
      }
    });
  }

  function remove(id: string) {
    setComments((c) => c.filter((x) => x.id !== id));
    startTransition(async () => {
      await deleteComment(id, projectId);
    });
  }

  return (
    <div id="comments" className="bg-white border border-border rounded-xl p-5 scroll-mt-20">
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <button
          type="button"
          onClick={onLike}
          disabled={!currentUserId || pending}
          aria-pressed={liked}
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-navy transition-colors disabled:opacity-60 cursor-pointer"
        >
          <Heart size={18} className={liked ? "fill-red-500 stroke-red-500" : ""} />
          <span className={liked ? "text-navy font-medium" : ""}>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </span>
        </button>
        <span className="text-sm text-text-dim">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      <div className="space-y-4 py-4">
        {comments.length === 0 && (
          <p className="text-sm text-text-dim">No comments yet. Say something nice about this work.</p>
        )}
        {comments.map((c) => {
          const p = c.profile;
          const name = p?.full_name || p?.username || "Someone";
          const canDelete = currentUserId && (c.profile_id === currentUserId || isOwner);
          return (
            <div key={c.id} className="flex items-start gap-3">
              <Link href={p ? `/${p.username}` : "#"} className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-navy-mid overflow-hidden flex items-center justify-center relative">
                  {p?.avatar_url ? (
                    <Image src={p.avatar_url} alt={name} fill sizes="32px" className="object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy">
                  {p ? (
                    <Link href={`/${p.username}`} className="font-semibold hover:underline">
                      {name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{name}</span>
                  )}{" "}
                  <span className="text-text-dim text-xs">· {timeAgo(c.created_at)}</span>
                </p>
                <p className="text-sm text-text-mid whitespace-pre-wrap break-words">{c.content}</p>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label="Delete comment"
                  className="text-text-dim hover:text-red-600 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {currentUserId ? (
        <form onSubmit={submit} className="flex items-start gap-2 pt-2 border-t border-border">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            rows={1}
            maxLength={2000}
            className="flex-1 bg-sm-bg border border-border rounded-md px-3 py-2 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all resize-none"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="text-sm font-semibold text-white bg-accent px-4 py-2 rounded-md hover:bg-[#1e3a8a] transition-colors disabled:opacity-50 shrink-0"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="text-sm text-text-dim pt-2 border-t border-border">
          <Link href="/login" className="text-accent font-semibold hover:underline">Log in</Link> to comment.
        </p>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
