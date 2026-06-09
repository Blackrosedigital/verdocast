"use server";

import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { getTier } from "@/lib/pricing";

/** Standard action result shape (CLAUDE.md API conventions). */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };

const TierIdSchema = z.enum(["starter", "pro", "team"]);

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Create a one-time Stripe Checkout Session for a B2B tier and return its URL
 * for client-side redirect. Hosted Checkout only — never a custom form.
 */
export async function startCheckout(
  tierId: string,
): Promise<ActionResult<{ url: string }>> {
  const parsed = TierIdSchema.safeParse(tierId);
  if (!parsed.success) {
    return { ok: false, error: "Unknown plan.", code: "invalid_tier" };
  }

  const tier = getTier(parsed.data);
  if (!tier) {
    return { ok: false, error: "Unknown plan.", code: "invalid_tier" };
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return {
      ok: false,
      error: "Payments aren’t configured yet. Please try again later.",
      code: "stripe_unconfigured",
    };
  }

  // Prefer a pre-created Price (STRIPE_PRICE_STARTER / _PRO / _TEAM); otherwise
  // build the line item inline from the tier's price so test mode works without
  // any Stripe dashboard setup.
  const envPriceId = process.env[`STRIPE_PRICE_${tier.id.toUpperCase()}`];
  const lineItem: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem =
    envPriceId
      ? { price: envPriceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: tier.price_pence,
            product_data: {
              name: `Verdocast — ${tier.name}`,
              description: `Office World Cup 2026 predictor · up to ${tier.max_members} members`,
            },
          },
        };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [lineItem],
      // Stripe substitutes {CHECKOUT_SESSION_ID} into the success URL.
      success_url: `${siteUrl()}/onboarding/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/pricing?canceled=1`,
      billing_address_collection: "auto",
      metadata: {
        tier_id: tier.id,
        max_members: String(tier.max_members),
      },
    });

    if (!session.url) {
      return {
        ok: false,
        error: "Could not start checkout. Please try again.",
        code: "no_session_url",
      };
    }
    return { ok: true, data: { url: session.url } };
  } catch {
    // Avoid logging Stripe payloads (CLAUDE.md: no sensitive data at info level).
    return {
      ok: false,
      error: "Could not start checkout. Please try again.",
      code: "stripe_error",
    };
  }
}
