import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Free vs premium limits. Free caps are generous so they don't annoy early
// users; premium effectively removes them.
export const LIMITS = {
  free: { projects: 12, galleryPhotos: 8 },
  premium: { projects: 1000, galleryPhotos: 50 },
} as const;

// True if the profile has a live Stripe subscription OR a comped premium_until.
// Backed by the is_premium() SQL function so paid + referral-comped months are
// unified in one place.
export async function isPremium(supabase: ServerClient, profileId: string | null | undefined): Promise<boolean> {
  if (!profileId) return false;
  const { data } = await supabase.rpc("is_premium", { p_profile: profileId });
  return Boolean(data);
}

export function limitsFor(premium: boolean) {
  return premium ? LIMITS.premium : LIMITS.free;
}
