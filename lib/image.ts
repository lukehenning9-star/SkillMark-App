// Client-side image downscale + re-encode before upload. This matches what
// major platforms (LinkedIn, Facebook, Instagram) do: resize the photo to a
// sane maximum dimension and re-encode it as JPEG so uploads are fast and
// reliable, especially on phones over cell data. If anything goes wrong it
// returns the original file untouched, so it can never block an upload.
export async function compressImage(
  input: Blob,
  { maxDim = 1920, quality = 0.82 }: { maxDim?: number; quality?: number } = {}
): Promise<Blob> {
  try {
    if (!input.type.startsWith("image/")) return input;

    // `from-image` respects EXIF orientation so portrait phone photos don't
    // come out sideways once drawn to the canvas.
    const bitmap = await createImageBitmap(input, { imageOrientation: "from-image" });

    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return input;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return input;

    // Keep whichever is smaller — tiny images don't benefit from re-encoding.
    return blob.size < input.size ? blob : input;
  } catch {
    return input; // never block the upload
  }
}
