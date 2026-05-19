"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type State = { error?: string; message?: string } | undefined;

function getIp(): Promise<string> {
  return headers().then((h) =>
    h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "unknown"
  );
}

export async function signup(state: State, formData: FormData): Promise<State> {
  const ip = await getIp();
  if (!checkRateLimit(`signup:${ip}`, 5, 60_000)) {
    return { error: "Too many signup attempts. Please try again in a minute." };
  }

  const supabase = await createClient();

  const email = formData.get("email") as string;
  const username = (formData.get("username") as string).toLowerCase().trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;
  const rawRole = formData.get("role") as string;
  const role = rawRole === "worker" || rawRole === "contractor" ? rawRole : "worker";

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { error: "Username can only contain letters, numbers, and underscores." };
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

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
