import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

// Stripe webhook: keeps the `subscriptions` table in sync with Stripe. It uses
// the Supabase SERVICE ROLE key (server-only) to write past RLS — that's the
// standard pattern, and it's safe because every request is verified against the
// Stripe signing secret first. Everything is env-guarded, so with no keys set
// this route is a no-op and the app still builds/deploys.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function admin() {
  return createAdminClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const profileId = sub.metadata?.profile_id;
  const db = admin();

  // Prefer the profile_id we stamped at checkout; fall back to the customer map.
  let targetProfile = profileId ?? null;
  if (!targetProfile) {
    const { data } = await db
      .from("subscriptions")
      .select("profile_id")
      .eq("stripe_customer_id", typeof sub.customer === "string" ? sub.customer : sub.customer.id)
      .maybeSingle();
    targetProfile = data?.profile_id ?? null;
  }
  if (!targetProfile) return;

  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  await db.from("subscriptions").upsert(
    {
      profile_id: targetProfile,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: sub.items.data[0]?.price.id ?? null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" }
  );
}

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret || !serviceRoleKey || !supabaseUrl) {
    // Not configured yet — acknowledge so Stripe doesn't retry forever.
    return NextResponse.json({ received: true, configured: false });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    return NextResponse.json({ error: `Invalid signature: ${e instanceof Error ? e.message : ""}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertFromSubscription(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          if (!sub.metadata?.profile_id && session.client_reference_id) {
            sub.metadata = { ...sub.metadata, profile_id: session.client_reference_id };
          }
          await upsertFromSubscription(sub);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
