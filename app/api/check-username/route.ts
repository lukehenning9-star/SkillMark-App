import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // x-real-ip is set by the platform proxy; the last x-forwarded-for hop is
  // proxy-appended. Never trust the first XFF entry — the client controls it.
  const xff = req.headers.get("x-forwarded-for");
  const ip =
    req.headers.get("x-real-ip")?.trim() ??
    xff?.split(",").map((s) => s.trim()).filter(Boolean).pop() ??
    "unknown";

  if (!checkRateLimit(`check-username:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim();

  // Must match the validation in app/actions/auth.ts signup().
  if (!username || username.length < 3 || username.length > 30) {
    return NextResponse.json({ available: false });
  }
  if (!/^[a-z0-9_-]+$/.test(username)) {
    return NextResponse.json({ available: false });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
