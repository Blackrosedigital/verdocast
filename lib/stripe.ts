import Stripe from "stripe";

/**
 * Lazily-instantiated Stripe client (server-only).
 *
 * Lazy so that importing this module during a static build does NOT require
 * STRIPE_SECRET_KEY to be present — it's only needed when a checkout actually
 * runs. Always use Stripe Checkout / Customer Portal (CLAUDE.md): never build
 * custom payment forms.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  client = new Stripe(key);
  return client;
}
