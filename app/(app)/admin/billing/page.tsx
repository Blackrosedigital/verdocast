import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Redirects the admin to the Stripe Customer Portal (invoices, refunds,
 * payment method). Stripe Checkout/Portal only — never a custom billing UI.
 */
export default async function BillingPage() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("stripe_customer_id")
    .eq("owner_email", user.email ?? "")
    .maybeSingle();

  if (org?.stripe_customer_id) {
    try {
      const portal = await getStripe().billingPortal.sessions.create({
        customer: org.stripe_customer_id,
        return_url: `${SITE_URL}/admin`,
      });
      redirect(portal.url);
    } catch (error) {
      // redirect() throws NEXT_REDIRECT — let it propagate.
      if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-4xl tracking-wide text-foreground">
        Billing unavailable
      </h1>
      <p className="text-muted-foreground">
        We couldn&rsquo;t find a billing account for {user.email}. If you just
        purchased, try again in a moment.
      </p>
      <Link href="/admin" className="text-primary underline">
        Back to admin
      </Link>
    </main>
  );
}
