import { NextRequest } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

// A printable/shareable QR image for a profile, e.g. /marcus/qr.png. Encodes the
// public profile URL at high error-correction so it stays scannable.
export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const clean = username.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  if (!clean) return new Response("Not found", { status: 404 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? req.nextUrl.origin;
  const url = `${origin}/${clean}?src=qr`;

  const png = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 512,
    color: { dark: "#0f1f3d", light: "#ffffff" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
