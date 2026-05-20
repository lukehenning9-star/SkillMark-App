"use server";

import { createClient } from "@/lib/supabase/server";

export async function addCertification(data: {
  name: string;
  issuing_org?: string;
  date_earned?: string;
  expiry_date?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!data.name.trim()) return { error: "Certification name is required." };
  if (data.name.length > 200) return { error: "Name must be 200 characters or less." };
  if (data.issuing_org && data.issuing_org.length > 200) return { error: "Issuing org must be 200 characters or less." };

  const { error } = await supabase.from("certifications").insert({
    profile_id: user.id,
    name: data.name.trim(),
    issuing_org: data.issuing_org?.trim() || null,
    date_earned: data.date_earned || null,
    expiry_date: data.expiry_date || null,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteCertification(certId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("certifications")
    .delete()
    .eq("id", certId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
