"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";
import { getGalleryPhotoUploadUrl } from "@/app/actions/upload";
import { addGalleryPhoto, deleteGalleryPhoto } from "@/app/actions/project-photos";

type Photo = { id: string; photo_url: string; caption: string | null; uploaded_by: string | null };

export default function ProjectGallery({
  projectId,
  canAdd,
  isOwner,
  initialPhotos,
}: {
  projectId: string;
  canAdd: boolean;
  isOwner: boolean;
  initialPhotos: Photo[];
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Only image files are allowed."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10 MB."); return; }

    setBusy(true);
    setError(null);
    try {
      const urlRes = await getGalleryPhotoUploadUrl(projectId);
      if ("error" in urlRes && urlRes.error) { setError(urlRes.error); return; }
      const { signedUrl, publicUrl } = urlRes as { signedUrl: string; publicUrl: string };
      const put = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) { setError("Upload failed. Try again."); return; }
      const saveRes = await addGalleryPhoto(projectId, publicUrl);
      if ("error" in saveRes && saveRes.error) { setError(saveRes.error); return; }
      if ("photo" in saveRes && saveRes.photo) {
        setPhotos((p) => [...p, saveRes.photo as unknown as Photo]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setPhotos((p) => p.filter((x) => x.id !== id));
    await deleteGalleryPhoto(id, projectId);
  }

  if (photos.length === 0 && !canAdd) return null;

  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xs font-semibold text-navy whitespace-nowrap">Project Gallery</h2>
        <div className="h-px bg-border flex-1" />
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-[#1e3a8a] disabled:opacity-50 shrink-0"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
            {busy ? "Uploading…" : "Add photo"}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-sm text-text-dim">No gallery photos yet. Contributors can add their own.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((ph) => (
            <div key={ph.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-sm-bg">
              <Image src={ph.photo_url} alt={ph.caption ?? "Project photo"} fill sizes="(max-width:640px) 50vw, 200px" className="object-cover" />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => remove(ph.id)}
                  aria-label="Delete photo"
                  className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/55 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
