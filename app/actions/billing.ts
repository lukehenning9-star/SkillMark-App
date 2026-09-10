"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe, STRIPE_ENABLED, PREMIUM_PRICE_ID } from "@/lib/stripe";
import { headers } from "next/headers";

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

// Start a Stripe Checkout for the premium subscription. Returns a URL to
// redirect to, or an error. Inert until Stripe keys are configured.
export async function createCheckoutSession() {
  if (!STRIPE_ENABLED || !stripe || !PREMIUM_PRICE_ID) {
    return { error: "Premium isn't available yet — check back soon." };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Reuse an existing Stripe customer if we have one.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const origin = await siteOrigin();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      ...(sub?.stripe_customer_id
        ? { customer: sub.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      client_reference_id: user.id,
      subscription_data: { metadata: { profile_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${origin}/settings?upgraded=1`,
      cancel_url: `${origin}/premium`,
    });
    return { url: session.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start checkout." };
  }
}

// Open the Stripe customer portal so a subscriber can manage/cancel billing.
export async function createPortalSession() {
  if (!STRIPE_ENABLED || !stripe) {
    return { error: "Billing isn't available yet." };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!sub?.stripe_customer_id) return { error: "No billing account found." };

  const origin = await siteOrigin();
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/settings`,
    });
    return { url: session.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not open billing portal." };
  }
}
