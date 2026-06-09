import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import type { Database, Enums, Tables } from "@/types/db";

// License runs until the tournament end (19 Jul 2026) + 90-day grace.
const LICENSE_EXPIRES_AT = "2026-10-19T00:00:00Z";

type Admin = SupabaseClient<Database>;

export type OnboardingResolution =
  | { status: "unpaid" }
  | { status: "error" }
  | {
      status: "ok";
      org: Tables<"organizations">;
      license: Tables<"licenses">;
      email: string;
      existingLeague: Tables<"leagues"> | null;
    };

/** A sensible placeholder org name derived from the buyer's email domain. */
function defaultOrgName(email: string): string {
  const domain = email.split("@")[1]?.split(".")[0]?.toLowerCase() ?? "";
  const generic = ["gmail", "outlook", "hotmail", "yahoo", "icloud", "proton", "protonmail", "me", "live"];
  if (!domain || generic.includes(domain)) return "My organization";
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

async function getOrCreateOrg(
  admin: Admin,
  { customerId, email }: { customerId: string; email: string },
): Promise<Tables<"organizations"> | null> {
  const { data: existing } = await admin
    .from("organizations")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from("organizations")
    .insert({
      name: defaultOrgName(email),
      owner_email: email,
      stripe_customer_id: customerId,
    })
    .select()
    .single();
  if (!error && data) return data;

  // Lost a race on the unique stripe_customer_id — fetch the winner.
  const { data: again } = await admin
    .from("organizations")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return again ?? null;
}

async function getOrCreateLicense(
  admin: Admin,
  { session, orgId }: { session: Stripe.Checkout.Session; orgId: string },
): Promise<Tables<"licenses"> | null> {
  const { data: existing } = await admin
    .from("licenses")
    .select("*")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return existing;

  const tier = session.metadata?.tier_id as Enums<"license_tier"> | undefined;
  const maxMembers = Number(session.metadata?.max_members);
  if (!tier || !Number.isFinite(maxMembers) || maxMembers <= 0) return null;

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const { data, error } = await admin
    .from("licenses")
    .insert({
      organization_id: orgId,
      tier,
      max_members: maxMembers,
      amount_paid_pence: session.amount_total ?? 0,
      currency: session.currency ?? "gbp",
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntent,
      expires_at: LICENSE_EXPIRES_AT,
    })
    .select()
    .single();
  if (!error && data) return data;

  const { data: again } = await admin
    .from("licenses")
    .select("*")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  return again ?? null;
}

/**
 * Verify a Checkout Session and idempotently provision the org + license.
 * Read-only w.r.t. cookies, so it's safe to call during a Server Component
 * render. Sign-in happens later, in the completion Server Action.
 */
export async function resolveOnboarding(
  sessionId: string,
): Promise<OnboardingResolution> {
  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch {
    return { status: "error" };
  }

  if (session.payment_status !== "paid") return { status: "unpaid" };

  const provisioned = await ensureOrgAndLicense(session);
  if (!provisioned) return { status: "error" };
  const { org, license, email } = provisioned;

  const { data: leagues } = await createAdminClient()
    .from("leagues")
    .select("*")
    .eq("organization_id", org.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1);

  return {
    status: "ok",
    org,
    license,
    email,
    existingLeague: leagues?.[0] ?? null,
  };
}

/**
 * Idempotently provision the org + license for a paid Checkout Session. Shared
 * by onboarding (the page) and the Stripe webhook (source of truth for license
 * state). Returns null if the session lacks a customer/email.
 */
export async function ensureOrgAndLicense(
  session: Stripe.Checkout.Session,
): Promise<{
  org: Tables<"organizations">;
  license: Tables<"licenses">;
  email: string;
} | null> {
  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);
  if (!email || !customerId) return null;

  const admin = createAdminClient();
  const org = await getOrCreateOrg(admin, { customerId, email });
  if (!org) return null;
  const license = await getOrCreateLicense(admin, { session, orgId: org.id });
  if (!license) return null;
  return { org, license, email };
}
