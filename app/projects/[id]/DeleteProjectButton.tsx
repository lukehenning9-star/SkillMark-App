"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/app/actions/projects";

export default function DeleteProjectButton({
  projectId,
  ownerUsername,
}: {
  projectId: string;
  ownerUsername: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(ownerUsername ? `/${ownerUsername}` : "/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-sm font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
