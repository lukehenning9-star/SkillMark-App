"use client";

import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, X, Download, Share2 } from "lucide-react";

// Standard URL QR (error-correction level H so the center logo doesn't break
// scanning). Any phone camera — including the stock iPhone Camera app — opens it.
export default function ProfileQRButton({
  url,
  username,
  className = "",
}: {
  url: string;
  username: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  function getCanvas() {
    return wrapRef.current?.querySelector("canvas") ?? null;
  }

  function download() {
    const canvas = getCanvas();
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `skillmark-${username}-qr.png`;
    a.click();
  }

  function share() {
    const canvas = getCanvas();
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      try {
        if (blob && navigator.canShare?.({ files: [new File([blob], "qr.png", { type: "image/png" })] })) {
          await navigator.share({
            files: [new File([blob], `skillmark-${username}.png`, { type: "image/png" })],
            title: "SkillMark",
            text: url,
          });
        } else {
          await navigator.share?.({ title: "SkillMark", url });
        }
      } catch {
        /* user cancelled */
      }
    }, "image/png");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show profile QR code"
        className={className || "inline-flex items-center gap-1.5 text-sm font-semibold text-navy border border-border bg-white px-4 py-2 rounded-md hover:border-border2 transition-colors"}
      >
        <QrCode size={15} />
        QR
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-navy">Scan to view this profile</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} className="text-text-dim hover:text-navy" />
              </button>
            </div>

            <div ref={wrapRef} className="flex justify-center rounded-xl border border-border p-4 bg-white">
              <QRCodeCanvas
                value={url}
                size={224}
                level="H"
                marginSize={2}
                fgColor="#0f1f3d"
                bgColor="#ffffff"
                imageSettings={{ src: "/apple-icon.png", height: 46, width: 46, excavate: true }}
              />
            </div>

            <p className="text-[11px] text-text-dim mt-2 text-center break-all">{url.replace(/^https?:\/\//, "")}</p>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={download}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-accent text-white px-3 py-2 rounded-md hover:bg-[#1e3a8a] transition-colors"
              >
                <Download size={15} /> Download
              </button>
              {canShare && (
                <button
                  type="button"
                  onClick={share}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold border border-border text-navy px-3 py-2 rounded-md hover:border-border2 transition-colors"
                >
                  <Share2 size={15} /> Share
                </button>
              )}
            </div>
            <p className="text-[11px] text-text-dim mt-3 text-center">
              Put it on a card, your truck, or a job-site sign.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
