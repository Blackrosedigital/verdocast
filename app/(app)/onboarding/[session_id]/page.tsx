import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { resolveOnboarding } from "@/lib/onboarding";

// Hits Stripe + the DB per request; never cache.
export const dynamic = "force-dynamic";

/**
 * Post-checkout onboarding. Verifies the Checkout Session, idempotently
 * provisions the org + license, then renders the 2-step wizard. If the buyer
 * already finished (a league exists), jump straight to its admin page.
 */
export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const { session_id } = await params;
  const result = await resolveOnboarding(session_id);

  if (result.status === "unpaid" || result.status === "error") {
    redirect("/pricing");
  }

  if (result.existingLeague) {
    redirect(`/admin/league/${result.existingLeague.slug}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Payment received
        </span>
        <h1 className="mt-5 font-display text-5xl tracking-wide text-foreground">
          Let&rsquo;s set up your league
        </h1>
        <p className="mt-2 text-muted-foreground">
          Two quick steps and you&rsquo;ll have a shareable link.
        </p>
      </div>
      <OnboardingWizard sessionId={session_id} defaultOrgName={result.org.name} />
    </main>
  );
}
