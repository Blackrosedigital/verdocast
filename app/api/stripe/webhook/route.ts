import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/db";
import { ensureOrgAndLicense } from "@/lib/onboarding";
import { captureException } from "@/lib/observability";
import { getStripe } from "@/lib/stripe";

// Raw body needed for signature verification; never cache.
export const dynamic = "force-dynamic";

/**
 * Stripe webhook — the SOURCE OF TRUTH for license state (CLAUDE.md).
 * Handles checkout.session.completed (provision org+license) and
 * charge.refunded (expire license + soft-delete leagues). Unhandled events are
 * acknowledged and logged.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json(
      { ok: false, error: "missing signature or secret" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid signature" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Retrieve the full session so customer/email are populated.
        const full = await stripe.checkout.sessions.retrieve(session.id);
        if (full.payment_status === "paid") {
          await ensureOrgAndLicense(full);
        }
        break;
      }
      case "charge.refunded": {
        await handleRefund(event.data.object as Stripe.Charge);
        break;
      }
      default:
        // Acknowledge unhandled events without action.
        break;
    }
  } catch (error) {
    captureException(error, { event: event.type });
    return NextResponse.json(
      { ok: false, error: "handler_error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntent =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);
  if (!paymentIntent) return;

  const admin = createAdminClient();
  const { data: license } = await admin
    .from("licenses")
    .select("id, organization_id")
    .eq("stripe_payment_intent", paymentIntent)
    .maybeSingle();
  if (!license) return;

  const now = new Date().toISOString();
  await admin.from("licenses").update({ expires_at: now }).eq("id", license.id);
  await admin
    .from("leagues")
    .update({ deleted_at: now })
    .eq("organization_id", license.organization_id)
    .is("deleted_at", null);
}
