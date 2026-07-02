"use client";

import { useEffect, useRef, useCallback } from "react";

interface AvatarCropModalProps {
  src: string;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
}

const SIZE = 300;

export default function AvatarCropModal({ src, onApply, onCancel }: AvatarCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const stateRef = useRef({ x: 0, y: 0, scale: 1, dragging: false, lastX: 0, lastY: 0, pinchDist: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y, scale } = stateRef.current;
    const scaledW = img.naturalWidth * scale;
    const scaledH = img.naturalHeight * scale;

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, x, y, scaledW, scaledH);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  const clamp = useCallback((s: typeof stateRef.current, img: HTMLImageElement) => {
    const scaledW = img.naturalWidth * s.scale;
    const scaledH = img.naturalHeight * s.scale;
    s.x = Math.min(0, Math.max(SIZE - scaledW, s.x));
    s.y = Math.min(0, Math.max(SIZE - scaledH, s.y));
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const s = stateRef.current;
      const fitScale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
      s.scale = fitScale;
      s.x = (SIZE - img.naturalWidth * fitScale) / 2;
      s.y = (SIZE - img.naturalHeight * fitScale) / 2;
      draw();
    };
    img.src = src;
  }, [src, draw]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    stateRef.current.dragging = true;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const s = stateRef.current;
    if (!s.dragging || !imgRef.current) return;
    s.x += e.clientX - s.lastX;
    s.y += e.clientY - s.lastY;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    clamp(s, imgRef.current);
    draw();
  }, [draw, clamp]);

  const onMouseUp = useCallback(() => {
    stateRef.current.dragging = false;
  }, []);

  // React registers wheel listeners as passive, so e.preventDefault() in an
  // onWheel prop throws and the page scrolls behind the modal. Attach a
  // native non-passive listener instead.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const img = imgRef.current;
      if (!img) return;
      const s = stateRef.current;
      const delta = e.deltaY < 0 ? 1.08 : 0.92;
      const minScale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
      const newScale = Math.min(5, Math.max(minScale, s.scale * delta));
      const ratio = newScale / s.scale;
      s.x = SIZE / 2 - (SIZE / 2 - s.x) * ratio;
      s.y = SIZE / 2 - (SIZE / 2 - s.y) * ratio;
      s.scale = newScale;
      clamp(s, img);
      draw();
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [draw, clamp]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const s = stateRef.current;
    if (e.touches.length === 1) {
      s.dragging = true;
      s.lastX = e.touches[0].clientX;
      s.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      s.dragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      s.pinchDist = Math.hypot(dx, dy);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // No preventDefault here: React touch listeners are passive; the
    // canvas's touch-none class already blocks page scrolling.
    const s = stateRef.current;
    const img = imgRef.current;
    if (!img) return;
    if (e.touches.length === 1 && s.dragging) {
      s.x += e.touches[0].clientX - s.lastX;
      s.y += e.touches[0].clientY - s.lastY;
      s.lastX = e.touches[0].clientX;
      s.lastY = e.touches[0].clientY;
      clamp(s, img);
      draw();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / s.pinchDist;
      const minScale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
      const newScale = Math.min(5, Math.max(minScale, s.scale * ratio));
      const scaleRatio = newScale / s.scale;
      s.x = SIZE / 2 - (SIZE / 2 - s.x) * scaleRatio;
      s.y = SIZE / 2 - (SIZE / 2 - s.y) * scaleRatio;
      s.scale = newScale;
      s.pinchDist = dist;
      clamp(s, img);
      draw();
    }
  }, [draw, clamp]);

  const onTouchEnd = useCallback(() => {
    stateRef.current.dragging = false;
  }, []);

  function handleApply() {
    const img = imgRef.current;
    if (!img) return;
    const s = stateRef.current;
    const out = document.createElement("canvas");
    out.width = 400;
    out.height = 400;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    const outScale = 400 / SIZE;
    ctx.drawImage(
      img,
      s.x * outScale,
      s.y * outScale,
      img.naturalWidth * s.scale * outScale,
      img.naturalHeight * s.scale * outScale
    );
    out.toBlob((blob) => {
      if (blob) onApply(blob);
    }, "image/jpeg", 0.92);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="font-semibold text-navy text-base">Crop Photo</h2>
          <p className="text-xs text-text-dim mt-0.5">Drag to reposition · Scroll or pinch to zoom</p>
        </div>
        <div className="px-5">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className="rounded-xl cursor-grab active:cursor-grabbing touch-none block mx-auto"
            style={{ width: SIZE, height: SIZE }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        </div>
        <div className="flex gap-3 p-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-border text-sm font-semibold text-text-mid py-2.5 rounded-lg hover:bg-sm-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 bg-navy text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-navy-mid transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
