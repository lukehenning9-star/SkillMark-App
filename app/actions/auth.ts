"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type State = { error?: string; message?: string } | undefined;

export async function signup(state: State, formData: FormData): Promise<State> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const username = (formData.get("username") as string).toLowerCase().trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;
  const role = (formData.get("role") as string) || "worker";

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { error: "Username can only contain letters, numbers, and underscores." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, role } },
  });

  if (error) return { error: error.message };
  return { message: "Check your email to confirm your account, then log in." };
}

export async function login(state: State, formData: FormData): Promise<State> {
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
