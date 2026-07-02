"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCertification, deleteCertification } from "@/app/actions/certifications";
import { SUGGESTED_CERTS } from "@/lib/constants";
import type { Certification } from "@/lib/types";

const inputClass =
  "w-full bg-sm-bg border border-border rounded-md px-3 py-2.5 text-sm text-navy placeholder:text-text-dim focus:outline-none focus:border-accent focus:bg-white transition-all";
const labelClass =
  "block text-[11px] font-semibold text-text-dim uppercase tracking-wide mb-1.5";

export default function CertificationsSection({
  certifications,
}: {
  certifications: Certification[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [issuingOrg, setIssuingOrg] = useState("");
  const [dateEarned, setDateEarned] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  function resetForm() {
    setName("");
    setIssuingOrg("");
    setDateEarned("");
    setExpiryDate("");
    setError(null);
    setShowForm(false);
  }

  function handleAdd() {
    if (!name.trim()) { setError("Certification name is required."); return; }
    if (dateEarned && expiryDate && expiryDate < dateEarned) {
      setError("Expiry date cannot be before the date earned.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addCertification({
        name,
        issuing_org: issuingOrg || undefined,
        date_earned: dateEarned || undefined,
        expiry_date: expiryDate || undefined,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        resetForm();
        router.refresh();
      }
    });
  }

  function handleDelete(certId: string) {
    setDeletingId(certId);
    startTransition(async () => {
      await deleteCertification(certId);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy text-sm">Certifications</h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold text-accent hover:underline cursor-pointer"
          >
            + Add
          </button>
        )}
      </div>

      {/* Existing certifications */}
      {certifications.length > 0 && (
        <ul className="space-y-2">
          {certifications.map((cert) => (
            <li key={cert.id} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
              <div className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-navy leading-tight">{cert.name}</p>
                  {cert.issuing_org && <p className="text-xs text-text-dim">{cert.issuing_org}</p>}
                  {(cert.date_earned || cert.expiry_date) && (
                    <p className="text-xs text-text-dim">
                      {cert.date_earned && new Date(cert.date_earned + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      {cert.expiry_date && `${cert.date_earned ? " – " : "Expires "}${new Date(cert.expiry_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(cert.id)}
                disabled={deletingId === cert.id}
                className="text-xs text-red-500 hover:text-red-700 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {deletingId === cert.id ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {certifications.length === 0 && !showForm && (
        <p className="text-sm text-text-dim">No certifications added yet.</p>
      )}

      {/* Add form */}
      {showForm && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-sm-bg">
          <div>
            <label className={labelClass}>Certification Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OSHA-10"
              className={inputClass}
              autoFocus
            />
            {/* Suggested certs */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_CERTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setName(s)}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border bg-white text-text-dim hover:border-accent hover:text-navy transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Issuing Organization (optional)</label>
            <input
              type="text"
              value={issuingOrg}
              onChange={(e) => setIssuingOrg(e.target.value)}
              placeholder="OSHA, NFPA, NCCER..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date Earned (optional)</label>
              <input
                type="date"
                value={dateEarned}
                onChange={(e) => setDateEarned(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Expiry Date (optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 text-sm font-semibold text-text-dim border border-border py-2 rounded-md hover:bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending}
              className="flex-1 text-sm font-semibold text-white bg-navy py-2 rounded-md hover:bg-navy-mid transition-colors disabled:opacity-50 cursor-pointer"
            >
              {pending ? "Saving…" : "Add Certification"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
