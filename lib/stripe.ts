import Stripe from "stripe";

// Stripe is optional at build/deploy time: with no secret key configured the
// app still builds and runs — the Upgrade flow just shows "coming soon" until
// the keys are added. Never import this from a client component.
const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey ? new Stripe(secretKey) : null;

// Billing is "live" only when both the secret key and a price id are set.
export const STRIPE_ENABLED = Boolean(secretKey && process.env.STRIPE_PRICE_ID);

export const PREMIUM_PRICE_ID = process.env.STRIPE_PRICE_ID ?? null;

export const PREMIUM_PRICE_LABEL = "$9.99/mo";
