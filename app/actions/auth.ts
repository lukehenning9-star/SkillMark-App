"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type State = { error?: string; message?: string } | undefined;

function getIp(): Promise<string> {
  // x-real-ip is set by the hosting platform's proxy and can't be spoofed by
  // the client. Fall back to the LAST x-forwarded-for hop (appended by the
  // trusted proxy) — never the first, which the client controls.
  return headers().then((h) => {
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();
    const xff = h.get("x-forwarded-for");
    const last = xff?.split(",").map((s) => s.trim()).filter(Boolean).pop();
    return last ?? "unknown";
  });
}

export async function signup(state: State, formData: FormData): Promise<State> {
  const ip = await getIp();
  if (!checkRateLimit(`signup:${ip}`, 5, 60_000)) {
    return { error: "Too many signup attempts. Please try again in a minute." };
  }

  const supabase = await createClient();

  const email = typeof formData.get("email") === "string" ? (formData.get("email") as string).trim() : "";
  const username = typeof formData.get("username") === "string" ? (formData.get("username") as string).toLowerCase().trim() : "";
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  const confirmPassword = typeof formData.get("confirm_password") === "string" ? (formData.get("confirm_password") as string) : "";
  const rawRole = formData.get("role");
  const role = rawRole === "worker" || rawRole === "contractor" ? rawRole : "worker";

  if (!email || !email.includes("@") || email.length > 254) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }
  if (username.length > 30) {
    return { error: "Username must be 30 characters or less." };
  }
  if (!/^[a-z0-9_-]+$/.test(username)) {
    return { error: "Username can only contain letters, numbers, underscores, and hyphens." };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();
  if (existing) return { error: "Username is already taken." };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, role } },
  });

  if (error) return { error: error.message };
  return { message: "Check your email to confirm your account, then log in." };
}

export async function login(state: State, formData: FormData): Promise<State> {
  const ip = await getIp();
  if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
    return { error: "Too many login attempts. Please try again in a minute." };
  }

  const supabase = await createClient();

  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(state: State, formData: FormData): Promise<State> {
  const ip = await getIp();
  if (!checkRateLimit(`pw-reset:${ip}`, 5, 60_000)) {
    return { error: "Too many requests. Please try again in a minute." };
  }

  const email = formData.get("email");
  if (typeof email !== "string" || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Always report success — never reveal whether an account exists.
  return { message: "If an account exists for that email, we've sent a reset link. Check your inbox." };
}

export async function updatePassword(state: State, formData: FormData): Promise<State> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm_password");

  if (typeof password !== "string" || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
