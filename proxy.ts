import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Guests may browse profiles, projects, the feed, and search — sign-up is
// required only to DO things. So we protect the action surfaces (onboarding,
// settings, messages, creating a project, editing a project), not viewing.
// The feed (/dashboard) is public.
const protectedRoutes = ["/onboarding", "/settings", "/messages", "/projects/new"];
const editProjectPattern = /^\/projects\/[^/]+\/edit(\/|$)/;
const authRoutes = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const res = NextResponse.next();

  // Capture a referral code from ?ref=CODE into a cookie; it's claimed once the
  // referred person is authenticated (see claimReferral).
  const ref = req.nextUrl.searchParams.get("ref");
  if (ref && /^[a-z0-9]{4,20}$/i.test(ref)) {
    res.cookies.set("sm_ref", ref.toLowerCase(), {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  }

  const isProtected = protectedRoutes.some((r) => path.startsWith(r)) || editProjectPattern.test(path);
  const isAuthRoute = authRoutes.includes(path);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return res;
  }

  let user = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return res;
  }

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};
